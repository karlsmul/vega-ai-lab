import { collectRSS } from './rss.js';
import { collectHackerNews } from './hackernews.js';
import { collectGitHubTrending } from './github.js';
import { collectProductHunt } from './producthunt.js';
import { dedupeSignals } from '../lib/dedupe.js';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

/**
 * Collect all signals, canonicalize URLs, deduplicate.
 * @param {import('../lib/health.js').HealthTracker} [health] - optional health tracker
 * @returns {Object} signals object
 */
export async function collectAll(health) {
  const config = JSON.parse(readFileSync(join(ROOT, 'directives', 'config.json'), 'utf-8'));
  const today = new Date().toISOString().split('T')[0];
  const dedupeThreshold = config.dedupe?.titleSimilarityThreshold ?? 0.6;

  console.log(`\n📡 Collecting signals for ${today}...\n`);

  const [rssResult, hnResult, ghResult, phResult] = await Promise.all([
    collectRSS(config.sources.rss),
    collectHackerNews(config.sources.web),
    collectGitHubTrending(config.sources.web),
    collectProductHunt(config.sources.web)
  ]);

  // Record collector health
  if (health) {
    for (const result of [rssResult, hnResult, ghResult, phResult]) {
      for (const [name, info] of Object.entries(result.health)) {
        health.recordCollector(name, info.count, info.ok);
      }
    }
  }

  // Raw counts before dedupe
  const rawCounts = {
    rss: rssResult.items.length,
    hackernews: hnResult.items.length,
    github: ghResult.items.length,
    producthunt: phResult.items.length,
    total: rssResult.items.length + hnResult.items.length + ghResult.items.length + phResult.items.length
  };

  // Deduplicate each group
  const rssDedupe = dedupeSignals(rssResult.items, { titleSimilarityThreshold: dedupeThreshold });
  const hnDedupe = dedupeSignals(hnResult.items, { titleSimilarityThreshold: dedupeThreshold });
  const ghDedupe = dedupeSignals(ghResult.items, { titleSimilarityThreshold: dedupeThreshold });
  const phDedupe = dedupeSignals(phResult.items, { titleSimilarityThreshold: dedupeThreshold });

  const afterCounts = {
    rss: rssDedupe.deduped.length,
    hackernews: hnDedupe.deduped.length,
    github: ghDedupe.deduped.length,
    producthunt: phDedupe.deduped.length,
    total: rssDedupe.deduped.length + hnDedupe.deduped.length + ghDedupe.deduped.length + phDedupe.deduped.length
  };

  if (health) {
    health.signalsBeforeDedupe = rawCounts.total;
    health.signalsAfterDedupe = afterCounts.total;
  }

  const allSignals = {
    date: today,
    collected_at: new Date().toISOString(),
    ai_news: rssDedupe.deduped,
    tech_trends: {
      hackernews: hnDedupe.deduped,
      github_trending: ghDedupe.deduped
    },
    business_signals: phDedupe.deduped,
    stats: {
      ...afterCounts,
      before_dedupe: rawCounts,
      dedupe: {
        rss: rssDedupe.stats,
        hackernews: hnDedupe.stats,
        github: ghDedupe.stats,
        producthunt: phDedupe.stats,
      }
    }
  };

  // Save raw signals to .tmp
  const tmpDir = join(ROOT, '.tmp');
  mkdirSync(tmpDir, { recursive: true });
  writeFileSync(join(tmpDir, `signals-${today}.json`), JSON.stringify(allSignals, null, 2));

  const dedupeRemoved = rawCounts.total - afterCounts.total;
  console.log(`\n📊 Collection complete:`);
  console.log(`   RSS feeds: ${afterCounts.rss} items (${rawCounts.rss} raw)`);
  console.log(`   HackerNews: ${afterCounts.hackernews} items (${rawCounts.hackernews} raw)`);
  console.log(`   GitHub Trending: ${afterCounts.github} repos (${rawCounts.github} raw)`);
  console.log(`   ProductHunt: ${afterCounts.producthunt} products (${rawCounts.producthunt} raw)`);
  console.log(`   Total: ${afterCounts.total} signals (${dedupeRemoved} duplicates removed)\n`);

  if (health) {
    health.log(`Collection: ${afterCounts.total} signals (${dedupeRemoved} dupes removed)`);
  }

  return allSignals;
}
