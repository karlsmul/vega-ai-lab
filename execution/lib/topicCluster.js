// Deterministic topic clustering module
// Two-phase approach:
//   Phase 1: Keyword-theme assignment (broad, reliable grouping)
//   Phase 2: Jaccard merging within themes + clustering of unassigned items

import { tokenize, jaccardSimilarity, stableHash } from './normalize.js';

// Well-known AI theme patterns
const THEME_PATTERNS = [
  { theme: 'AI Agents & Autonomie', pattern: /\b(agent|agentic|multi.?agent|autonomous|crew|swarm|tool.?use|mcp|function.?call)\b/i },
  { theme: 'Open Source AI', pattern: /\b(open.?source|oss|llama|mistral|qwen|deepseek|phi|gemma|mixtral|falcon)\b/i },
  { theme: 'RAG & Retrieval', pattern: /\b(rag|retriev|vector|embed|knowledge.?base|semantic.?search|chunk)\b/i },
  { theme: 'Model Fine-tuning & Training', pattern: /\b(fine.?tun|lora|qlora|train|dataset|benchmark|eval)\b/i },
  { theme: 'Voice & Audio AI', pattern: /\b(voice|speech|whisper|tts|audio|transcri|podcast|sound)\b/i },
  { theme: 'Image & Vision AI', pattern: /\b(image|vision|diffusion|stable|flux|comfy|dall.?e|midjourney|ocr|screenshot)\b/i },
  { theme: 'AI Coding & Dev Tools', pattern: /\b(code|coding|copilot|dev.?tool|ide|vscode|cursor|cline|swe.?bench|programming)\b/i },
  { theme: 'AI Automation & Workflows', pattern: /\b(automat|workflow|pipeline|n8n|zapier|make\.com|no.?code|rpa)\b/i },
  { theme: 'Local & Privacy AI', pattern: /\b(local|ollama|llama\.cpp|gguf|privacy|on.?prem|offline|self.?host)\b/i },
  { theme: 'AI Infrastructure & APIs', pattern: /\b(api|sdk|platform|infra|deploy|scale|gpu|cloud|server|hosting)\b/i },
  { theme: 'AI Produkte & SaaS', pattern: /\b(saas|startup|launch|product.?hunt|indie|ship|pricing|mvp|revenue)\b/i },
  { theme: 'Video & Multimedia AI', pattern: /\b(video|sora|gen.?3|runway|animation|render|3d|music)\b/i },
  { theme: 'AI Reasoning & Chains', pattern: /\b(reasoning|o1|o3|o4|think|chain.?of.?thought|cot|step.?by.?step)\b/i },
  { theme: 'Chatbots & Conversational AI', pattern: /\b(chat|chatbot|gpt|claude|gemini|conversation|dialog|assistant)\b/i },
  { theme: 'AI Safety & Regulation', pattern: /\b(safety|alignment|regulat|bias|ethic|responsible|guardrail|restrict|ban)\b/i },
  { theme: 'AI in Forschung & Wissenschaft', pattern: /\b(research|paper|arxiv|study|scientific|academ|university|lab)\b/i },
  { theme: 'NLP & Text AI', pattern: /\b(nlp|text|language|translat|summar|classif|sentiment|token|bert)\b/i },
  { theme: 'AI Sales & Marketing', pattern: /\b(sales|marketing|outreach|lead|crm|email|content.?creat|seo|copywriting)\b/i },
  { theme: 'Data & Analytics AI', pattern: /\b(data|analytics|dashboard|insight|monitor|sql|database|warehouse)\b/i },
  { theme: 'AI Bots & Integrationen', pattern: /\b(bot|slack|discord|telegram|whatsapp|integrat|webhook|notif)\b/i },
];

/**
 * Cluster signals into topics.
 * Phase 1: Assign items to keyword themes.
 * Phase 2: Jaccard-cluster remaining unassigned items.
 * Phase 3: Within each theme, sub-cluster very similar items.
 *
 * @param {Array} items - Deduped signal items
 * @param {Object} opts
 * @param {number} opts.mergeThreshold - Jaccard threshold for phase 2 (default 0.3)
 * @param {number} opts.minClusterSize - Minimum items per topic (default 1)
 * @returns {Array<Topic>}
 */
export function clusterTopics(items, opts = {}) {
  const mergeThreshold = opts.mergeThreshold ?? 0.3;
  const minClusterSize = opts.minClusterSize ?? 1;

  if (!items || items.length === 0) return [];

  // Phase 1: Keyword theme assignment
  const themeMap = {};  // theme name → items[]
  const assigned = new Set();

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const text = `${item.title} ${item.summary || ''}`;

    for (const { theme, pattern } of THEME_PATTERNS) {
      if (pattern.test(text)) {
        if (!themeMap[theme]) themeMap[theme] = [];
        themeMap[theme].push(item);
        assigned.add(i);
        break; // Each item goes to at most one theme
      }
    }
  }

  // Phase 2: Cluster unassigned items via Jaccard
  const unassigned = items.filter((_, i) => !assigned.has(i));
  const jaccardClusters = clusterByJaccard(unassigned, mergeThreshold);

  // Build topic objects
  const topics = [];

  // Theme topics
  for (const [theme, themeItems] of Object.entries(themeMap)) {
    if (themeItems.length >= minClusterSize) {
      topics.push(buildTopic(themeItems, theme));
    }
  }

  // Jaccard-clustered topics from unassigned items
  for (const cluster of jaccardClusters) {
    if (cluster.length >= minClusterSize) {
      topics.push(buildTopic(cluster, null));
    }
  }

  // Sort by signal_strength descending
  topics.sort((a, b) => b.signal_strength - a.signal_strength);

  // Assign ranks
  topics.forEach((t, i) => { t.rank = i + 1; });

  return topics;
}

/**
 * Simple Jaccard agglomerative clustering for unassigned items.
 */
function clusterByJaccard(items, threshold) {
  if (items.length === 0) return [];

  const tokenized = items.map(item => ({
    item,
    tokens: tokenize(`${item.title} ${item.summary || ''}`)
  }));

  const clusters = tokenized.map((_, i) => [i]);
  const cTokens = tokenized.map(it => [...it.tokens]);

  let merged = true;
  while (merged) {
    merged = false;
    for (let i = 0; i < clusters.length; i++) {
      if (!clusters[i]) continue;
      for (let j = i + 1; j < clusters.length; j++) {
        if (!clusters[j]) continue;
        if (jaccardSimilarity(cTokens[i], cTokens[j]) >= threshold) {
          clusters[i].push(...clusters[j]);
          const combined = new Set([...cTokens[i], ...cTokens[j]]);
          cTokens[i] = [...combined];
          clusters[j] = null;
          merged = true;
        }
      }
    }
  }

  return clusters
    .filter(c => c !== null)
    .map(c => c.map(idx => tokenized[idx].item));
}

/**
 * Build a topic object from a cluster of items.
 * @param {Array} items - Items in this topic
 * @param {string|null} themeName - If from keyword theme, the theme name. Otherwise null.
 */
function buildTopic(items, themeName) {
  // Sort by descriptiveness (title length) then by engagement
  const sorted = [...items].sort((a, b) => {
    const scoreA = (a.points || 0) + (a.starsToday || 0) * 10 + (a.title?.length || 0);
    const scoreB = (b.points || 0) + (b.starsToday || 0) * 10 + (b.title?.length || 0);
    return scoreB - scoreA;
  });

  // Topic title: use theme name if available, otherwise best representative
  const topicTitle = themeName || sorted[0].title;

  // Stable topic_id
  const idSource = themeName
    ? themeName.toLowerCase().replace(/[^a-z0-9]/g, '_')
    : tokenize(topicTitle).slice(0, 5).sort().join('_');
  const topicId = stableHash(idSource);

  // Collect unique sources and categories
  const sources = [...new Set(items.map(i => i.source).filter(Boolean))];
  const categories = [...new Set(items.map(i => i.category).filter(Boolean))];

  // Compute signal_strength
  const sourceCount = sources.length;
  const itemCount = items.length;
  const totalPoints = items.reduce((s, i) => s + (i.points || 0), 0);
  const totalStars = items.reduce((s, i) => s + (i.starsToday || 0), 0);

  const now = new Date();
  const recentCount = items.filter(i => {
    if (!i.date) return true;
    const d = new Date(i.date);
    return (now - d) / (1000 * 60 * 60) < 48;
  }).length;

  const signal_strength = (
    itemCount * 3 +
    sourceCount * 4 +
    Math.min(totalPoints / 20, 10) +
    Math.min(totalStars / 10, 10) +
    recentCount * 1.5
  );

  // Summary bullets from top items
  const summaryBullets = sorted.slice(0, 4).map(i => {
    const detail = i.summary ? `: ${i.summary.slice(0, 120)}` : '';
    return `${i.title}${detail}`;
  });

  // Evidence links
  const evidenceLinks = [...new Set(
    items.map(i => i.canonical_url || i.link).filter(Boolean)
  )].slice(0, 8);

  // Representative items
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
    rank: 0
  };
}
