// Signal deduplication module

import { canonicalizeURL, tokenize, jaccardSimilarity } from './normalize.js';

/**
 * Deduplicate signals using canonical URLs and title similarity.
 *
 * @param {Array} items - Array of signal objects with title, link fields
 * @param {Object} opts
 * @param {number} opts.titleSimilarityThreshold - Jaccard threshold for title near-dedupe (default 0.6)
 * @returns {{ deduped: Array, stats: { before: number, after: number, removed_url: number, removed_title: number } }}
 */
export function dedupeSignals(items, opts = {}) {
  const threshold = opts.titleSimilarityThreshold ?? 0.6;

  if (!items || items.length === 0) {
    return { deduped: [], stats: { before: 0, after: 0, removed_url: 0, removed_title: 0 } };
  }

  const before = items.length;
  let removedURL = 0;
  let removedTitle = 0;

  // Step 1: Canonicalize all URLs
  const withCanonical = items.map(item => ({
    ...item,
    canonical_url: canonicalizeURL(item.link)
  }));

  // Step 2: Dedupe by canonical URL
  const seenURLs = new Set();
  const afterURLDedupe = [];
  for (const item of withCanonical) {
    if (item.canonical_url && seenURLs.has(item.canonical_url)) {
      removedURL++;
      continue;
    }
    if (item.canonical_url) seenURLs.add(item.canonical_url);
    afterURLDedupe.push(item);
  }

  // Step 3: Near-dedupe by title similarity
  const deduped = [];
  const titleTokens = afterURLDedupe.map(item => tokenize(item.title));

  for (let i = 0; i < afterURLDedupe.length; i++) {
    let isDupe = false;
    for (let j = 0; j < deduped.length; j++) {
      const sim = jaccardSimilarity(titleTokens[i], tokenize(deduped[j].title));
      if (sim >= threshold) {
        isDupe = true;
        removedTitle++;
        break;
      }
    }
    if (!isDupe) {
      deduped.push(afterURLDedupe[i]);
    }
  }

  return {
    deduped,
    stats: {
      before,
      after: deduped.length,
      removed_url: removedURL,
      removed_title: removedTitle
    }
  };
}

/**
 * Dedupe signals grouped by source category.
 * Returns deduped items and per-source stats.
 */
export function dedupeByCategory(signalGroups, opts = {}) {
  // Flatten all items
  const allItems = [];
  const sourceStats = {};

  for (const [category, items] of Object.entries(signalGroups)) {
    const arr = Array.isArray(items) ? items : [];
    sourceStats[category] = { before: arr.length };
    allItems.push(...arr);
  }

  const { deduped, stats } = dedupeSignals(allItems, opts);

  // Rebuild per-source after counts
  for (const category of Object.keys(sourceStats)) {
    sourceStats[category].after = deduped.filter(i => {
      // Match back to original category
      const items = signalGroups[category];
      if (!Array.isArray(items)) return false;
      return items.some(orig => orig.link === i.link || orig.title === i.title);
    }).length;
  }

  return { deduped, stats, sourceStats };
}
