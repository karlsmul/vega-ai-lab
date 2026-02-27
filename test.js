// Lightweight tests for core modules
// Run: node test.js

import { canonicalizeURL, tokenize, jaccardSimilarity, stableHash, stripHTML } from './execution/lib/normalize.js';
import { dedupeSignals } from './execution/lib/dedupe.js';
import { clusterTopics } from './execution/lib/topicCluster.js';
import { computeDelta } from './execution/lib/delta.js';

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`  FAIL: ${label}`);
  }
}

// --- normalize.js ---
console.log('Testing normalize.js...');

assert(
  canonicalizeURL('http://example.com/page?utm_source=twitter&key=val') === 'https://example.com/page?key=val',
  'canonicalizeURL strips tracking params and upgrades to https'
);
assert(
  canonicalizeURL('https://Example.COM/Path/') === 'https://example.com/Path',
  'canonicalizeURL lowercases host and removes trailing slash'
);
assert(
  canonicalizeURL('https://example.com/page#section') === 'https://example.com/page',
  'canonicalizeURL removes fragments'
);
assert(
  canonicalizeURL('') === '',
  'canonicalizeURL handles empty string'
);

const tokens = tokenize('The quick brown fox jumps over the lazy dog');
assert(tokens.includes('quick') && tokens.includes('brown') && tokens.includes('fox'), 'tokenize extracts meaningful words');
assert(!tokens.includes('the') && !tokens.includes('over'), 'tokenize removes stopwords');

assert(jaccardSimilarity(['a','b','c'], ['b','c','d']) === 0.5, 'jaccardSimilarity computes correctly');
assert(jaccardSimilarity([], ['a','b']) === 0, 'jaccardSimilarity handles empty set');
assert(jaccardSimilarity(['a','b'], ['a','b']) === 1, 'jaccardSimilarity identical sets = 1');

assert(stableHash('hello') === stableHash('hello'), 'stableHash is deterministic');
assert(stableHash('hello') !== stableHash('world'), 'stableHash different inputs differ');

assert(stripHTML('<p>Hello <b>world</b></p>') === 'Hello world', 'stripHTML removes tags');

// --- dedupe.js ---
console.log('Testing dedupe.js...');

const items = [
  { title: 'AI agents are the future', link: 'https://example.com/post1' },
  { title: 'AI agents are the future', link: 'https://example.com/post1?utm_source=twitter' },
  { title: 'Completely different article', link: 'https://other.com/article' },
  { title: 'AI agents represent the future', link: 'https://another.com/agents' },
];

const { deduped, stats } = dedupeSignals(items, { titleSimilarityThreshold: 0.6 });
assert(stats.before === 4, 'dedupe: before count correct');
assert(deduped.length < 4, 'dedupe: removed duplicates');
assert(deduped.some(i => i.title === 'Completely different article'), 'dedupe: kept unique item');
assert(stats.removed_url >= 1, 'dedupe: removed at least 1 URL duplicate');

// --- topicCluster.js ---
console.log('Testing topicCluster.js...');

const signals = [
  { title: 'OpenAI releases GPT-5', summary: 'New chatbot model', source: 'OpenAI Blog', category: 'ai_news' },
  { title: 'ChatGPT gets new features', summary: 'Conversation improvements', source: 'TechCrunch', category: 'ai_news' },
  { title: 'Claude 4.5 announced by Anthropic', summary: 'New AI assistant', source: 'HN', category: 'ai_news' },
  { title: 'New automation tool launches', summary: 'Workflow automation with AI', source: 'PH', category: 'business_signals' },
  { title: 'n8n releases AI features', summary: 'Automation pipeline improvements', source: 'HN', category: 'tech_trends' },
  { title: 'Ollama runs locally', summary: 'Local LLM running', source: 'GitHub', category: 'tech_trends' },
  { title: 'Self-hosting AI models at home', summary: 'Privacy-first AI', source: 'HN', category: 'tech_trends' },
  { title: 'Random unrelated article about cooking', summary: 'Best pasta recipes', source: 'Other', category: 'other' },
];

const topics = clusterTopics(signals);
assert(topics.length < signals.length, 'clustering: fewer topics than input items');
assert(topics.length > 0, 'clustering: at least one topic');

// Chatbot items should cluster together
const chatTopic = topics.find(t => t.topic_title === 'Chatbots & Conversational AI');
assert(chatTopic && chatTopic.item_count >= 2, 'clustering: chatbot items grouped');

// Automation items should cluster
const autoTopic = topics.find(t => t.topic_title === 'AI Automation & Workflows');
assert(autoTopic && autoTopic.item_count >= 2, 'clustering: automation items grouped');

// Local AI should cluster
const localTopic = topics.find(t => t.topic_title === 'Local & Privacy AI');
assert(localTopic && localTopic.item_count >= 2, 'clustering: local AI items grouped');

// Topics should have ranks
assert(topics[0].rank === 1, 'clustering: first topic has rank 1');

// --- delta.js ---
console.log('Testing delta.js...');

const todayTopics = [
  { topic_id: 'a', topic_title: 'Topic A', rank: 1, signal_strength: 10, item_count: 3 },
  { topic_id: 'b', topic_title: 'Topic B', rank: 2, signal_strength: 8, item_count: 2 },
  { topic_id: 'new1', topic_title: 'New Topic', rank: 3, signal_strength: 5, item_count: 1 },
];

// Without previous data, all are new
const delta1 = computeDelta(todayTopics, '/nonexistent/path', '2026-02-27');
assert(delta1.new_topics.length === 3, 'delta: all topics new when no prior data');

// --- Summary ---
console.log('');
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('All tests passed!');
}
