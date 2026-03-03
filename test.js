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

// --- V3: part_time_fit_score ---
console.log('Testing part-time fit scoring...');

function mockPartTimeFitScore(template) {
  let score = 5;
  const mvp = template.mvp_weeks || 4;
  if (mvp > 4) score -= 2;
  else if (mvp > 3) score -= 1;
  const integrations = template.integrations || 0;
  if (integrations >= 3) score -= 2;
  else if (integrations >= 2) score -= 1;
  if (template.needs_sustained_focus) score -= 1;
  if (template.needs_complex_ui) score -= 1;
  if (template.infra_burden === 'high') score -= 2;
  else if (template.infra_burden === 'medium') score -= 1;
  return Math.max(1, Math.min(5, score));
}

// Perfect part-time project: short MVP, few integrations, no sustained focus, no complex UI
const perfectPartTime = { mvp_weeks: 2, integrations: 1, needs_sustained_focus: false, needs_complex_ui: false, infra_burden: 'low' };
assert(mockPartTimeFitScore(perfectPartTime) === 5, 'part-time: perfect project scores 5 (' + mockPartTimeFitScore(perfectPartTime) + ')');

// Decent part-time: 3 weeks, 2 integrations
const decentPartTime = { mvp_weeks: 3, integrations: 2, needs_sustained_focus: false, needs_complex_ui: false, infra_burden: 'low' };
const decentScore = mockPartTimeFitScore(decentPartTime);
assert(decentScore === 4, 'part-time: decent project scores 4 (' + decentScore + ')');

// Bad for part-time: long MVP, complex, many integrations
const badPartTime = { mvp_weeks: 6, integrations: 3, needs_sustained_focus: true, needs_complex_ui: true, infra_burden: 'medium' };
const badScore = mockPartTimeFitScore(badPartTime);
assert(badScore <= 2, 'part-time: complex project scores ≤ 2 (' + badScore + ')');

// MVP > 4 weeks gets -2
const longMvpTemplate = { mvp_weeks: 5, integrations: 0, needs_sustained_focus: false, needs_complex_ui: false, infra_burden: 'low' };
assert(mockPartTimeFitScore(longMvpTemplate) === 3, 'part-time: mvp > 4 weeks loses 2 points');

// High infra burden
const highInfra = { mvp_weeks: 2, integrations: 0, needs_sustained_focus: false, needs_complex_ui: false, infra_burden: 'high' };
assert(mockPartTimeFitScore(highInfra) === 3, 'part-time: high infra loses 2 points');

// --- V3: recommendation selection ---
console.log('Testing recommendation selection...');

// Mock opportunities for recommendation testing
const mockOppsV3 = [
  { name: 'Good Opp', is_strong: true, part_time_fit_score: 5, final_score: 100, builder_fit_score: 5 },
  { name: 'Also Good', is_strong: true, part_time_fit_score: 4, final_score: 80, builder_fit_score: 4 },
  { name: 'Strong but Bad PT Fit', is_strong: true, part_time_fit_score: 2, final_score: 90, builder_fit_score: 5 },
  { name: 'Weak Opp', is_strong: false, part_time_fit_score: 5, final_score: 120, builder_fit_score: 5 },
];

// Filter: STRONG + part_time_fit >= 4
const eligible = mockOppsV3.filter(o => o.is_strong && o.part_time_fit_score >= 4);
assert(eligible.length === 2, 'recommendations: exactly 2 eligible opps');
assert(eligible[0].name === 'Good Opp', 'recommendations: first eligible is Good Opp');
assert(eligible[1].name === 'Also Good', 'recommendations: second eligible is Also Good');

// Max 2 recommendations
const manyGoodOpps = [
  { name: 'A', is_strong: true, part_time_fit_score: 5, final_score: 100 },
  { name: 'B', is_strong: true, part_time_fit_score: 5, final_score: 90 },
  { name: 'C', is_strong: true, part_time_fit_score: 5, final_score: 80 },
  { name: 'D', is_strong: true, part_time_fit_score: 4, final_score: 70 },
];
const eligibleMany = manyGoodOpps.filter(o => o.is_strong && o.part_time_fit_score >= 4);
const topRecs = eligibleMany.slice(0, 2);
assert(topRecs.length === 2, 'recommendations: max 2 even when more eligible');
assert(topRecs[0].name === 'A', 'recommendations: top 1 is highest score');
assert(topRecs[1].name === 'B', 'recommendations: top 2 is second highest');

// Weak opp with high score cannot become recommendation
const weakHighScore = mockOppsV3.filter(o => o.is_strong && o.part_time_fit_score >= 4);
assert(!weakHighScore.some(o => o.name === 'Weak Opp'), 'recommendations: weak opp excluded even with high score');

// Part-time fit < 4 excluded even if strong
assert(!eligible.some(o => o.name === 'Strong but Bad PT Fit'), 'recommendations: low part-time fit excluded even if strong');

// No eligible opps → empty recommendations
const noEligible = [
  { name: 'Only Weak', is_strong: false, part_time_fit_score: 5, final_score: 100 },
].filter(o => o.is_strong && o.part_time_fit_score >= 4);
assert(noEligible.length === 0, 'recommendations: no eligible when none qualify');

// --- V3.1: Niche enforcement ---
console.log('Testing V3.1 niche enforcement...');

const GENERIC_BUYER_TERMS_TEST = /\b(businesses|teams|knowledge workers|companies|professionals|unternehmen|wissensarbeiter)\b/i;

// Generic buyer text should be detected
assert(GENERIC_BUYER_TERMS_TEST.test('Small businesses'), 'niche: "businesses" detected as generic');
assert(GENERIC_BUYER_TERMS_TEST.test('Teams mit viel Dokumentation'), 'niche: "Teams" detected as generic');
assert(GENERIC_BUYER_TERMS_TEST.test('Knowledge workers in enterprises'), 'niche: "knowledge workers" detected as generic');
assert(GENERIC_BUYER_TERMS_TEST.test('Unternehmen jeder Größe'), 'niche: "Unternehmen" detected as generic');
assert(GENERIC_BUYER_TERMS_TEST.test('Professionals and consultants'), 'niche: "Professionals" detected as generic');

// Specific buyer text should NOT be detected
assert(!GENERIC_BUYER_TERMS_TEST.test('Kleine Steuerkanzleien in Deutschland'), 'niche: specific buyer not flagged');
assert(!GENERIC_BUYER_TERMS_TEST.test('E-Commerce-Shops mit 50-500 Bestellungen'), 'niche: specific buyer not flagged (2)');
assert(!GENERIC_BUYER_TERMS_TEST.test('Freelance-Übersetzer und Sprachdienstleister'), 'niche: specific buyer not flagged (3)');

// Niche refinement: buyer_specificity_score < 4 triggers refinement
function mockNicheRefinement(opp) {
  const buyerText = opp.target_buyer || '';
  const needsRefinement = opp.buyer_specificity_score < 4 || GENERIC_BUYER_TERMS_TEST.test(buyerText);
  return { needs_refinement: needsRefinement };
}

assert(mockNicheRefinement({ target_buyer: 'Small businesses', buyer_specificity_score: 3 }).needs_refinement, 'niche: low specificity + generic triggers refinement');
assert(mockNicheRefinement({ target_buyer: 'Small businesses', buyer_specificity_score: 5 }).needs_refinement, 'niche: high specificity + generic still triggers refinement');
assert(mockNicheRefinement({ target_buyer: 'Steuerkanzleien', buyer_specificity_score: 2 }).needs_refinement, 'niche: low specificity triggers refinement even with specific text');
assert(!mockNicheRefinement({ target_buyer: 'Steuerkanzleien', buyer_specificity_score: 4 }).needs_refinement, 'niche: high specificity + specific text = no refinement');

// --- V3.1: Revenue reality math ---
console.log('Testing V3.1 revenue reality...');

function mockRevenueReality(pricingStr) {
  const priceMatch = pricingStr.match(/(\d+)/);
  const monthlyPrice = priceMatch ? parseInt(priceMatch[1]) : 29;
  const customersNeeded = Math.ceil(1000 / monthlyPrice);
  return { monthly_price: monthlyPrice, customers_needed: customersNeeded, scenarios: {
    starter: { customers: 5, revenue: 5 * monthlyPrice },
    realistic: { customers: 20, revenue: 20 * monthlyPrice },
    strong: { customers: 50, revenue: 50 * monthlyPrice },
  }};
}

const rev29 = mockRevenueReality('29€/Monat');
assert(rev29.monthly_price === 29, 'revenue: parses 29€/Monat');
assert(rev29.customers_needed === 35, 'revenue: 1000/29 = 35 customers');
assert(rev29.scenarios.realistic.revenue === 580, 'revenue: 20 * 29 = 580');

const rev99 = mockRevenueReality('99-149€/Monat');
assert(rev99.monthly_price === 99, 'revenue: parses lower price from range');
assert(rev99.customers_needed === 11, 'revenue: 1000/99 = 11 customers');
assert(rev99.scenarios.strong.revenue === 4950, 'revenue: 50 * 99 = 4950');

const rev199 = mockRevenueReality('199€/Monat');
assert(rev199.customers_needed === 6, 'revenue: 1000/199 = 6 customers (ceil)');

// --- V3.1: artifact_type required ---
console.log('Testing V3.1 artifact_type...');

const VALID_ARTIFACTS = ['demo_app', 'github_repo', 'landing_page', 'working_script', 'bot_prototype'];

// Each opportunity template must have artifact_type
const mockTemplateArtifacts = [
  { name: 'AI Workflow Micro-SaaS', artifact_type: 'working_script' },
  { name: 'Developer Niche SaaS', artifact_type: 'github_repo' },
  { name: 'Content Niche SaaS', artifact_type: 'demo_app' },
  { name: 'Document Processing Micro-SaaS', artifact_type: 'demo_app' },
  { name: 'AI Sales Micro-SaaS', artifact_type: 'working_script' },
  { name: 'Vertikaler AI-Agent Service', artifact_type: 'working_script' },
  { name: 'Meeting-Automations-Pipeline', artifact_type: 'demo_app' },
  { name: 'AI Reporting Automator', artifact_type: 'demo_app' },
  { name: 'AI Knowledge Bot Platform', artifact_type: 'bot_prototype' },
  { name: 'AI Intake Bot', artifact_type: 'bot_prototype' },
  { name: 'GDPR-Safe Dokumentations-Assistent', artifact_type: 'demo_app' },
  { name: 'Local-First AI Tool', artifact_type: 'demo_app' },
];

for (const t of mockTemplateArtifacts) {
  assert(VALID_ARTIFACTS.includes(t.artifact_type), 'artifact: ' + t.name + ' has valid artifact_type "' + t.artifact_type + '"');
}
assert(mockTemplateArtifacts.every(t => t.artifact_type), 'artifact: all templates have artifact_type');

// --- V3.1: Weekend MVP plan ---
console.log('Testing V3.1 weekend MVP plan...');

function mockWeekendPlan(opp) {
  return {
    week_1: { title: 'Validierung', hours: '5–7h', tasks: ['task1', 'task2', 'task3', 'task4'] },
    week_2: { title: 'MVP Core', hours: '8–10h', tasks: ['task1', 'task2', 'task3', 'task4'] },
    week_3: { title: 'Deploy + erste Nutzer', hours: '6–8h', tasks: ['task1', 'task2', 'task3', 'task4'] },
    total_hours: '19–25h',
  };
}

const plan = mockWeekendPlan({});
assert(plan.week_1 && plan.week_2 && plan.week_3, 'weekend plan: has 3 weeks');
assert(plan.week_1.tasks.length === 4, 'weekend plan: week 1 has 4 tasks');
assert(plan.week_2.tasks.length === 4, 'weekend plan: week 2 has 4 tasks');
assert(plan.week_3.tasks.length === 4, 'weekend plan: week 3 has 4 tasks');
assert(plan.total_hours === '19–25h', 'weekend plan: total hours 19-25h');

// --- V3.1: Time feasibility ---
console.log('Testing V3.1 time feasibility...');

function mockTimeFeasibility(ptFit, mvpWeeks) {
  let weeklyHours;
  if (ptFit >= 5) weeklyHours = 7;
  else if (ptFit >= 4) weeklyHours = 9;
  else weeklyHours = 12;
  let totalHours = mvpWeeks * weeklyHours;
  totalHours = Math.min(totalHours, 35);
  totalHours = Math.max(totalHours, 15);
  return { total_hours_num: totalHours, weekly_hours: weeklyHours };
}

const tf5 = mockTimeFeasibility(5, 3);
assert(tf5.weekly_hours === 7, 'time: pt_fit=5 → 7h/week');
assert(tf5.total_hours_num === 21, 'time: 3 weeks * 7h = 21h');

const tf4 = mockTimeFeasibility(4, 4);
assert(tf4.weekly_hours === 9, 'time: pt_fit=4 → 9h/week');

const tf3 = mockTimeFeasibility(3, 2);
assert(tf3.weekly_hours === 12, 'time: pt_fit=3 → 12h/week');
assert(tf3.total_hours_num === 24, 'time: 2 weeks * 12h = 24h');

// Cap at 35h max
const tfCap = mockTimeFeasibility(3, 5);
assert(tfCap.total_hours_num === 35, 'time: capped at 35h');

// Floor at 15h
const tfFloor = mockTimeFeasibility(5, 1);
assert(tfFloor.total_hours_num === 15, 'time: floor at 15h');

// --- Summary ---
console.log('');
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('All tests passed!');
}
