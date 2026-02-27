import * as cheerio from 'cheerio';
import { canonicalizeURL } from '../lib/normalize.js';

export async function collectGitHubTrending(sources) {
  const results = [];
  const health = {};
  const ghSource = sources.find(s => s.name === 'GitHub Trending AI');
  if (!ghSource) return { items: results, health };

  try {
    console.log(`  Fetching: ${ghSource.name}...`);
    const res = await fetch(ghSource.url, {
      headers: {
        'User-Agent': 'AI-Opportunity-Machine/1.0',
        'Accept': 'text/html'
      },
      signal: AbortSignal.timeout(15000)
    });
    const html = await res.text();
    const $ = cheerio.load(html);

    $('article.Box-row').each((i, el) => {
      const repoPath = $(el).find('h2 a').attr('href')?.trim();
      if (!repoPath) return;

      const name = repoPath.replace(/^\//, '');
      const description = $(el).find('p').text().trim();
      const language = $(el).find('[itemprop="programmingLanguage"]').text().trim();
      const starsText = $(el).find('.d-inline-block.float-sm-right').text().trim();
      const starsToday = parseInt(starsText.replace(/[^0-9]/g, '')) || 0;

      // Filter for AI-related repos
      const aiKeywords = /\b(ai|llm|gpt|transformer|neural|ml|machine.?learn|deep.?learn|diffusion|rag|agent|langchain|ollama|openai|anthropic|hugging|embedding|vector|fine.?tun|lora|gguf|whisper|stable|comfy|vision|nlp|bert|token|prompt|copilot|chatbot|claude)\b/i;
      const text = `${name} ${description}`;
      if (!aiKeywords.test(text)) return;

      const rawLink = `https://github.com${repoPath}`;
      results.push({
        title: name,
        link: rawLink,
        canonical_url: canonicalizeURL(rawLink),
        summary: description,
        language,
        starsToday,
        source: ghSource.name,
        category: ghSource.category
      });
    });

    health[ghSource.name] = { count: results.length, ok: true };
    console.log(`  ✓ ${ghSource.name}: ${results.length} AI repos`);
  } catch (err) {
    health[ghSource.name] = { count: 0, ok: false, error: err.message };
    console.warn(`  ✗ ${ghSource.name}: ${err.message}`);
  }

  return { items: results, health };
}
