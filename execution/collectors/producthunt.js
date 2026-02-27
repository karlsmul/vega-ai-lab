import * as cheerio from 'cheerio';
import { canonicalizeURL } from '../lib/normalize.js';

export async function collectProductHunt(sources) {
  const results = [];
  const health = {};
  const phSource = sources.find(s => s.name === 'ProductHunt AI');
  if (!phSource) return { items: results, health };

  try {
    console.log(`  Fetching: ${phSource.name}...`);
    const res = await fetch(phSource.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html'
      },
      signal: AbortSignal.timeout(15000)
    });
    const html = await res.text();
    const $ = cheerio.load(html);

    // Extract product entries from the page
    $('[data-test="post-item"], .styles_item__lxMn3, a[href*="/posts/"]').each((i, el) => {
      const title = $(el).find('h3, [data-test="post-name"]').first().text().trim();
      const tagline = $(el).find('p, [data-test="tagline"]').first().text().trim();
      const link = $(el).attr('href') || $(el).find('a').first().attr('href') || '';
      const fullLink = link.startsWith('http') ? link : `https://www.producthunt.com${link}`;

      if (title && title.length > 2) {
        results.push({
          title,
          link: fullLink,
          canonical_url: canonicalizeURL(fullLink),
          summary: tagline,
          source: phSource.name,
          category: phSource.category
        });
      }
    });

    // Fallback: try generic link extraction if structured selectors fail
    if (results.length === 0) {
      const seen = new Set();
      $('a').each((i, el) => {
        const href = $(el).attr('href') || '';
        const text = $(el).text().trim();
        if (href.includes('/posts/') && text.length > 5 && !seen.has(href)) {
          seen.add(href);
          const fullLink = href.startsWith('http') ? href : `https://www.producthunt.com${href}`;
          results.push({
            title: text.slice(0, 100),
            link: fullLink,
            canonical_url: canonicalizeURL(fullLink),
            summary: '',
            source: phSource.name,
            category: phSource.category
          });
        }
      });
    }

    health[phSource.name] = { count: results.length, ok: true };
    console.log(`  ✓ ${phSource.name}: ${results.length} products`);
  } catch (err) {
    health[phSource.name] = { count: 0, ok: false, error: err.message };
    console.warn(`  ✗ ${phSource.name}: ${err.message}`);
  }

  return { items: results, health };
}
