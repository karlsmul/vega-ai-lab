import express from 'express';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { marked } from 'marked';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

const app = express();

// Serve dashboard
app.get('/', (req, res) => {
  const html = readFileSync(join(__dirname, 'index.html'), 'utf-8');
  res.type('html').send(html);
});

// API: List available dates
app.get('/api/dates', (req, res) => {
  const delDir = join(ROOT, 'deliverables');
  if (!existsSync(delDir)) return res.json([]);

  const dates = readdirSync(delDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(d.name))
    .map(d => d.name)
    .sort()
    .reverse();

  res.json(dates);
});

// API: Get all reports for a date
app.get('/api/report/:date', (req, res) => {
  const { date } = req.params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: 'Invalid date' });

  const dayDir = join(ROOT, 'deliverables', date);
  if (!existsSync(dayDir)) return res.status(404).json({ error: 'No report for this date' });

  const reports = {};

  // Markdown files → raw + HTML
  const mdFiles = ['trends.md', 'opportunities.md', 'ideas.md', 'content.md', 'action_plan.md'];
  for (const file of mdFiles) {
    const filePath = join(dayDir, file);
    if (existsSync(filePath)) {
      const raw = readFileSync(filePath, 'utf-8');
      const key = file.replace('.md', '');
      reports[key] = { raw, html: marked(raw) };
    }
  }

  // JSON files → parsed
  const jsonFiles = ['stats.json', 'delta.json', 'top_opportunity.json', 'health.json', 'topics.json', 'opportunities.json', 'content.json'];
  for (const file of jsonFiles) {
    const filePath = join(dayDir, file);
    if (existsSync(filePath)) {
      try {
        const key = file.replace('.json', '');
        reports[key] = JSON.parse(readFileSync(filePath, 'utf-8'));
      } catch {}
    }
  }

  res.json(reports);
});

// API: Get raw signals
app.get('/api/signals/:date', (req, res) => {
  const { date } = req.params;
  const signalsPath = join(ROOT, '.tmp', `signals-${date}.json`);
  if (!existsSync(signalsPath)) return res.status(404).json({ error: 'No signals for this date' });
  res.json(JSON.parse(readFileSync(signalsPath, 'utf-8')));
});

export function startDashboard(port = 3456) {
  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      console.log(`\n🖥️  Dashboard: http://localhost:${port}\n`);
      resolve(server);
    });
  });
}

// Run standalone
if (process.argv[1] && process.argv[1].includes('server.js')) {
  const config = JSON.parse(readFileSync(join(ROOT, 'directives', 'config.json'), 'utf-8'));
  startDashboard(config.dashboard.port);
}
