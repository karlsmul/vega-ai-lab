import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { queryAI, hasAPIKey } from './ai-client.js';
import { formatSignalsForPrompt } from './trends.js';
import { stableHash } from '../lib/normalize.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

/**
 * @param {Object} signals
 * @param {{ report: string, topics: Array }} trendsResult
 * @param {import('../lib/health.js').HealthTracker} [health]
 * @returns {{ report: string, opportunities: Array }}
 */
export async function findOpportunities(signals, trendsResult, health) {
  console.log('💡 Finding opportunities...');

  const config = JSON.parse(readFileSync(join(ROOT, 'directives', 'config.json'), 'utf-8'));
  const profile = config.user_profile;

  const opportunities = detectOpportunities(signals, trendsResult.topics, profile);

  // Optionally enhance with AI
  let report;
  if (hasAPIKey()) {
    report = await enhanceWithAI(signals, trendsResult.report, opportunities);
  }
  if (!report) {
    report = buildReport(signals, opportunities);
  }

  if (health) {
    health.opportunitiesCount = opportunities.length;
    health.log(`Opportunities: ${opportunities.length} scored, top 10 reported`);
  }

  console.log(`  ✓ ${opportunities.length} opportunities scored, top 10 in report`);
  return { report, opportunities };
}

async function enhanceWithAI(signals, trendsReport, opportunities) {
  try {
    const promptTemplate = readFileSync(
      join(ROOT, 'directives', 'prompts', 'find-opportunities.md'), 'utf-8'
    );
    const signalSummary = formatSignalsForPrompt(signals);
    const prompt = promptTemplate
      .replace('{{signals}}', signalSummary)
      .replace('{{trends}}', trendsReport);
    const result = await queryAI(prompt);
    if (result) {
      console.log('  ✓ AI-enhanced opportunity analysis');
      return result;
    }
  } catch (err) {
    console.warn(`  ⚠ AI opportunity analysis failed: ${err.message}`);
  }
  return null;
}

// --- OPPORTUNITY TEMPLATES ---

const OPPORTUNITY_TEMPLATES = [
  {
    pattern: /automat|workflow|no.?code|pipeline|zapier|n8n|make\.com/i,
    name: 'AI Workflow Automator',
    problem: 'Teams verschwenden Stunden mit repetitiven Aufgaben, die KI erledigen könnte',
    who_has_pain: 'Ops-Teams, Freelancer, kleine Agenturen',
    proposed_solution: 'Fokussiertes AI-Automations-Tool für eine spezifische Workflow-Nische.',
    revenue_model: 'subscription',
    mvp_weeks: 2,
    required_skills: ['node', 'api', 'llm'],
    required_domains: ['automation'],
    integrations: 1,
    infra_burden: 'low',
    risks: ['Zapier/Make sind etabliert', 'Differenzierung nötig', 'Support-Aufwand'],
    next_actions: {
      step_30_min: 'Identifiziere 3 spezifische Workflows, die schlecht automatisiert sind (Reddit/HN suchen)',
      step_2_hours: 'Baue einen Prototyp für einen Workflow und teste ihn selbst',
      step_6_hours: 'Implementiere einen funktionierenden MVP mit einem API-Endpunkt'
    }
  },
  {
    pattern: /local|privacy|self.?host|ollama|on.?prem|offline/i,
    name: 'Local-First AI Tool',
    problem: 'Datenschutz-bewusste Nutzer brauchen KI, die auf dem Gerät bleibt',
    who_has_pain: 'Anwälte, Ärzte, Forscher, datenschutzbewusste Unternehmen',
    proposed_solution: 'Lokales AI-Tool mit sauberem UX auf Open-Source-Modellen.',
    revenue_model: 'subscription',
    mvp_weeks: 3,
    required_skills: ['node', 'ollama', 'react'],
    required_domains: ['local_ai'],
    integrations: 0,
    infra_burden: 'low',
    risks: ['Ollama-UX verbessert sich schnell', 'Hardware-Anforderungen variieren', 'Support-Komplexität'],
    next_actions: {
      step_30_min: 'Teste 3 lokale Modelle via Ollama für einen konkreten Use Case',
      step_2_hours: 'Baue ein CLI-Tool das einen lokalen Workflow komplett abbildet',
      step_6_hours: 'Füge eine Web-UI hinzu und teste mit 2 Nutzern'
    }
  },
  {
    pattern: /agent|agentic|autonomous|crew|swarm/i,
    name: 'Vertikaler AI-Agent',
    problem: 'Generische AI-Agenten fehlt Domänenwissen für spezifische Branchen',
    who_has_pain: 'KMUs in einer spezifischen Branche (Legal, Sales, HR, Support)',
    proposed_solution: 'Spezialisierter AI-Agent für eine Branche mit klarem Workflow.',
    revenue_model: 'subscription',
    mvp_weeks: 3,
    required_skills: ['node', 'llm', 'api'],
    required_domains: ['ai_agents'],
    integrations: 2,
    infra_burden: 'medium',
    risks: ['Zuverlässigkeit bei autonomen Aktionen', 'Vertrauen der Nutzer', 'Prompt-Engineering-Aufwand'],
    next_actions: {
      step_30_min: 'Wähle eine Branche und identifiziere den nervigsten manuellen Prozess',
      step_2_hours: 'Baue einen Agent-Prototyp der 3 Schritte eines Workflows automatisiert',
      step_6_hours: 'Teste den Agenten an 5 echten Beispielen und miss die Fehlerrate'
    }
  },
  {
    pattern: /api|sdk|developer|devtool|cli|terminal|vscode/i,
    name: 'Developer AI Tool',
    problem: 'Entwickler brauchen bessere KI-Integration in ihren täglichen Workflow',
    who_has_pain: 'Software-Entwickler, DevOps-Engineers',
    proposed_solution: 'Fokussiertes Dev-Tool (CLI, VS Code Extension, oder API) für einen Pain Point.',
    revenue_model: 'subscription',
    mvp_weeks: 2,
    required_skills: ['node', 'typescript', 'llm', 'api'],
    required_domains: ['developer_tools'],
    integrations: 1,
    infra_burden: 'low',
    risks: ['Schnelllebiger Markt', 'Große Player (GitHub, JetBrains)', 'Kostenlose Alternativen'],
    next_actions: {
      step_30_min: 'Liste 5 nervige Dev-Workflows auf, die du selbst hast',
      step_2_hours: 'Baue ein CLI-Tool das einen davon löst',
      step_6_hours: 'Veröffentliche auf npm und poste auf HN Show'
    }
  },
  {
    pattern: /content|write|copy|blog|market|seo/i,
    name: 'AI Content Engine',
    problem: 'Content-Ersteller schaffen es nicht, konsistent qualitativ zu produzieren',
    who_has_pain: 'Solopreneure, Marketing-Teams, Content Creators',
    proposed_solution: 'KI-Content-Tool fokussiert auf ein Format oder eine Plattform.',
    revenue_model: 'subscription',
    mvp_weeks: 2,
    required_skills: ['node', 'llm', 'react'],
    required_domains: ['content_generation'],
    integrations: 1,
    infra_burden: 'low',
    risks: ['Hohe Konkurrenz (Jasper, Copy.ai)', 'Differenzierung schwierig', 'API-Kosten'],
    next_actions: {
      step_30_min: 'Analysiere 3 Content-Formate und finde das mit dem schlechtesten Tooling',
      step_2_hours: 'Baue einen Generator für ein Nischen-Format (z.B. Changelog-Posts)',
      step_6_hours: 'Füge Template-System und Export hinzu'
    }
  },
  {
    pattern: /voice|speech|audio|whisper|transcri|podcast/i,
    name: 'Voice/Audio AI Tool',
    problem: 'Audio-Inhalte enthalten wertvolle Daten, die im Sound gefangen sind',
    who_has_pain: 'Podcaster, Meeting-Teilnehmer, Journalisten, Forscher',
    proposed_solution: 'Tool das Audio in strukturierte, nutzbare Outputs verwandelt.',
    revenue_model: 'subscription',
    mvp_weeks: 2,
    required_skills: ['node', 'whisper', 'api'],
    required_domains: ['data_processing'],
    integrations: 1,
    infra_burden: 'medium',
    risks: ['Whisper-Qualität variiert', 'Große Dateien brauchen Infra', 'Otter.ai als Konkurrent'],
    next_actions: {
      step_30_min: 'Teste Whisper lokal mit 3 verschiedenen Audio-Typen',
      step_2_hours: 'Baue eine Pipeline: Audio → Transkript → strukturierte Zusammenfassung',
      step_6_hours: 'Füge Web-Upload und Export (Notion, Markdown) hinzu'
    }
  },
  {
    pattern: /image|vision|ocr|screenshot|design|figma|ui/i,
    name: 'Visual AI Tool',
    problem: 'Teams brauchen KI-gestützte visuelle Workflows',
    who_has_pain: 'Designer, Product Manager, Marketing-Teams',
    proposed_solution: 'Tool das visuelle KI mit praktischen Business-Workflows verbindet.',
    revenue_model: 'subscription',
    mvp_weeks: 3,
    required_skills: ['node', 'react', 'llm'],
    required_domains: ['content_generation'],
    integrations: 2,
    infra_burden: 'medium',
    risks: ['Canva/Figma integrieren KI nativ', 'Bildqualität-Erwartungen', 'GPU-Kosten'],
    next_actions: {
      step_30_min: 'Finde 3 visuelle Workflows die noch kein gutes Tool haben',
      step_2_hours: 'Baue einen Screenshot-zu-Beschreibung-Converter',
      step_6_hours: 'Erweitere um Batch-Processing und API-Endpunkt'
    }
  },
  {
    pattern: /rag|retriev|search|knowledge|document|pdf/i,
    name: 'Smart Document AI',
    problem: 'Organisationen haben Wissen in Dokumenten, die niemand liest',
    who_has_pain: 'Wissensarbeiter, Legal-Teams, Consulting, Forschung',
    proposed_solution: 'RAG-basiertes Tool das internes Wissen sofort durchsuchbar macht.',
    revenue_model: 'subscription',
    mvp_weeks: 3,
    required_skills: ['node', 'rag', 'embedding', 'vector', 'chromadb'],
    required_domains: ['data_processing', 'saas'],
    integrations: 2,
    infra_burden: 'medium',
    risks: ['RAG-Qualität schwankt', 'Skalierung mit vielen Dokumenten', 'Vercel/Supabase reichen?'],
    next_actions: {
      step_30_min: 'Sammle 10 PDFs und teste eine RAG-Pipeline lokal',
      step_2_hours: 'Baue ein Chat-Interface das Fragen über die Dokumente beantwortet',
      step_6_hours: 'Füge Chunk-Visualisierung und Quellenangaben hinzu'
    }
  },
  {
    pattern: /fine.?tun|train|custom|lora/i,
    name: 'Model Customization Service',
    problem: 'Unternehmen wollen eigene KI-Modelle, haben aber kein ML-Know-how',
    who_has_pain: 'KMUs, Non-Tech-Gründer, Agenturen',
    proposed_solution: 'No-Code Fine-Tuning oder Model-Anpassungs-Service.',
    revenue_model: 'usage',
    mvp_weeks: 4,
    required_skills: ['python', 'llm'],
    required_domains: ['saas'],
    integrations: 2,
    infra_burden: 'high',
    risks: ['GPU-Kosten', 'Technische Komplexität', 'Replicate/Together als Konkurrenten'],
    next_actions: {
      step_30_min: 'Teste LoRA-Fine-Tuning mit einem kleinen Datensatz lokal',
      step_2_hours: 'Baue ein Script das einen Upload → Fine-Tune → Download Workflow abbildet',
      step_6_hours: 'Wrappe es in eine einfache Web-UI'
    }
  },
  {
    pattern: /bot|chatbot|slack|discord|telegram|whatsapp/i,
    name: 'AI Bot Platform',
    problem: 'Teams brauchen eigene KI-Bots in ihren Kommunikationsplattformen',
    who_has_pain: 'Support-Teams, Community Manager, HR-Abteilungen',
    proposed_solution: 'Spezialisierte AI-Bots für konkrete Use Cases (Support, Onboarding, Sales).',
    revenue_model: 'subscription',
    mvp_weeks: 2,
    required_skills: ['node', 'api', 'llm'],
    required_domains: ['bots', 'automation'],
    integrations: 1,
    infra_burden: 'low',
    risks: ['Slack/Discord ändern APIs', 'Bot-Fatigue bei Nutzern', 'Intercom als Konkurrent'],
    next_actions: {
      step_30_min: 'Baue einen minimalen Slack-Bot der eine FAQ beantwortet',
      step_2_hours: 'Füge RAG über Team-Dokumente hinzu',
      step_6_hours: 'Teste mit einem echten Team und sammle Feedback'
    }
  },
  {
    pattern: /email|outreach|sales|crm|lead/i,
    name: 'AI Sales/Outreach Tool',
    problem: 'Sales-Teams versenden generische Outreach-Nachrichten, die ignoriert werden',
    who_has_pain: 'SDRs, Freelancer, kleine Sales-Teams, Agenturen',
    proposed_solution: 'KI-Tool das Outreach personalisiert durch Prospect-Research.',
    revenue_model: 'subscription',
    mvp_weeks: 2,
    required_skills: ['node', 'llm', 'scraping', 'api'],
    required_domains: ['saas', 'automation'],
    integrations: 2,
    infra_burden: 'low',
    risks: ['Spam-Perception', 'Deliverability-Issues', 'Apollo/Lemlist als Konkurrenten'],
    next_actions: {
      step_30_min: 'Scrape 5 LinkedIn-Profile und generiere personalisierte Emails',
      step_2_hours: 'Baue eine Pipeline: URL → Research → Draft → Review',
      step_6_hours: 'Füge Batch-Processing und CSV-Import/Export hinzu'
    }
  },
  {
    pattern: /data|analytics|insight|dashboard|monitor/i,
    name: 'AI Analytics Dashboard',
    problem: 'Teams ertrinken in Daten ohne verwertbare Erkenntnisse',
    who_has_pain: 'Startup-Gründer, Product Manager, Marketing-Leads',
    proposed_solution: 'KI-Analytics-Layer der Insights aus bestehenden Datenquellen aufzeigt.',
    revenue_model: 'usage',
    mvp_weeks: 3,
    required_skills: ['node', 'react', 'sql', 'llm'],
    required_domains: ['saas', 'data_processing'],
    integrations: 3,
    infra_burden: 'medium',
    risks: ['Daten-Integrationen sind komplex', 'Posthog/Mixpanel integrieren KI', 'Hoher Onboarding-Aufwand'],
    next_actions: {
      step_30_min: 'Verbinde dich mit einer Datenquelle (Stripe, GA) und extrahiere Key Metrics',
      step_2_hours: 'Baue ein Dashboard das 3 KPIs zeigt und KI-Insights generiert',
      step_6_hours: 'Füge natürlichsprachliche Abfragen hinzu'
    }
  },
];

// --- SCORING ---

function computeBuilderFitScore(template, profile) {
  const skills = new Set(profile.skills || []);
  const domains = new Set(profile.domains || []);

  // Skill match: how many required skills does the user have?
  const requiredSkills = template.required_skills || [];
  const skillMatches = requiredSkills.filter(s => skills.has(s)).length;
  const skillRatio = requiredSkills.length > 0 ? skillMatches / requiredSkills.length : 0.5;

  // Domain match
  const requiredDomains = template.required_domains || [];
  const domainMatches = requiredDomains.filter(d => domains.has(d)).length;
  const domainRatio = requiredDomains.length > 0 ? domainMatches / requiredDomains.length : 0.5;

  // Feasibility for solo dev
  const soloFeasible = (template.mvp_weeks || 4) <= (profile.constraints?.max_mvp_weeks || 4) ? 1 : 0.5;

  // Avoid penalty
  const avoidList = profile.constraints?.avoid || [];
  const avoidPenalty = avoidList.some(a => (template.required_domains || []).includes(a)) ? 0.5 : 1;

  const raw = (skillRatio * 2 + domainRatio * 1.5 + soloFeasible * 0.5) * avoidPenalty;
  return Math.max(1, Math.min(5, Math.round(raw * 5 / 4)));
}

function computeMarketScore(template, matchingItems) {
  let score = 2; // base

  // Recurring revenue bonus
  if (template.revenue_model === 'subscription') score += 1;

  // B2B targeting bonus
  const b2bKeywords = /\b(team|enterprise|business|company|organization|saas|b2b|workflow)\b/i;
  const hasB2B = matchingItems.some(i => b2bKeywords.test(`${i.title} ${i.summary || ''}`));
  if (hasB2B) score += 1;

  // Urgency/pain signals
  const painKeywords = /\b(frustrat|pain|problem|struggle|broken|hate|annoying|waste|slow|expensive|manual)\b/i;
  const hasPain = matchingItems.some(i => painKeywords.test(`${i.title} ${i.summary || ''}`));
  if (hasPain) score += 0.5;

  // High engagement on HN = demand signal
  const maxPoints = Math.max(...matchingItems.map(i => i.points || 0), 0);
  if (maxPoints > 100) score += 0.5;

  return Math.max(1, Math.min(5, Math.round(score)));
}

function computeComplexityScore(template) {
  let score = 1;

  const integrations = template.integrations || 0;
  score += integrations * 0.7;

  const infra = template.infra_burden || 'low';
  if (infra === 'medium') score += 1;
  if (infra === 'high') score += 2;

  // Model training = high complexity
  if (template.pattern && /fine.?tun|train|foundation/i.test(template.pattern.source)) {
    score += 1;
  }

  return Math.max(1, Math.min(5, Math.round(score)));
}

// --- DETECTION ---

function detectOpportunities(signals, topics, profile) {
  const allItems = [
    ...signals.ai_news.map(i => ({ ...i, weight: 3 })),
    ...signals.tech_trends.hackernews.map(i => ({
      ...i, weight: Math.max(1, Math.min(5, (i.points || 0) / 30))
    })),
    ...signals.tech_trends.github_trending.map(i => ({
      ...i, weight: Math.max(2, Math.min(5, (i.starsToday || 0) / 50))
    })),
    ...signals.business_signals.map(i => ({ ...i, weight: 2 })),
  ];

  const opportunities = [];
  const seen = new Set();

  for (const template of OPPORTUNITY_TEMPLATES) {
    const matchingItems = allItems.filter(item => {
      const text = `${item.title} ${item.summary || ''}`;
      return template.pattern.test(text);
    });

    if (matchingItems.length === 0 || seen.has(template.name)) continue;
    seen.add(template.name);

    const signalStrength = matchingItems.reduce((s, i) => s + i.weight, 0);
    const builderFit = computeBuilderFitScore(template, profile);
    const marketScore = computeMarketScore(template, matchingItems);
    const complexityScore = computeComplexityScore(template);

    const finalScore = (signalStrength * builderFit * marketScore) / complexityScore;

    const evidenceLinks = matchingItems
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 8)
      .map(i => i.canonical_url || i.link)
      .filter(Boolean);

    const topSignals = matchingItems
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3)
      .map(i => `${i.title} (${i.source})`);

    opportunities.push({
      opportunity_id: stableHash(template.name),
      name: template.name,
      problem: template.problem,
      who_has_pain: template.who_has_pain,
      proposed_solution: template.proposed_solution,
      why_now: topSignals.join('; '),
      difficulty: Math.max(1, Math.min(5, Math.round(complexityScore))),
      mvp_weeks: template.mvp_weeks,
      revenue_model: template.revenue_model,
      risks: template.risks,
      next_actions: template.next_actions,
      evidence_links: evidenceLinks,
      // Scores
      signal_strength: Math.round(signalStrength * 10) / 10,
      signal_count: matchingItems.length,
      builder_fit_score: builderFit,
      market_score: marketScore,
      complexity_score: complexityScore,
      final_score: Math.round(finalScore * 10) / 10,
    });
  }

  // Add GitHub trending managed-service opportunities
  for (const repo of signals.tech_trends.github_trending) {
    const repoName = repo.title.split('/').pop();
    const name = `Managed ${repoName}`;
    if (seen.has(name)) continue;
    seen.add(name);

    const signalStrength = Math.max(1, (repo.starsToday || 0) / 10);
    const builderFit = 3; // hosting is generally doable
    const marketScore = 3;
    const complexityScore = 3;
    const finalScore = (signalStrength * builderFit * marketScore) / complexityScore;

    opportunities.push({
      opportunity_id: stableHash(name),
      name: `Managed ${repoName} Service`,
      problem: 'Open-Source-Tools erfordern Setup, Wartung und Infrastruktur-Expertise',
      who_has_pain: 'Teams die das Tool nutzen wollen, ohne es selbst zu hosten',
      proposed_solution: `Managed/gehostete Version von ${repoName} mit Team-Features und Integrationen.`,
      why_now: `${repo.title} trending mit ${repo.starsToday} Stars heute`,
      difficulty: 3,
      mvp_weeks: 3,
      revenue_model: 'usage',
      risks: ['Original-Projekt könnte eigenes Hosting anbieten', 'Infra-Kosten skalieren', 'Support-Aufwand'],
      next_actions: {
        step_30_min: `Teste ${repoName} lokal und identifiziere Setup-Hürden`,
        step_2_hours: `Deploye es auf einem Server und teste die Kernfunktionen`,
        step_6_hours: `Füge Auth, Team-Management und ein Billing-System hinzu`
      },
      evidence_links: [repo.canonical_url || repo.link],
      signal_strength: Math.round(signalStrength * 10) / 10,
      signal_count: 1,
      builder_fit_score: builderFit,
      market_score: marketScore,
      complexity_score: complexityScore,
      final_score: Math.round(finalScore * 10) / 10,
    });
  }

  // Sort by final_score, break ties by builder_fit then lowest complexity
  opportunities.sort((a, b) => {
    if (b.final_score !== a.final_score) return b.final_score - a.final_score;
    if (b.builder_fit_score !== a.builder_fit_score) return b.builder_fit_score - a.builder_fit_score;
    return a.complexity_score - b.complexity_score;
  });

  return opportunities.slice(0, 10);
}

// --- REPORT ---

function buildReport(signals, opportunities) {
  let report = `# Opportunity Report — ${signals.date}\n\n`;
  report += `*Top ${opportunities.length} Opportunities, bewertet nach Signal × Builder-Fit × Markt / Komplexität.*\n\n`;

  for (let i = 0; i < opportunities.length; i++) {
    const opp = opportunities[i];
    report += `### ${i + 1}. ${opp.name}\n\n`;
    report += `**Problem:** ${opp.problem}\n\n`;
    report += `**Wer hat den Pain:** ${opp.who_has_pain}\n\n`;
    report += `**Lösung:** ${opp.proposed_solution}\n\n`;
    report += `**Warum jetzt:** ${opp.why_now}\n\n`;
    report += `**Schwierigkeit:** ${opp.difficulty}/5 · **MVP:** ${opp.mvp_weeks} Wochen · **Revenue:** ${opp.revenue_model}\n\n`;

    report += `| Score | Wert |\n|-------|------|\n`;
    report += `| Signal | ${opp.signal_strength} (${opp.signal_count} Signale) |\n`;
    report += `| Builder Fit | ${opp.builder_fit_score}/5 |\n`;
    report += `| Markt | ${opp.market_score}/5 |\n`;
    report += `| Komplexität | ${opp.complexity_score}/5 |\n`;
    report += `| **Final Score** | **${opp.final_score}** |\n\n`;

    report += `**Risiken:**\n`;
    for (const risk of opp.risks) {
      report += `- ${risk}\n`;
    }
    report += '\n';

    report += `**Nächste Schritte:**\n`;
    report += `- 30 Min: ${opp.next_actions.step_30_min}\n`;
    report += `- 2 Std: ${opp.next_actions.step_2_hours}\n`;
    report += `- 6 Std: ${opp.next_actions.step_6_hours}\n\n`;

    if (opp.evidence_links.length > 0) {
      report += `**Belege:**\n`;
      for (const link of opp.evidence_links.slice(0, 4)) {
        report += `- ${link}\n`;
      }
      report += '\n';
    }

    report += `---\n\n`;
  }

  return report;
}
