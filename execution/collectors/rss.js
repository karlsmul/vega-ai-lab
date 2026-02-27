import RSSParser from 'rss-parser';
import { canonicalizeURL, stripHTML } from '../lib/normalize.js';

const parser = new RSSParser({
  timeout: 15000,
  headers: {
    'User-Agent': 'AI-Opportunity-Machine/1.0'
  }
});

export async function collectRSS(sources) {
  const results = [];
  const health = {};

  for (const source of sources) {
    try {
      console.log(`  Fetching RSS: ${source.name}...`);
      const feed = await parser.parseURL(source.url);
      const items = (feed.items || []).slice(0, 15).map(item => ({
        title: item.title || '',
        link: item.link || '',
        canonical_url: canonicalizeURL(item.link || ''),
        date: item.pubDate || item.isoDate || '',
        summary: stripHTML(item.contentSnippet || item.content || '').slice(0, 500),
        source: source.name,
        category: source.category
      }));
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
