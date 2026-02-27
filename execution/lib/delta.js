// Delta tracking: compare today's topics with previous days

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Compute delta between today's topics and the most recent prior day's topics.
 *
 * @param {Array} todayTopics - Today's topic objects
 * @param {string} deliverablesDir - Path to deliverables/ directory
 * @param {string} today - Today's date string YYYY-MM-DD
 * @returns {Object} delta object
 */
export function computeDelta(todayTopics, deliverablesDir, today) {
  const previousTopics = loadPreviousTopics(deliverablesDir, today);
  const weekTopics = loadWeekTopics(deliverablesDir, today, 7);

  const todayMap = new Map(todayTopics.map(t => [t.topic_id, t]));
  const prevMap = previousTopics ? new Map(previousTopics.map(t => [t.topic_id, t])) : null;

  const delta = {
    date: today,
    compared_to: null,
    new_topics: [],
    dropped_topics: [],
    movers_up: [],
    movers_down: [],
    recurring_topics: [],
  };

  if (!prevMap) {
    // No previous data — all topics are "new"
    delta.new_topics = todayTopics.map(t => ({
      topic_id: t.topic_id,
      topic_title: t.topic_title,
      rank: t.rank,
      signal_strength: t.signal_strength,
    }));
    return delta;
  }

  delta.compared_to = previousTopics._date || 'unknown';

  // New topics: in today but not in previous
  for (const [id, topic] of todayMap) {
    if (!prevMap.has(id)) {
      delta.new_topics.push({
        topic_id: id,
        topic_title: topic.topic_title,
        rank: topic.rank,
        signal_strength: topic.signal_strength,
      });
    }
  }

  // Dropped topics: in previous but not in today
  for (const [id, topic] of prevMap) {
    if (!todayMap.has(id)) {
      delta.dropped_topics.push({
        topic_id: id,
        topic_title: topic.topic_title,
        previous_rank: topic.rank,
      });
    }
  }

  // Movers: in both, rank changed
  for (const [id, topic] of todayMap) {
    if (prevMap.has(id)) {
      const prev = prevMap.get(id);
      const rankChange = prev.rank - topic.rank; // positive = moved up
      const evidenceChange = topic.item_count - (prev.item_count || 0);

      if (rankChange > 0) {
        delta.movers_up.push({
          topic_id: id,
          topic_title: topic.topic_title,
          rank: topic.rank,
          previous_rank: prev.rank,
          rank_change: rankChange,
          evidence_count_change: evidenceChange,
        });
      } else if (rankChange < 0) {
        delta.movers_down.push({
          topic_id: id,
          topic_title: topic.topic_title,
          rank: topic.rank,
          previous_rank: prev.rank,
          rank_change: rankChange,
          evidence_count_change: evidenceChange,
        });
      }
    }
  }

  // Sort movers by magnitude
  delta.movers_up.sort((a, b) => b.rank_change - a.rank_change);
  delta.movers_down.sort((a, b) => a.rank_change - b.rank_change);

  // Recurring topics: seen >= 3 days in last 7
  const topicDayCounts = {};
  for (const dayTopics of weekTopics) {
    for (const t of dayTopics) {
      topicDayCounts[t.topic_id] = topicDayCounts[t.topic_id] || { count: 0, title: t.topic_title };
      topicDayCounts[t.topic_id].count++;
    }
  }
  // Add today
  for (const t of todayTopics) {
    topicDayCounts[t.topic_id] = topicDayCounts[t.topic_id] || { count: 0, title: t.topic_title };
    topicDayCounts[t.topic_id].count++;
  }

  for (const [id, info] of Object.entries(topicDayCounts)) {
    if (info.count >= 3) {
      delta.recurring_topics.push({
        topic_id: id,
        topic_title: info.title,
        days_seen: info.count,
      });
    }
  }
  delta.recurring_topics.sort((a, b) => b.days_seen - a.days_seen);

  return delta;
}

/**
 * Load topics.json from the most recent prior deliverables day.
 */
function loadPreviousTopics(deliverablesDir, today) {
  const days = getPriorDays(deliverablesDir, today);
  if (days.length === 0) return null;

  const latestDay = days[0];
  const topicsPath = join(deliverablesDir, latestDay, 'topics.json');
  if (!existsSync(topicsPath)) return null;

  try {
    const topics = JSON.parse(readFileSync(topicsPath, 'utf-8'));
    topics._date = latestDay;
    return topics;
  } catch {
    return null;
  }
}

/**
 * Load topics.json from the last N days (excluding today).
 */
function loadWeekTopics(deliverablesDir, today, days) {
  const priorDays = getPriorDays(deliverablesDir, today).slice(0, days);
  const results = [];

  for (const day of priorDays) {
    const topicsPath = join(deliverablesDir, day, 'topics.json');
    if (!existsSync(topicsPath)) continue;
    try {
      results.push(JSON.parse(readFileSync(topicsPath, 'utf-8')));
    } catch {}
  }

  return results;
}

/**
 * Get sorted prior day directories (newest first, excluding today).
 */
function getPriorDays(deliverablesDir, today) {
  if (!existsSync(deliverablesDir)) return [];

  return readdirSync(deliverablesDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(d.name) && d.name < today)
    .map(d => d.name)
    .sort()
    .reverse();
}
