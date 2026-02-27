import { canonicalizeURL } from '../lib/normalize.js';

export async function collectHackerNews(sources) {
  const results = [];
  const health = {};

  for (const source of sources) {
    if (source.type !== 'json') continue;
    if (!source.url.includes('hn.algolia.com')) continue;

    try {
      console.log(`  Fetching: ${source.name}...`);
      const res = await fetch(source.url, {
        headers: { 'User-Agent': 'AI-Opportunity-Machine/1.0' },
        signal: AbortSignal.timeout(15000)
      });
      const data = await res.json();
      const items = (data.hits || []).map(hit => {
        const rawLink = hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`;
        return {
          title: hit.title || '',
          link: rawLink,
          canonical_url: canonicalizeURL(rawLink),
          date: hit.created_at || '',
          summary: '',
          points: hit.points || 0,
          comments: hit.num_comments || 0,
          source: source.name,
          category: source.category
        };
      });
      results.push(...items);
      health[source.name] = { count: items.length, ok: true };
      console.log(`  ✓ ${source.name}: ${items.length} items`);
    } catch (err) {
      health[source.name] = { count: 0, ok: false, error: err.message };
      console.warn(`  ✗ ${source.name}: ${err.message}`);
    }
  }

  return { items: results, health };
}
