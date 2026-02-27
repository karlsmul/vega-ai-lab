import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { queryAI, hasAPIKey } from './ai-client.js';
import { clusterTopics } from '../lib/topicCluster.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

/**
 * Analyze trends: cluster signals into topics and produce a ranked report.
 *
 * @param {Object} signals - Collected (deduped) signals
 * @param {import('../lib/health.js').HealthTracker} [health]
 * @returns {{ report: string, topics: Array }}
 */
export async function analyzeTrends(signals, health) {
  console.log('🔍 Analyzing trends...');

  // Flatten all signals into a single array
  const allItems = [
    ...signals.ai_news,
    ...signals.tech_trends.hackernews,
    ...signals.tech_trends.github_trending,
    ...signals.business_signals,
  ];

  // Cluster into topics
  const topics = clusterTopics(allItems, { mergeThreshold: 0.35, minClusterSize: 1 });

  if (health) {
    health.topicsCount = topics.length;
  }

  // Save topics.json to .tmp
  const tmpDir = join(ROOT, '.tmp');
  mkdirSync(tmpDir, { recursive: true });
  writeFileSync(join(tmpDir, `topics-${signals.date}.json`), JSON.stringify(topics, null, 2));

  // Build markdown report
  let report;
  if (hasAPIKey()) {
    report = await buildReportWithAI(signals, topics);
  }
  if (!report) {
    report = buildReportHeuristic(signals, topics);
  }

  console.log(`  ✓ ${topics.length} topics clustered, top ${Math.min(topics.length, 15)} in report`);
  if (health) health.log(`Trends: ${topics.length} topics clustered`);

  return { report, topics };
}

async function buildReportWithAI(signals, topics) {
  try {
    const promptTemplate = readFileSync(
      join(ROOT, 'directives', 'prompts', 'analyze-trends.md'), 'utf-8'
    );
    const topicSummary = formatTopicsForPrompt(topics.slice(0, 15));
    const prompt = promptTemplate.replace('{{signals}}', topicSummary);
    const result = await queryAI(prompt);
    if (result) {
      console.log('  ✓ AI-powered trend analysis complete');
      return result;
    }
  } catch (err) {
    console.warn(`  ⚠ AI trend analysis failed: ${err.message}`);
  }
  return null;
}

function buildReportHeuristic(signals, topics) {
  const topN = topics.slice(0, 15);
  const total = signals.stats.total;

  let report = `# AI Trends Report — ${signals.date}\n\n`;
  report += `*${topics.length} Themen erkannt aus ${total} Signalen (${countSources(signals)} Quellen).*\n\n`;

  for (const topic of topN) {
    report += `### ${topic.rank}. ${topic.topic_title}\n\n`;
    report += `**Signalstärke:** ${topic.signal_strength} · **Einträge:** ${topic.item_count} · **Quellen:** ${topic.sources.join(', ')}\n\n`;

    if (topic.summary.length > 0) {
      report += `**Wichtigste Signale:**\n`;
      for (const bullet of topic.summary) {
        report += `- ${bullet}\n`;
      }
      report += '\n';
    }

    if (topic.evidence_links.length > 0) {
      report += `**Belege:**\n`;
      for (const link of topic.evidence_links.slice(0, 4)) {
        report += `- ${link}\n`;
      }
      report += '\n';
    }

    report += `**Kategorien:** ${topic.categories.join(', ')}\n\n---\n\n`;
  }

  return report;
}

function formatTopicsForPrompt(topics) {
  let text = '';
  for (const t of topics) {
    text += `## Topic (rank ${t.rank}, strength ${t.signal_strength}): ${t.topic_title}\n`;
    text += `Sources: ${t.sources.join(', ')}\n`;
    text += `Items (${t.item_count}):\n`;
    for (const item of t.representative_items) {
      text += `- ${item.title} (${item.source})\n`;
    }
    text += '\n';
  }
  return text;
}

function countSources(signals) {
  const sources = new Set();
  for (const item of signals.ai_news) sources.add(item.source);
  for (const item of signals.tech_trends.hackernews) sources.add(item.source);
  for (const item of signals.tech_trends.github_trending) sources.add(item.source);
  for (const item of signals.business_signals) sources.add(item.source);
  return sources.size;
}

/**
 * Format signals for prompt (used by opportunities.js).
 */
export function formatSignalsForPrompt(signals) {
  let summary = '## AI News (RSS Feeds)\n\n';
  for (const item of signals.ai_news.slice(0, 20)) {
    summary += `- **${item.title}** (${item.source}): ${item.summary?.slice(0, 200) || 'No summary'}\n`;
  }

  summary += '\n## HackerNews AI Discussions\n\n';
  const hnSorted = [...signals.tech_trends.hackernews].sort((a, b) => (b.points || 0) - (a.points || 0));
  for (const item of hnSorted.slice(0, 20)) {
    summary += `- **${item.title}** — ${item.points} points, ${item.comments} comments\n`;
  }

  summary += '\n## GitHub Trending AI Repos\n\n';
  for (const item of signals.tech_trends.github_trending.slice(0, 15)) {
    summary += `- **${item.title}** (${item.language || 'Unknown'}): ${item.summary?.slice(0, 150) || 'No description'}. Stars today: ${item.starsToday}\n`;
  }

  summary += '\n## ProductHunt / Business Signals\n\n';
  for (const item of signals.business_signals.slice(0, 15)) {
    summary += `- **${item.title}**: ${item.summary?.slice(0, 150) || 'No description'}\n`;
  }

  return summary;
}
