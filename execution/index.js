import { collectAll } from './collectors/index.js';
import { analyzeTrends } from './analyzers/trends.js';
import { findOpportunities } from './analyzers/opportunities.js';
import { generateIdeas } from './generators/ideas.js';
import { generateContent } from './generators/content.js';
import { generateActionPlan } from './generators/action-plan.js';
import { generateRecommendations } from './generators/recommendations.js';
import { generateValidation } from './generators/validation.js';
import { generateOutreach } from './generators/outreach.js';
import { computeDelta } from './lib/delta.js';
import { HealthTracker } from './lib/health.js';
import { startDashboard } from './dashboard/server.js';
import { writeFileSync, mkdirSync, readFileSync, readdirSync, unlinkSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import cron from 'node-cron';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

async function runPipeline() {
  const health = new HealthTracker(ROOT);
  const today = new Date().toISOString().split('T')[0];

  console.log('='.repeat(60));
  console.log(`⚡ AI Opportunity Machine v3 — ${today}`);
  console.log('='.repeat(60));

  health.log(`Pipeline started: ${today}`);

  // Step 1: Collect + dedupe signals
  let signals;
  try {
    signals = await collectAll(health);
    health.recordStep('collect', true);
  } catch (err) {
    health.recordError('Collection failed: ' + err.message, err.stack);
    health.recordStep('collect', false);
    console.error('❌ Collection failed:', err.message);
    saveHealth(health, today);
    return;
  }

  if (signals.stats.total === 0) {
    console.log('\n⚠️  No signals collected. Check your internet connection.');
    health.recordError('No signals collected', null);
    saveHealth(health, today);
    return;
  }

  // Step 2: Cluster topics + analyze trends
  let trendsResult;
  try {
    trendsResult = await analyzeTrends(signals, health);
    health.recordStep('trends', true);
    health.analyzersOk = true;
  } catch (err) {
    health.recordError('Trend analysis failed: ' + err.message, err.stack);
    health.recordStep('trends', false);
    console.error('⚠ Trend analysis failed:', err.message);
    trendsResult = { report: '# Trend analysis failed\n', topics: [] };
  }

  // Step 3: Compute delta (new since yesterday)
  let delta;
  try {
    const deliverablesDir = join(ROOT, 'deliverables');
    delta = computeDelta(trendsResult.topics, deliverablesDir, today);
    health.recordStep('delta', true);
  } catch (err) {
    health.recordError('Delta computation failed: ' + err.message, err.stack);
    health.recordStep('delta', false);
    delta = { new_topics: [], dropped_topics: [], movers_up: [], movers_down: [], recurring_topics: [] };
  }

  // Step 4: Score opportunities
  let oppsResult;
  try {
    oppsResult = await findOpportunities(signals, trendsResult, health);
    health.recordStep('opportunities', true);
  } catch (err) {
    health.recordError('Opportunity analysis failed: ' + err.message, err.stack);
    health.recordStep('opportunities', false);
    oppsResult = { report: '# Opportunity analysis failed\n', opportunities: [] };
  }

  // Step 5: Top opportunity + action plan
  let topOppResult;
  try {
    topOppResult = generateActionPlan(oppsResult.opportunities, trendsResult.topics);
    health.recordStep('action_plan', true);
  } catch (err) {
    health.recordError('Action plan failed: ' + err.message, err.stack);
    health.recordStep('action_plan', false);
    topOppResult = { topOpportunity: null, actionPlan: '# Action plan generation failed\n' };
  }

  // Step 5b: Generate business recommendations
  const config = JSON.parse(readFileSync(join(ROOT, 'directives', 'config.json'), 'utf-8'));
  const profile = config.user_profile;
  let recsResult;
  try {
    recsResult = generateRecommendations(oppsResult.opportunities, profile);
    health.recordStep('recommendations', true);
  } catch (err) {
    health.recordError('Recommendations failed: ' + err.message, err.stack);
    health.recordStep('recommendations', false);
    recsResult = { recommendations: [], report: '# Recommendations failed\n' };
  }

  // Step 5c: Generate validation plans
  let validationResult;
  try {
    validationResult = generateValidation(recsResult.recommendations);
    health.recordStep('validation', true);
  } catch (err) {
    health.recordError('Validation failed: ' + err.message, err.stack);
    health.recordStep('validation', false);
    validationResult = { plans: [], report: '# Validation failed\n' };
  }

  // Step 5d: Generate outreach templates
  let outreachResult;
  try {
    outreachResult = generateOutreach(recsResult.recommendations, profile);
    health.recordStep('outreach', true);
  } catch (err) {
    health.recordError('Outreach failed: ' + err.message, err.stack);
    health.recordStep('outreach', false);
    outreachResult = { templates: [], report: '# Outreach failed\n' };
  }

  // Step 6: Generate project ideas
  let ideasReport;
  try {
    ideasReport = await generateIdeas(signals, trendsResult.report, oppsResult.report);
    health.recordStep('ideas', true);
    health.generatorsOk = true;
  } catch (err) {
    health.recordError('Idea generation failed: ' + err.message, err.stack);
    health.recordStep('ideas', false);
    ideasReport = '# Idea generation failed\n';
  }

  // Step 7: Generate content drafts
  let contentResult;
  try {
    contentResult = await generateContent(signals, trendsResult, oppsResult, delta);
    health.recordStep('content', true);
  } catch (err) {
    health.recordError('Content generation failed: ' + err.message, err.stack);
    health.recordStep('content', false);
    contentResult = { report: '# Content generation failed\n', posts: [] };
  }

  // Step 8: Save all deliverables
  const dayDir = join(ROOT, 'deliverables', today);
  mkdirSync(dayDir, { recursive: true });

  writeFileSync(join(dayDir, 'trends.md'), trendsResult.report);
  writeFileSync(join(dayDir, 'topics.json'), JSON.stringify(trendsResult.topics, null, 2));
  writeFileSync(join(dayDir, 'delta.json'), JSON.stringify(delta, null, 2));
  writeFileSync(join(dayDir, 'opportunities.md'), oppsResult.report);
  writeFileSync(join(dayDir, 'opportunities.json'), JSON.stringify(oppsResult.opportunities, null, 2));
  writeFileSync(join(dayDir, 'top_opportunity.json'), JSON.stringify(topOppResult.topOpportunity, null, 2));
  writeFileSync(join(dayDir, 'action_plan.md'), topOppResult.actionPlan);
  writeFileSync(join(dayDir, 'recommendations.md'), recsResult.report);
  writeFileSync(join(dayDir, 'recommendations.json'), JSON.stringify(recsResult.recommendations, null, 2));
  writeFileSync(join(dayDir, 'validation.md'), validationResult.report);
  writeFileSync(join(dayDir, 'validation.json'), JSON.stringify(validationResult.plans, null, 2));
  writeFileSync(join(dayDir, 'outreach.md'), outreachResult.report);
  writeFileSync(join(dayDir, 'outreach.json'), JSON.stringify(outreachResult.templates, null, 2));
  writeFileSync(join(dayDir, 'ideas.md'), ideasReport);
  writeFileSync(join(dayDir, 'content.md'), contentResult.report);
  writeFileSync(join(dayDir, 'content.json'), JSON.stringify(contentResult.posts, null, 2));
  writeFileSync(join(dayDir, 'stats.json'), JSON.stringify(signals.stats, null, 2));

  // Save health
  saveHealth(health, today);

  const elapsed = ((Date.now() - health.startTime) / 1000).toFixed(1);

  console.log('='.repeat(60));
  console.log(`✅ Pipeline complete in ${elapsed}s`);
  console.log(`📁 Deliverables → deliverables/${today}/`);
  console.log(`   trends.md, topics.json, delta.json`);
  console.log(`   opportunities.md, opportunities.json`);
  console.log(`   top_opportunity.json, action_plan.md`);
  console.log(`   recommendations.md, validation.md, outreach.md`);
  console.log(`   ideas.md, content.md, content.json`);
  console.log(`   stats.json, health.json`);
  if (health.errors.length > 0) {
    console.log(`   ⚠ ${health.errors.length} errors recorded`);
  }
  console.log('='.repeat(60));

  health.log(`Pipeline finished in ${elapsed}s`);

  // Cleanup old .tmp files (keep last 7 days)
  cleanupOldFiles();

  return { today, signals, trendsResult, oppsResult };
}

function saveHealth(health, today) {
  const dayDir = join(ROOT, 'deliverables', today);
  mkdirSync(dayDir, { recursive: true });
  writeFileSync(join(dayDir, 'health.json'), JSON.stringify(health.toJSON(), null, 2));
}

function cleanupOldFiles() {
  const tmpDir = join(ROOT, '.tmp');
  if (!existsSync(tmpDir)) return;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);

  try {
    const files = readdirSync(tmpDir).filter(f => f.endsWith('.json'));
    for (const file of files) {
      const match = file.match(/(\d{4}-\d{2}-\d{2})/);
      if (match && new Date(match[1]) < cutoff) {
        unlinkSync(join(tmpDir, file));
      }
    }
  } catch {}
}

// --- CLI ---
const args = process.argv.slice(2);
const mode = args[0] || '--full-run';

if (mode === '--collect-only') {
  collectAll().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
} else if (mode === '--analyze-only') {
  const today = new Date().toISOString().split('T')[0];
  const signalsPath = join(ROOT, '.tmp', `signals-${today}.json`);
  if (!existsSync(signalsPath)) {
    console.log('No signals for today. Run: npm run collect');
    process.exit(1);
  }
  const signals = JSON.parse(readFileSync(signalsPath, 'utf-8'));
  analyzeTrends(signals).then(result => {
    console.log(result.report);
    process.exit(0);
  });
} else if (mode === '--pipeline-only') {
  runPipeline().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
} else if (mode === '--dashboard') {
  const config = JSON.parse(readFileSync(join(ROOT, 'directives', 'config.json'), 'utf-8'));
  startDashboard(config.dashboard.port);
} else if (mode === '--autopilot') {
  const config = JSON.parse(readFileSync(join(ROOT, 'directives', 'config.json'), 'utf-8'));
  console.log(`⚡ AI Opportunity Machine v3 — Autopilot`);
  console.log(`   Schedule: ${config.schedule.cron} (${config.schedule.timezone})`);
  console.log(`   Dashboard: http://localhost:${config.dashboard.port}\n`);

  startDashboard(config.dashboard.port);
  runPipeline().catch(console.error);

  cron.schedule(config.schedule.cron, () => {
    console.log(`\n⏰ Scheduled run at ${new Date().toISOString()}`);
    runPipeline().catch(console.error);
  }, { timezone: config.schedule.timezone });
} else {
  // Default: full run + start dashboard
  const config = JSON.parse(readFileSync(join(ROOT, 'directives', 'config.json'), 'utf-8'));
  runPipeline()
    .then(() => startDashboard(config.dashboard.port))
    .catch(console.error);
}
