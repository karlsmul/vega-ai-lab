// Build static site from deliverables/ for GitHub Pages deployment.
// Usage: DASHBOARD_PASSWORD=mypassword node build-site.js

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, cpSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { marked } from 'marked';
import { createHash } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DELIVERABLES = join(__dirname, 'deliverables');
const SITE_DIR = join(__dirname, 'site');
const TEMPLATE = join(__dirname, 'execution', 'dashboard', 'index.html');

const password = process.env.DASHBOARD_PASSWORD;
if (!password) {
  console.error('ERROR: Set DASHBOARD_PASSWORD environment variable.');
  process.exit(1);
}

const passwordHash = createHash('sha256').update(password).digest('hex');
console.log('Building static site...');

// 1. Create site directory
mkdirSync(join(SITE_DIR, 'data'), { recursive: true });

// 2. Scan deliverables for date folders
const dates = readdirSync(DELIVERABLES)
  .filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d))
  .sort()
  .reverse();

writeFileSync(join(SITE_DIR, 'data', 'dates.json'), JSON.stringify(dates));
console.log(`  Found ${dates.length} report date(s): ${dates.slice(0, 3).join(', ')}${dates.length > 3 ? '...' : ''}`);

// 3. Bundle each date's data into a single report.json
const mdFiles = ['trends.md', 'opportunities.md', 'ideas.md', 'content.md', 'action_plan.md', 'recommendations.md', 'validation.md', 'outreach.md'];
const jsonFiles = ['stats.json', 'delta.json', 'top_opportunity.json', 'health.json', 'topics.json', 'opportunities.json', 'content.json', 'recommendations.json', 'validation.json', 'outreach.json'];

for (const date of dates) {
  const dayDir = join(DELIVERABLES, date);
  const report = {};

  // Load markdown files → { raw, html }
  for (const file of mdFiles) {
    const filePath = join(dayDir, file);
    if (existsSync(filePath)) {
      const raw = readFileSync(filePath, 'utf-8');
      const key = file.replace('.md', '');
      report[key] = { raw, html: marked(raw) };
    }
  }

  // Load JSON files → merge with existing MD entries
  for (const file of jsonFiles) {
    const filePath = join(dayDir, file);
    if (existsSync(filePath)) {
      try {
        const key = file.replace('.json', '');
        const parsed = JSON.parse(readFileSync(filePath, 'utf-8'));
        if (report[key] && report[key].html) {
          report[key].data = parsed;
        } else {
          report[key] = parsed;
        }
      } catch {}
    }
  }

  const outDir = join(SITE_DIR, 'data', date);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'report.json'), JSON.stringify(report));
  console.log(`  Built ${date}/report.json`);
}

// 4. Generate index.html with password gate and static fetches
let html = readFileSync(TEMPLATE, 'utf-8');

// Inject password gate + modify fetch URLs
const authScript = `
    // --- PASSWORD GATE ---
    const PASS_HASH = '${passwordHash}';
    async function sha256(msg) {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(msg));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
    }
    function showDashboard() {
      document.getElementById('authGate').style.display = 'none';
      document.getElementById('appMain').style.display = 'block';
      loadDates();
    }
    async function checkAuth() {
      if (sessionStorage.getItem('ai_opp_auth') === 'true') { showDashboard(); return; }
      document.getElementById('authGate').style.display = 'flex';
      document.getElementById('appMain').style.display = 'none';
    }
    async function doLogin() {
      const pw = document.getElementById('authInput').value;
      const hash = await sha256(pw);
      if (hash === PASS_HASH) {
        sessionStorage.setItem('ai_opp_auth', 'true');
        showDashboard();
      } else {
        document.getElementById('authError').style.display = 'block';
        document.getElementById('authInput').value = '';
      }
    }
    checkAuth();
`;

// Wrap header+main in a container we can hide, add auth gate
html = html.replace(
  '<header>',
  `<div id="authGate" style="display:none; justify-content:center; align-items:center; min-height:100vh; flex-direction:column; gap:16px;">
    <div style="background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:40px; text-align:center; max-width:400px;">
      <h2 style="margin-bottom:8px; background:linear-gradient(135deg, var(--accent), var(--accent2)); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">AI Opportunity Machine</h2>
      <p style="color:var(--text-dim); margin-bottom:24px;">Passwort eingeben</p>
      <input id="authInput" type="password" placeholder="Passwort" onkeydown="if(event.key==='Enter')doLogin()"
        style="width:100%; padding:12px; background:var(--surface2); border:1px solid var(--border); border-radius:8px; color:var(--text); font-size:16px; margin-bottom:12px; outline:none;">
      <button onclick="doLogin()"
        style="width:100%; padding:12px; background:var(--accent); border:none; border-radius:8px; color:white; font-size:16px; font-weight:600; cursor:pointer;">Login</button>
      <p id="authError" style="display:none; color:var(--red); margin-top:12px;">Falsches Passwort</p>
    </div>
  </div>
  <div id="appMain" style="display:none;">
  <header>`
);

html = html.replace('</main>', '</main>\n  </div><!-- /appMain -->');

// Replace API fetch URLs with static file paths
html = html.replace("fetch('/api/dates')", "fetch('./data/dates.json')");
html = html.replace("fetch('/api/report/' + date)", "fetch('./data/' + date + '/report.json')");

// Replace loadDates() call with auth script
html = html.replace('    loadDates();', authScript);

writeFileSync(join(SITE_DIR, 'index.html'), html);
console.log('  Built index.html (with password gate)');

console.log(`\nStatic site ready in site/`);
console.log(`Test locally: npx serve site/`);
