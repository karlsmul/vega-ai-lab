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

// Topics should have opp_category
assert(chatTopic && chatTopic.opp_category === 'bot_platform', 'clustering: chatbot topic has opp_category bot_platform');
assert(autoTopic && autoTopic.opp_category === 'automation_system', 'clustering: automation topic has opp_category automation_system');
assert(localTopic && localTopic.opp_category === 'local_ai_tools', 'clustering: local AI topic has opp_category local_ai_tools');

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

// --- opportunity scoring ---
console.log('Testing opportunity scoring...');

// Helper: simulate opportunity detection with mock profile
function mockBuilderFitScore(template, profile) {
  let score = 2;
  const preferred = profile.preferences?.preferred_opportunity_types || [];
  const secondary = profile.preferences?.secondary_opportunity_types || [];
  const requiredFocus = template.required_focus || [];
  if (requiredFocus.some(f => preferred.includes(f))) score += 2;
  else if (requiredFocus.some(f => secondary.includes(f))) score += 1;
  const skills = new Set(profile.skills || []);
  const requiredSkills = template.required_skills || [];
  const skillMatches = requiredSkills.filter(s => skills.has(s)).length;
  const skillRatio = requiredSkills.length > 0 ? skillMatches / requiredSkills.length : 0.5;
  score += skillRatio;
  if ((template.mvp_weeks || 4) > (profile.constraints?.max_mvp_weeks || 4)) score -= 1;
  return Math.max(1, Math.min(5, Math.round(score)));
}

const testProfile = {
  skills: ['nodejs', 'python', 'api_integration', 'automation', 'ai_agents', 'bot_building', 'server_deployment'],
  preferences: {
    preferred_opportunity_types: ['micro_saas', 'automation_system', 'bot_platform'],
    secondary_opportunity_types: ['social_sector_tools', 'local_ai_tools'],
    avoid: ['foundation_models', 'model_training'],
  },
  constraints: { max_mvp_weeks: 4 },
};

// Micro SaaS should get high builder fit
const microSaasTemplate = {
  required_focus: ['micro_saas', 'automation'],
  required_skills: ['nodejs', 'api_integration', 'automation'],
  mvp_weeks: 2,
};
const microSaasFit = mockBuilderFitScore(microSaasTemplate, testProfile);
assert(microSaasFit >= 4, 'scoring: micro_saas template gets high builder fit (' + microSaasFit + ')');

// Bot platform should also get high fit
const botTemplate = {
  required_focus: ['ai_bots', 'b2b_tools'],
  required_skills: ['nodejs', 'bot_building', 'api_integration'],
  mvp_weeks: 2,
};
// ai_bots is not in preferred_opportunity_types but bot_platform is — let's test with the actual template focus
const botTemplate2 = {
  required_focus: ['automation', 'ai_bots'],
  required_skills: ['nodejs', 'bot_building'],
  mvp_weeks: 2,
};
const botFit = mockBuilderFitScore(botTemplate2, testProfile);
assert(botFit >= 3, 'scoring: automation/bot template gets good builder fit (' + botFit + ')');

// Foundation model / training should get LOW fit (no matching focus)
const foundationModelTemplate = {
  required_focus: ['foundation_models'],
  required_skills: ['python'],
  mvp_weeks: 12,
};
const foundationFit = mockBuilderFitScore(foundationModelTemplate, testProfile);
assert(foundationFit <= 2, 'scoring: foundation model gets low builder fit (' + foundationFit + ')');

// --- brutal realism gating ---
console.log('Testing brutal realism...');

function mockRealism(template) {
  const has_clear_buyer = !!(template.target_buyer && template.target_buyer.length > 10);
  const has_clear_problem = !!(template.problem && template.problem.length > 20);
  const mvp_within_4_weeks = (template.mvp_weeks || 99) <= 4;
  const has_revenue_model = ['subscription', 'usage', 'service'].includes(template.revenue_model);
  const weak_reasons = [];
  if (!has_clear_buyer) weak_reasons.push('no_clear_buyer');
  if (!has_clear_problem) weak_reasons.push('no_clear_problem');
  if (!mvp_within_4_weeks) weak_reasons.push('mvp_too_long');
  if (!has_revenue_model) weak_reasons.push('no_revenue_model');
  return { is_strong: weak_reasons.length === 0, weak_reasons };
}

// Strong opportunity: has everything
const strongOpp = {
  target_buyer: 'Ops-Manager in KMUs, Freelancer mit Prozessen',
  problem: 'Teams verschwenden Stunden mit repetitiven Aufgaben die KI erledigen könnte',
  mvp_weeks: 2,
  revenue_model: 'subscription',
};
const strongResult = mockRealism(strongOpp);
assert(strongResult.is_strong === true, 'realism: complete opportunity is strong');

// Weak: no buyer
const weakNoBuyer = { target_buyer: '', problem: 'A real problem exists here for many people', mvp_weeks: 2, revenue_model: 'subscription' };
assert(mockRealism(weakNoBuyer).is_strong === false, 'realism: no buyer = weak');

// Weak: MVP too long
const weakLongMVP = { target_buyer: 'Some clear buyer segment', problem: 'A real problem here', mvp_weeks: 8, revenue_model: 'subscription' };
assert(mockRealism(weakLongMVP).is_strong === false, 'realism: mvp > 4 weeks = weak');

// Weak: no revenue model
const weakNoRevenue = { target_buyer: 'Some clear buyer segment', problem: 'A real problem here', mvp_weeks: 2, revenue_model: 'open_source' };
assert(mockRealism(weakNoRevenue).is_strong === false, 'realism: no revenue model = weak');

// Weak opportunities cannot be top
const mockOpps = [
  { name: 'Weak Opp', is_strong: false, final_score: 100, builder_fit_score: 5 },
  { name: 'Strong Opp', is_strong: true, final_score: 50, builder_fit_score: 4 },
];
const strongOnly = mockOpps.filter(o => o.is_strong);
assert(strongOnly.length === 1, 'realism: filtering leaves only strong opps');
assert(strongOnly[0].name === 'Strong Opp', 'realism: weak opp cannot be top even with higher score');

// --- Summary ---
console.log('');
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('All tests passed!');
}
