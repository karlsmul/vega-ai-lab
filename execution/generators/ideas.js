import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { queryAI, hasAPIKey } from '../analyzers/ai-client.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

export async function generateIdeas(signals, trendsReport, opportunitiesReport) {
  console.log('🛠️  Generating project ideas...');

  if (hasAPIKey()) {
    return await generateIdeasWithAI(trendsReport, opportunitiesReport);
  }
  return generateIdeasHeuristic(signals);
}

async function generateIdeasWithAI(trendsReport, opportunitiesReport) {
  const promptTemplate = readFileSync(
    join(ROOT, 'directives', 'prompts', 'generate-ideas.md'), 'utf-8'
  );

  const prompt = promptTemplate
    .replace('{{opportunities}}', opportunitiesReport)
    .replace('{{trends}}', trendsReport);

  const result = await queryAI(prompt);
  if (result) {
    console.log('  ✓ AI-powered idea generation complete');
    return result;
  }

  console.log('  ⚠ AI API failed, using heuristic generation');
  return generateIdeasHeuristic({});
}

function generateIdeasHeuristic(signals) {
  console.log('  Using heuristic idea generation...');

  const ideaTemplates = [
    {
      name: 'AI Content Repurposer',
      oneliner: 'Turn one blog post into 10 social media posts, email drafts, and threads automatically.',
      description: 'A tool that takes long-form content and generates platform-optimized versions. Uses AI to understand tone, extract key points, and format for LinkedIn, X, newsletters, and more. Saves content creators hours per piece.',
      stack: 'Node.js/Python, Claude API or local LLM via Ollama, simple web UI',
      plan: ['Day 1-2: Core repurposing engine + API', 'Day 3-5: Web UI + template system', 'Day 6-7: Polish, add scheduling, launch'],
      monetization: '$19/mo for 50 repurposes, $49/mo unlimited. Free tier: 5/month.',
      launch: 'Post on IndieHackers, ProductHunt, X. Target content creators and solopreneurs.',
      differentiator: 'Maintains voice consistency across platforms. Not just reformatting — actual strategic adaptation.'
    },
    {
      name: 'Local AI Document Analyst',
      oneliner: 'Chat with your private documents using 100% local AI — no data leaves your machine.',
      description: 'Desktop app that lets users drop in PDFs, contracts, research papers and ask questions. Runs entirely locally using Ollama + embedding models. Perfect for lawyers, researchers, and privacy-conscious professionals.',
      stack: 'Electron or Tauri, Ollama, local vector DB (ChromaDB), Python/Node',
      plan: ['Day 1-2: Document ingestion + local RAG pipeline', 'Day 3-5: Desktop UI + chat interface', 'Day 6-7: Multi-document support, export answers, launch'],
      monetization: '$39 one-time purchase or $9/mo. No usage limits since it runs locally.',
      launch: 'Privacy-focused communities, HackerNews Show HN, legal/research forums.',
      differentiator: 'Zero cloud dependency. Users own their data completely. Works offline.'
    },
    {
      name: 'AI Workflow Bot Builder',
      oneliner: 'Build custom Slack/Discord bots that automate team workflows using natural language.',
      description: 'A platform where users describe what they want a bot to do in plain English, and the system generates a working bot. Handles Slack/Discord integration, scheduled tasks, API calls, and data processing.',
      stack: 'Node.js, Slack/Discord SDK, Claude or GPT API, PostgreSQL',
      plan: ['Day 1-2: Bot runtime engine + natural language parser', 'Day 3-5: Web dashboard + bot configuration UI', 'Day 6-7: Templates, one-click deploy, launch'],
      monetization: '$29/mo per workspace. Usage-based for API calls. Free: 1 bot, 100 actions/day.',
      launch: 'ProductHunt, Slack app directory, automation communities.',
      differentiator: 'No-code bot building with AI intelligence. Not just triggers — bots understand context.'
    },
    {
      name: 'Trend-to-Tweet Engine',
      oneliner: 'Auto-monitors AI news and drafts ready-to-post thought leadership content.',
      description: 'Monitors RSS feeds, GitHub trending, and HN for AI developments. Generates opinionated social media drafts that position the user as a thought leader. Learns the user\'s tone and style over time.',
      stack: 'Node.js, RSS parser, Claude API, simple dashboard',
      plan: ['Day 1-2: News monitoring + content generation engine', 'Day 3-4: Tone calibration + scheduling dashboard', 'Day 5-7: Multi-platform support, analytics, launch'],
      monetization: '$15/mo for 30 drafts, $39/mo unlimited with analytics.',
      launch: 'X/Twitter, LinkedIn creator communities, IndieHackers.',
      differentiator: 'Not generic AI writing — specifically trained on tech thought leadership patterns.'
    },
    {
      name: 'API Cost Optimizer',
      oneliner: 'Monitor, analyze, and automatically optimize your AI API spending.',
      description: 'Dashboard that connects to OpenAI/Anthropic/other AI API accounts, tracks spending patterns, identifies waste, and suggests optimizations. Can auto-route requests to cheaper models when quality allows.',
      stack: 'Node.js/Python, API usage monitoring, web dashboard',
      plan: ['Day 1-2: API usage tracking + cost analysis engine', 'Day 3-5: Dashboard UI + optimization recommendations', 'Day 6-7: Auto-routing engine, alerts, launch'],
      monetization: '$29/mo — pays for itself by saving 10x+ on API costs.',
      launch: 'Dev communities, AI builder forums, X.',
      differentiator: 'Not just monitoring — active optimization with smart model routing.'
    }
  ];

  // Select ideas based on current signals
  const today = new Date().toISOString().split('T')[0];
  let report = `# Project Ideas — ${today}\n\n`;
  report += `*Concrete build ideas for a solo AI developer. Each is scoped for a 1-week MVP.*\n\n`;

  for (const idea of ideaTemplates) {
    report += `### ${idea.name}\n\n`;
    report += `**One-liner:** ${idea.oneliner}\n\n`;
    report += `**What it does:** ${idea.description}\n\n`;
    report += `**Tech stack:** ${idea.stack}\n\n`;
    report += `**Build plan:**\n`;
    for (const step of idea.plan) {
      report += `- ${step}\n`;
    }
    report += `\n**Monetization:** ${idea.monetization}\n\n`;
    report += `**Launch strategy:** ${idea.launch}\n\n`;
    report += `**Differentiator:** ${idea.differentiator}\n\n---\n\n`;
  }

  console.log(`  ✓ Generated ${ideaTemplates.length} project ideas`);
  return report;
}
