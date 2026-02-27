# AI Opportunity Machine

Autopilot system that scans AI trends daily and identifies business opportunities. Collects signals from RSS feeds, HackerNews, GitHub Trending, and ProductHunt — then clusters topics, scores opportunities against your builder profile, generates project ideas, and drafts content.

## Quick Start

```bash
npm install

# Full pipeline run (collect → analyze → dashboard)
npm start

# Or step-by-step:
npm run collect     # Only collect signals
npm run analyze     # Only analyze (needs today's signals)
npm run dashboard   # Just start the dashboard
```

Dashboard opens at **http://localhost:3456**

## Autopilot Mode

Runs the pipeline on a cron schedule (default: daily at 7:00 Europe/Berlin) and keeps the dashboard running:

```bash
npm run autopilot
```

## What It Does

Each run produces these deliverables in `deliverables/YYYY-MM-DD/`:

| File | Description |
|------|-------------|
| `trends.md` | Clustered topic report with signal strength |
| `topics.json` | Structured topic data |
| `delta.json` | What's new/dropped/moving since yesterday |
| `opportunities.md` | Top 10 scored opportunities |
| `opportunities.json` | Structured opportunity data with scores |
| `top_opportunity.json` | #1 opportunity with full detail |
| `action_plan.md` | 1-day and 3-day plan for top opportunity |
| `ideas.md` | 5-7 project ideas matched to today's signals |
| `content.md` | 3 social media post drafts (German) |
| `content.json` | Structured post data |
| `stats.json` | Collection statistics |
| `health.json` | Pipeline health and timing |

## Configuration

Edit `directives/config.json`:

### Sources

```jsonc
"sources": {
  "rss": [
    { "name": "OpenAI Blog", "url": "https://openai.com/blog/rss.xml", "category": "ai_news" }
    // Add/remove RSS feeds here
  ],
  "web": [
    { "name": "GitHub Trending AI", "url": "https://github.com/trending?since=daily", "category": "tech_trends" }
    // Add/remove web sources here
  ]
}
```

### User Profile

The opportunity scorer uses your profile to rank what fits you best:

```jsonc
"user_profile": {
  "skills": ["typescript", "node", "python", "react", ...],    // Your tech skills
  "domains": ["saas", "automation", "bots", ...],               // Domains you work in
  "constraints": {
    "max_mvp_weeks": 4,            // Max weeks for an MVP
    "solo_developer": true,         // Solo or team
    "prefer_recurring_revenue": true,
    "prefer_b2b": true,
    "avoid": ["mobile_native", "hardware"]  // What to deprioritize
  }
}
```

### Schedule

```jsonc
"schedule": {
  "cron": "0 7 * * *",        // When to run (cron syntax)
  "timezone": "Europe/Berlin"
}
```

## AI-Powered Mode (Optional)

Set one of these environment variables for AI-enhanced analysis:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
# or
export OPENAI_API_KEY=sk-...
```

Without an API key, all features work using deterministic heuristics. The AI mode improves trend summaries, opportunity descriptions, and content quality.

## Tests

```bash
node test.js
```

## Project Structure

```
directives/          # Configuration and prompt templates
  config.json        # Sources, user profile, schedule
  prompts/           # AI prompt templates (used when API key set)
execution/           # All runtime code
  collectors/        # Signal collection (RSS, HN, GitHub, PH)
  analyzers/         # Trend clustering, opportunity scoring
  generators/        # Ideas, content, action plans
  lib/               # Shared utilities (normalize, dedupe, clustering, delta, health)
  dashboard/         # Express server + frontend
  index.js           # Pipeline orchestrator + CLI
deliverables/        # Output (one folder per day)
.tmp/                # Intermediate data (signals, logs)
```
