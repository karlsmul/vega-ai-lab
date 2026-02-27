// Deterministic topic clustering module

import { tokenize, jaccardSimilarity, stableHash } from './normalize.js';

/**
 * Cluster signals into topics using deterministic Jaccard-based merging.
 *
 * @param {Array} items - Deduped signal items with title, link, summary, source, category, date fields
 * @param {Object} opts
 * @param {number} opts.mergeThreshold - Jaccard threshold to merge items into same topic (default 0.35)
 * @param {number} opts.minClusterSize - Minimum items per topic to keep (default 1)
 * @returns {Array<Topic>}
 */
export function clusterTopics(items, opts = {}) {
  const mergeThreshold = opts.mergeThreshold ?? 0.35;
  const minClusterSize = opts.minClusterSize ?? 1;

  if (!items || items.length === 0) return [];

  // Pre-compute tokens for each item
  const itemTokens = items.map(item => ({
    item,
    tokens: tokenize(`${item.title} ${item.summary || ''}`)
  }));

  // Greedy agglomerative clustering
  // Each cluster is an array of indices
  const clusters = itemTokens.map((_, i) => [i]);
  const clusterTokens = itemTokens.map(it => [...it.tokens]);

  let merged = true;
  while (merged) {
    merged = false;
    for (let i = 0; i < clusters.length; i++) {
      if (!clusters[i]) continue;
      for (let j = i + 1; j < clusters.length; j++) {
        if (!clusters[j]) continue;

        const sim = jaccardSimilarity(clusterTokens[i], clusterTokens[j]);
        if (sim >= mergeThreshold) {
          // Merge j into i
          clusters[i].push(...clusters[j]);
          // Union tokens
          const combined = new Set([...clusterTokens[i], ...clusterTokens[j]]);
          clusterTokens[i] = [...combined];
          clusters[j] = null;
          merged = true;
        }
      }
    }
  }

  // Build topic objects from clusters
  const topics = [];
  for (let i = 0; i < clusters.length; i++) {
    if (!clusters[i] || clusters[i].length < minClusterSize) continue;

    const clusterItems = clusters[i].map(idx => itemTokens[idx].item);
    const topic = buildTopic(clusterItems, clusterTokens[i]);
    topics.push(topic);
  }

  // Sort by signal_strength descending
  topics.sort((a, b) => b.signal_strength - a.signal_strength);

  // Assign ranks
  topics.forEach((t, i) => { t.rank = i + 1; });

  return topics;
}

/**
 * Build a topic object from a cluster of items.
 */
function buildTopic(items, tokens) {
  // Pick representative: item with longest title (most descriptive)
  const sorted = [...items].sort((a, b) => (b.title?.length || 0) - (a.title?.length || 0));
  const representative = sorted[0];

  // Generate topic title from most common meaningful tokens
  const tokenFreq = {};
  for (const item of items) {
    const itemToks = tokenize(item.title);
    for (const t of itemToks) {
      tokenFreq[t] = (tokenFreq[t] || 0) + 1;
    }
  }

  // Use representative title as topic title (most readable)
  const topicTitle = representative.title;

  // Stable topic_id from normalized sorted key tokens
  const keyTokens = Object.entries(tokenFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([t]) => t)
    .sort()
    .join('_');
  const topicId = stableHash(keyTokens);

  // Collect unique sources
  const sources = [...new Set(items.map(i => i.source).filter(Boolean))];

  // Collect unique categories
  const categories = [...new Set(items.map(i => i.category).filter(Boolean))];

  // Compute signal_strength
  // Factors: number of sources, number of items, recency, engagement
  const sourceCount = sources.length;
  const itemCount = items.length;
  const avgPoints = items.reduce((s, i) => s + (i.points || 0), 0) / itemCount;
  const avgStars = items.reduce((s, i) => s + (i.starsToday || 0), 0) / itemCount;

  // Recency: how many items are from today or yesterday
  const now = new Date();
  const recentCount = items.filter(i => {
    if (!i.date) return true; // No date = assume recent
    const d = new Date(i.date);
    const ageHours = (now - d) / (1000 * 60 * 60);
    return ageHours < 48;
  }).length;

  const signal_strength = (
    itemCount * 2 +
    sourceCount * 3 +
    Math.min(avgPoints / 10, 5) +
    Math.min(avgStars / 20, 5) +
    recentCount * 1.5
  );

  // Build summary bullets from top items
  const summaryBullets = sorted.slice(0, 4).map(i => {
    const detail = i.summary ? `: ${i.summary.slice(0, 120)}` : '';
    return `${i.title}${detail}`;
  });

  // Evidence links (canonical URLs, up to 8)
  const evidenceLinks = [...new Set(
    items.map(i => i.canonical_url || i.link).filter(Boolean)
  )].slice(0, 8);

  // Representative items (top 3)
  const representativeItems = sorted.slice(0, 3).map(i => ({
    title: i.title,
    source: i.source,
    url: i.canonical_url || i.link,
    published_at: i.date || null
  }));

  return {
    topic_id: topicId,
    topic_title: topicTitle,
    summary: summaryBullets,
    signal_strength: Math.round(signal_strength * 10) / 10,
    evidence_links: evidenceLinks,
    representative_items: representativeItems,
    categories,
    sources,
    item_count: itemCount,
    rank: 0 // assigned after sorting
  };
}
