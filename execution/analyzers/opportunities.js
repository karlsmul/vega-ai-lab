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

// --- OPPORTUNITY CATEGORIES ---

const CATEGORIES = {
  micro_saas: 'micro_saas',
  automation_system: 'automation_system',
  bot_platform: 'bot_platform',
  social_sector_tools: 'social_sector_tools',
  local_ai_tools: 'local_ai_tools',
  other: 'other',
};

// --- OPPORTUNITY TEMPLATES ---
// Each template is tagged with a category and has explicit target_buyer.

const OPPORTUNITY_TEMPLATES = [
  // === MICRO SAAS ===
  {
    pattern: /automat|workflow|no.?code|pipeline|zapier|n8n|make\.com/i,
    name: 'AI Workflow Micro-SaaS',
    category: CATEGORIES.micro_saas,
    problem: 'KMUs verschwenden Stunden mit repetitiven Aufgaben die KI in Sekunden erledigen könnte',
    target_buyer: 'Ops-Manager in 5-50 Personen Unternehmen, Freelancer mit wiederkehrenden Prozessen',
    proposed_solution: 'Fokussiertes Automations-Tool für eine Workflow-Nische (z.B. Invoice-Processing, Termin-Followups). Ein Workflow, perfekt gelöst.',
    revenue_model: 'subscription',
    mvp_weeks: 2,
    required_skills: ['nodejs', 'api_integration', 'automation'],
    required_focus: ['micro_saas', 'automation'],
    integrations: 1,
    infra_burden: 'low',
    risks: ['Zapier/Make sind etabliert — Nische muss eng genug sein', 'Kunden erwarten sofort Ergebnisse', 'Support-Aufwand bei Edge Cases'],
    next_actions: {
      step_30_min: 'Identifiziere 3 spezifische Workflows die schlecht automatisiert sind (Reddit/HN/eigene Erfahrung)',
      step_2_hours: 'Baue einen Prototyp für einen Workflow mit Node.js + Claude API und teste mit echten Daten',
      step_6_hours: 'Implementiere einen funktionierenden API-Endpunkt + Cron-Trigger + minimales Web-Dashboard'
    }
  },
  {
    pattern: /api|sdk|developer|devtool|cli|terminal/i,
    name: 'Developer Niche SaaS',
    category: CATEGORIES.micro_saas,
    problem: 'Entwickler brauchen fokussierte Tools für spezifische Pain Points in ihrem Workflow',
    target_buyer: 'Solo-Entwickler, kleine Dev-Teams (2-10), DevOps-Engineers',
    proposed_solution: 'Ein CLI-Tool oder API-Service der genau einen Dev-Workflow löst (Changelog-Gen, PR-Review, Doc-Gen, Error-Triage).',
    revenue_model: 'subscription',
    mvp_weeks: 2,
    required_skills: ['nodejs', 'api_integration'],
    required_focus: ['micro_saas'],
    integrations: 1,
    infra_burden: 'low',
    risks: ['GitHub/JetBrains integrieren ähnliche Features nativ', 'Preis-Sensitivität bei Dev-Tools', 'Schnelllebiger Markt'],
    next_actions: {
      step_30_min: 'Liste 5 nervige Dev-Workflows auf die du selbst hast und prüfe existierende Lösungen',
      step_2_hours: 'Baue ein CLI-Tool (Node.js + Commander.js) das einen davon löst und teste es an 3 eigenen Repos',
      step_6_hours: 'Veröffentliche als npm-Paket mit README, Config-Support und Freemium-Limit'
    }
  },
  {
    pattern: /content|write|copy|blog|seo|newsletter/i,
    name: 'Content Niche SaaS',
    category: CATEGORIES.micro_saas,
    problem: 'Content-Ersteller brauchen Repurposing-Tools die Tonalität und Plattform-Regeln verstehen',
    target_buyer: 'B2B-Marketing-Manager, Solopreneure mit Blog/Newsletter, kleine Agenturen',
    proposed_solution: 'SaaS das Long-Form-Content nimmt und plattformoptimierte Varianten erstellt (LinkedIn, X, Newsletter). Fokus auf ein Format.',
    revenue_model: 'subscription',
    mvp_weeks: 2,
    required_skills: ['nodejs', 'api_integration'],
    required_focus: ['micro_saas'],
    integrations: 1,
    infra_burden: 'low',
    risks: ['Jasper/Copy.ai dominieren den breiten Markt', 'Differenzierung nur über Nische möglich', 'API-Kosten bei hohem Volumen'],
    next_actions: {
      step_30_min: 'Analysiere 3 Content-Formate (Changelog, Case Study, Thread) und prüfe welches das schlechteste Tooling hat',
      step_2_hours: 'Baue einen Repurposer für ein Nischen-Format mit Template-System',
      step_6_hours: 'Füge Web-UI mit Vorschau + Export und Tone-of-Voice-Kalibrierung hinzu'
    }
  },
  {
    pattern: /rag|retriev|search|knowledge|document|pdf|compliance/i,
    name: 'Document Processing Micro-SaaS',
    category: CATEGORIES.micro_saas,
    problem: 'Unternehmen haben kritisches Wissen in Dokumenten vergraben das niemand findet',
    target_buyer: 'Wissensarbeiter, Legal-Teams, Compliance-Abteilungen, Consulting-Firmen',
    proposed_solution: 'Fokussiertes RAG-Tool für eine Dokumenten-Nische: Vertragsprüfung, Compliance-Check, oder internes Wiki-Q&A.',
    revenue_model: 'subscription',
    mvp_weeks: 3,
    required_skills: ['nodejs', 'api_integration'],
    required_focus: ['micro_saas'],
    integrations: 1,
    infra_burden: 'low',
    risks: ['RAG-Qualität schwankt je nach Dokument-Typ', 'Onboarding-Hürde bei Dokumenten-Upload', 'Notion AI als Konkurrent'],
    next_actions: {
      step_30_min: 'Sammle 10 Beispiel-Dokumente einer Nische und teste eine einfache RAG-Pipeline',
      step_2_hours: 'Baue ein Chat-Interface das Fragen über die Dokumente beantwortet mit Quellen-Links',
      step_6_hours: 'Füge Batch-Upload, Chunk-Visualisierung und Export (Markdown/PDF) hinzu'
    }
  },
  {
    pattern: /email|outreach|sales|crm|lead/i,
    name: 'AI Sales Micro-SaaS',
    category: CATEGORIES.micro_saas,
    problem: 'Sales-Teams versenden generische Nachrichten die ignoriert werden — Personalisierung ist zu zeitaufwändig',
    target_buyer: 'SDRs, Freelancer mit Outreach-Bedarf, kleine Sales-Teams (2-5 Personen)',
    proposed_solution: 'Tool das automatisch Prospect-Research macht und personalisierte Outreach-Drafts generiert. CSV rein, Emails raus.',
    revenue_model: 'subscription',
    mvp_weeks: 2,
    required_skills: ['nodejs', 'api_integration', 'automation'],
    required_focus: ['micro_saas', 'automation'],
    integrations: 1,
    infra_burden: 'low',
    risks: ['Spam-Perception — muss hochwertig sein', 'Apollo/Lemlist haben ähnliche Features', 'Deliverability ist nicht unser Problem'],
    next_actions: {
      step_30_min: 'Scrape 5 Company-Websites und generiere personalisierte Email-Drafts mit Claude API',
      step_2_hours: 'Baue eine Pipeline: CSV-Import → Research → Draft → Export',
      step_6_hours: 'Füge Web-UI mit Batch-Processing, Ton-Auswahl und CSV-Export hinzu'
    }
  },

  // === AUTOMATION SYSTEMS ===
  {
    pattern: /agent|agentic|autonomous|crew|swarm|tool.?use/i,
    name: 'Vertikaler AI-Agent Service',
    category: CATEGORIES.automation_system,
    problem: 'KMUs haben repetitive Mehrstufenprozesse die ein spezialisierter Agent end-to-end erledigen könnte',
    target_buyer: 'Ops-Manager in KMUs, Agenturen mit wiederkehrenden Prozessen, Support-Leads',
    proposed_solution: 'Spezialisierter AI-Agent für eine Branche: z.B. Support-Ticket-Triage, Bewerber-Screening, oder Rechnungsprüfung. Autonomer Multi-Step-Workflow.',
    revenue_model: 'subscription',
    mvp_weeks: 3,
    required_skills: ['nodejs', 'ai_agents', 'api_integration'],
    required_focus: ['automation', 'ai_bots'],
    integrations: 2,
    infra_burden: 'low',
    risks: ['Zuverlässigkeit bei autonomen Aktionen', 'Vertrauen der Nutzer in AI-Entscheidungen', 'Edge Cases in der Branche'],
    next_actions: {
      step_30_min: 'Wähle eine Branche und identifiziere den repetitivsten 5-Schritt-Prozess (eigene Erfahrung oder Reddit-Research)',
      step_2_hours: 'Baue einen Agent-Prototyp mit Claude tool_use der 3 Schritte des Workflows automatisiert',
      step_6_hours: 'Teste den Agenten an 10 echten Beispielen, miss Fehlerrate, baue Review-UI'
    }
  },
  {
    pattern: /voice|speech|audio|whisper|transcri|podcast|meeting/i,
    name: 'Meeting-Automations-Pipeline',
    category: CATEGORIES.automation_system,
    problem: 'Meeting-Ergebnisse verschwinden — Action Items werden nicht nachverfolgt',
    target_buyer: 'Remote-Teams (5-20 Personen), Consulting-Firmen, Agenturen',
    proposed_solution: 'Audio-Upload → Transkript → Zusammenfassung → Action Items → Follow-up-Draft. Pipeline die an Slack/Email integiert.',
    revenue_model: 'subscription',
    mvp_weeks: 3,
    required_skills: ['nodejs', 'api_integration', 'automation'],
    required_focus: ['automation'],
    integrations: 2,
    infra_burden: 'low',
    risks: ['Otter.ai/Fireflies als Konkurrenten', 'Audio-Qualität variiert stark', 'Transcription-Kosten bei Skalierung'],
    next_actions: {
      step_30_min: 'Teste Whisper API mit 3 Meeting-Recordings und miss Qualität + Kosten',
      step_2_hours: 'Baue die Pipeline: Audio → Transkript → Claude Zusammenfassung → Action Items JSON',
      step_6_hours: 'Füge Web-Upload, Slack-Integration und Export hinzu'
    }
  },
  {
    pattern: /data|analytics|insight|monitor|dashboard|report/i,
    name: 'AI Reporting Automator',
    category: CATEGORIES.automation_system,
    problem: 'Teams erstellen manuell Reports aus verschiedenen Datenquellen — jede Woche dieselbe Arbeit',
    target_buyer: 'Marketing-Manager, Ops-Leads in KMUs, Freelancer-Agenturen',
    proposed_solution: 'Automatisierte Report-Pipeline: Datenquellen anbinden → KI generiert wöchentliche Insights-Reports → Email/Slack-Delivery.',
    revenue_model: 'subscription',
    mvp_weeks: 3,
    required_skills: ['nodejs', 'api_integration', 'automation'],
    required_focus: ['automation', 'micro_saas'],
    integrations: 2,
    infra_burden: 'low',
    risks: ['Daten-Integrationen sind komplex', 'Posthog/Mixpanel integrieren eigene KI', 'Onboarding-Hürde bei Datenquellen'],
    next_actions: {
      step_30_min: 'Verbinde dich mit einer Datenquelle (Stripe oder GA) und extrahiere 3 Key Metrics per API',
      step_2_hours: 'Baue eine Pipeline: API-Daten → Claude Insights → Markdown-Report → Email',
      step_6_hours: 'Füge Web-Dashboard mit Report-History und Cron-Scheduling hinzu'
    }
  },

  // === BOT PLATFORMS ===
  {
    pattern: /bot|chatbot|slack|discord|telegram|whatsapp/i,
    name: 'AI Knowledge Bot Platform',
    category: CATEGORIES.bot_platform,
    problem: 'Teams beantworten dieselben internen Fragen immer wieder — Wissen ist in Docs verstreut',
    target_buyer: 'HR-Leads, Support-Teamleiter, Ops-Manager in 10-100 Personen Unternehmen',
    proposed_solution: 'Spezialisierter Slack/Discord/WhatsApp-Bot der Unternehmensdokumente kennt und Team-Fragen beantwortet. Setup: Docs verlinken, Bot einladen, fertig.',
    revenue_model: 'subscription',
    mvp_weeks: 2,
    required_skills: ['nodejs', 'bot_building', 'api_integration'],
    required_focus: ['ai_bots', 'b2b_tools'],
    integrations: 1,
    infra_burden: 'low',
    risks: ['Slack/Discord ändern Bot-APIs', 'Intercom/Zendesk integrieren eigene KI', 'Bot-Fatigue bei Nutzern'],
    next_actions: {
      step_30_min: 'Baue einen minimalen Slack-Bot der auf /frage reagiert und eine FAQ aus Markdown beantwortet',
      step_2_hours: 'Füge RAG über Team-Dokumente hinzu (Markdown/PDF-Ingestion)',
      step_6_hours: 'Teste mit einem echten Team (5 Personen), sammle Feedback, füge Admin-Commands hinzu'
    }
  },
  {
    pattern: /intake|form|onboard|questionnaire|survey/i,
    name: 'AI Intake Bot',
    category: CATEGORIES.bot_platform,
    problem: 'Onboarding-Prozesse und Intake-Formulare sind starr — Kunden brechen ab oder geben schlechte Daten',
    target_buyer: 'Agenturen, Kanzleien, Berater mit Kunden-Onboarding-Prozess',
    proposed_solution: 'Conversational AI-Bot der Intake-Prozesse führt: Fragen stellt, validiert, nachfragt, strukturierte Daten liefert.',
    revenue_model: 'subscription',
    mvp_weeks: 2,
    required_skills: ['nodejs', 'bot_building', 'api_integration'],
    required_focus: ['ai_bots'],
    integrations: 1,
    infra_burden: 'low',
    risks: ['Typeform/Tally haben KI-Features', 'Nutzer-Akzeptanz von Bot-basierten Formularen', 'Domain-spezifische Fragen brauchen Konfiguration'],
    next_actions: {
      step_30_min: 'Definiere einen konkreten Intake-Prozess (z.B. Mandanten-Aufnahme bei Anwalt) und schreibe den Frage-Flow',
      step_2_hours: 'Baue einen Web-Chat der den Flow conversational durchführt und JSON-Output generiert',
      step_6_hours: 'Füge WhatsApp/Telegram-Integration und Admin-Dashboard für Flow-Konfiguration hinzu'
    }
  },

  // === SOCIAL SECTOR (OPTIONAL) ===
  {
    pattern: /social|jugend|youth|welfare|gdpr|datenschutz|dokumentation|bericht/i,
    name: 'GDPR-Safe Dokumentations-Assistent',
    category: CATEGORIES.social_sector_tools,
    problem: 'Sozialarbeiter/Jugendarbeit verbringen 40%+ ihrer Zeit mit Dokumentation statt mit Klienten',
    target_buyer: 'Leiter von Jugendhilfe-Einrichtungen, Soziale Träger, kommunale Dienststellen',
    proposed_solution: 'Lokaler/GDPR-konformer KI-Assistent der Gesprächsnotizen in strukturierte Berichte (Hilfepläne, Verlaufsberichte) umwandelt.',
    revenue_model: 'subscription',
    mvp_weeks: 4,
    required_skills: ['nodejs', 'api_integration', 'server_deployment'],
    required_focus: ['social_sector_optional'],
    integrations: 0,
    infra_burden: 'low',
    risks: ['Öffentliche Träger haben lange Beschaffungszyklen', 'DSGVO-Anforderungen sind streng', 'Domain-Wissen nötig'],
    next_actions: {
      step_30_min: 'Recherchiere 3 Dokumentations-Anforderungen in der Jugendhilfe (SGB VIII)',
      step_2_hours: 'Baue einen Prototyp: Freitext-Notizen → strukturierter Hilfeplanbericht per Claude API',
      step_6_hours: 'Deploye auf eigenem Server (Hetzner), teste DSGVO-Konformität, baue Export-Funktion'
    }
  },

  // === LOCAL AI ===
  {
    pattern: /local|privacy|self.?host|ollama|on.?prem|offline/i,
    name: 'Local-First AI Tool',
    category: CATEGORIES.local_ai_tools,
    problem: 'Datenschutzbewusste Unternehmen brauchen KI-Werkzeuge die keine Daten an die Cloud senden',
    target_buyer: 'IT-Leiter in mittelständischen Unternehmen, Kanzleien, Arztpraxen',
    proposed_solution: 'Self-hosted AI-Tool das auf einem einzelnen Server (Hetzner/eigenes Rack) läuft. Dokument-Analyse, Zusammenfassung, Q&A — ohne Cloud.',
    revenue_model: 'subscription',
    mvp_weeks: 3,
    required_skills: ['nodejs', 'server_deployment'],
    required_focus: ['social_sector_optional'],
    integrations: 0,
    infra_burden: 'low',
    risks: ['Ollama-UX wird besser — Differenzierung nötig', 'Hardware-Anforderungen variieren', 'Support-Komplexität'],
    next_actions: {
      step_30_min: 'Teste 3 lokale Modelle via Ollama für Dokument-Q&A und miss Qualität vs Geschwindigkeit',
      step_2_hours: 'Baue eine Web-App die auf einem Server läuft: Dokument-Upload → lokale Analyse → Ergebnis',
      step_6_hours: 'Deploye auf Hetzner VPS, füge Auth + Multi-User-Support hinzu, teste mit 2 Nutzern'
    }
  },
];

// --- HARD PENALTY PATTERNS ---
// Signals that disqualify or heavily penalize an opportunity.

const HARD_PENALTY_PATTERNS = {
  foundation_model: /\b(foundation.?model|pre.?train|train.?from.?scratch|large.?scale.?train|billion.?param|dataset.?curation)\b/i,
  team_required: /\b(team.?of|multi.?department|enterprise.?procurement|board.?approval|hiring.?plan)\b/i,
  consumer_social: /\b(consumer.?social|tiktok.?clone|social.?network|dating.?app|photo.?sharing)\b/i,
  mobile_first: /\b(mobile.?first|ios.?only|android.?only|react.?native.?only|flutter.?only)\b/i,
  heavy_infra: /\b(gpu.?cluster|custom.?hardware|video.?rendering.?pipeline|distributed.?training|multi.?gpu)\b/i,
};

// --- POSITIVE SIGNAL PATTERNS ---

const POSITIVE_PATTERNS = {
  micro_saas: /\b(micro.?saas|niche.?tool|single.?purpose|focused.?tool|one.?thing.?well)\b/i,
  automation: /\b(automat|workflow|pipeline|bot|agent|cron|schedule|trigger)\b/i,
  b2b: /\b(team|business|company|enterprise|b2b|workflow|ops|productivity|saas)\b/i,
  single_server: /\b(hetzner|vps|single.?server|self.?host|docker.?compose|simple.?deploy)\b/i,
  recurring: /\b(subscri|monthly|recurring|mrr|arr|per.?month|per.?seat)\b/i,
};

// --- SCORING ---

function computeBuilderFitScore(template, profile) {
  let score = 2; // base

  // Focus match: does the opportunity match preferred types?
  const preferred = profile.preferences?.preferred_opportunity_types || [];
  const secondary = profile.preferences?.secondary_opportunity_types || [];
  const requiredFocus = template.required_focus || [];

  const hasPrimaryMatch = requiredFocus.some(f => preferred.includes(f));
  const hasSecondaryMatch = requiredFocus.some(f => secondary.includes(f));

  if (hasPrimaryMatch) score += 2;
  else if (hasSecondaryMatch) score += 1;

  // Skill match
  const skills = new Set(profile.skills || []);
  const requiredSkills = template.required_skills || [];
  const skillMatches = requiredSkills.filter(s => skills.has(s)).length;
  const skillRatio = requiredSkills.length > 0 ? skillMatches / requiredSkills.length : 0.5;
  score += skillRatio;

  // Solo feasible?
  const soloOk = (template.mvp_weeks || 4) <= (profile.constraints?.max_mvp_weeks || 4);
  if (!soloOk) score -= 1;

  // Avoid list penalty
  const avoidList = profile.preferences?.avoid || [];
  const category = template.category || 'other';
  if (avoidList.includes(category)) score -= 2;

  return Math.max(1, Math.min(5, Math.round(score)));
}

function computeMarketScore(template, matchingItems) {
  let score = 2; // base

  // Recurring revenue
  if (template.revenue_model === 'subscription') score += 0.5;

  // B2B signals
  const hasB2B = matchingItems.some(i => POSITIVE_PATTERNS.b2b.test(`${i.title} ${i.summary || ''}`));
  if (hasB2B) score += 1;

  // Pain/urgency signals
  const painKeywords = /\b(frustrat|pain|problem|struggle|broken|hate|annoying|waste|slow|expensive|manual|tedious)\b/i;
  const hasPain = matchingItems.some(i => painKeywords.test(`${i.title} ${i.summary || ''}`));
  if (hasPain) score += 0.5;

  // High engagement = demand signal
  const maxPoints = Math.max(...matchingItems.map(i => i.points || 0), 0);
  if (maxPoints > 100) score += 0.5;
  if (maxPoints > 300) score += 0.5;

  return Math.max(1, Math.min(5, Math.round(score)));
}

function computeComplexityScore(template) {
  let score = 1;

  const integrations = template.integrations || 0;
  score += integrations * 0.7;

  const infra = template.infra_burden || 'low';
  if (infra === 'medium') score += 1;
  if (infra === 'high') score += 2.5;

  return Math.max(1, Math.min(5, Math.round(score)));
}

// --- BRUTAL REALISM GATING ---

function assessRealism(template, matchingItems) {
  const has_clear_buyer = !!(template.target_buyer && template.target_buyer.length > 10);
  const has_clear_problem = !!(template.problem && template.problem.length > 20);
  const mvp_within_4_weeks = (template.mvp_weeks || 99) <= 4;
  const has_revenue_model = ['subscription', 'usage', 'service'].includes(template.revenue_model);

  const weak_reasons = [];
  if (!has_clear_buyer) weak_reasons.push('no_clear_buyer');
  if (!has_clear_problem) weak_reasons.push('no_clear_problem');
  if (!mvp_within_4_weeks) weak_reasons.push('mvp_too_long');
  if (!has_revenue_model) weak_reasons.push('no_revenue_model');

  const is_strong = weak_reasons.length === 0;

  return {
    has_clear_buyer,
    has_clear_problem,
    mvp_within_4_weeks,
    has_revenue_model,
    is_strong,
    weak_reasons,
  };
}

// --- HARD PENALTY CHECK ---

function computeHardPenalty(template, matchingItems) {
  const allText = matchingItems.map(i => `${i.title} ${i.summary || ''}`).join(' ');

  for (const [key, pattern] of Object.entries(HARD_PENALTY_PATTERNS)) {
    if (pattern.test(template.name) || pattern.test(template.proposed_solution)) {
      return { penalized: true, reason: key, factor: 0.1 };
    }
  }

  // Check if infra burden is high
  if (template.infra_burden === 'high') {
    return { penalized: true, reason: 'heavy_infra', factor: 0.2 };
  }

  return { penalized: false, reason: null, factor: 1.0 };
}

// --- POSITIVE BOOST ---

function computePositiveBoost(template, matchingItems) {
  let boost = 1.0;

  const category = template.category || 'other';

  // Primary category boost
  if (['micro_saas', 'automation_system', 'bot_platform'].includes(category)) {
    boost *= 1.3;
  }

  // Secondary category slight boost
  if (['social_sector_tools', 'local_ai_tools'].includes(category)) {
    boost *= 1.1;
  }

  // Recurring revenue
  if (template.revenue_model === 'subscription') {
    boost *= 1.1;
  }

  // Single server deployable
  if (template.infra_burden === 'low' && (template.integrations || 0) <= 2) {
    boost *= 1.1;
  }

  return boost;
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

    // Brutal realism assessment
    const realism = assessRealism(template, matchingItems);

    // Hard penalty check
    const penalty = computeHardPenalty(template, matchingItems);

    // Positive boost
    const boost = computePositiveBoost(template, matchingItems);

    // Final score with realism gating
    let rawScore = (signalStrength * builderFit * marketScore) / complexityScore;
    rawScore *= boost;
    rawScore *= penalty.factor;

    // Weak opportunities get heavy reduction
    if (!realism.is_strong) {
      rawScore *= 0.3;
    }

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
      category: template.category || CATEGORIES.other,
      problem: template.problem,
      target_buyer: template.target_buyer,
      proposed_solution: template.proposed_solution,
      why_now: topSignals.join('; '),
      difficulty: Math.max(1, Math.min(5, Math.round(complexityScore))),
      mvp_weeks: template.mvp_weeks,
      revenue_model: template.revenue_model,
      risks: template.risks,
      next_actions: template.next_actions,
      evidence_links: evidenceLinks,
      // Realism
      is_strong: realism.is_strong,
      weak_reasons: realism.weak_reasons,
      // Scores
      signal_strength: Math.round(signalStrength * 10) / 10,
      signal_count: matchingItems.length,
      builder_fit_score: builderFit,
      market_score: marketScore,
      complexity_score: complexityScore,
      final_score: Math.round(rawScore * 10) / 10,
    });
  }

  // Sort by final_score, tie-breakers: builder_fit (higher), complexity (lower), mvp_weeks (lower)
  opportunities.sort((a, b) => {
    if (b.final_score !== a.final_score) return b.final_score - a.final_score;
    if (b.builder_fit_score !== a.builder_fit_score) return b.builder_fit_score - a.builder_fit_score;
    if (a.complexity_score !== b.complexity_score) return a.complexity_score - b.complexity_score;
    return (a.mvp_weeks || 99) - (b.mvp_weeks || 99);
  });

  return opportunities.slice(0, 10);
}

// --- REPORT ---

const CATEGORY_LABELS = {
  micro_saas: 'Micro SaaS',
  automation_system: 'Automation System',
  bot_platform: 'Bot Platform',
  social_sector_tools: 'Social Sector',
  local_ai_tools: 'Local AI',
  other: 'Other',
};

function buildReport(signals, opportunities) {
  let report = `# Opportunity Report — ${signals.date}\n\n`;
  report += `*Top ${opportunities.length} Opportunities, bewertet nach Signal × Builder-Fit × Markt / Komplexität. Brutal Realism Mode aktiv.*\n\n`;

  for (let i = 0; i < opportunities.length; i++) {
    const opp = opportunities[i];
    const catLabel = CATEGORY_LABELS[opp.category] || opp.category;
    const strengthBadge = opp.is_strong ? 'STRONG' : 'WEAK';

    report += `### ${i + 1}. ${opp.name}\n\n`;
    report += `**Kategorie:** ${catLabel} · **${strengthBadge}**\n\n`;
    report += `**Problem:** ${opp.problem}\n\n`;
    report += `**Zielkunde:** ${opp.target_buyer}\n\n`;
    report += `**Lösung:** ${opp.proposed_solution}\n\n`;
    report += `**Warum jetzt:** ${opp.why_now}\n\n`;
    report += `**Schwierigkeit:** ${opp.difficulty}/5 · **MVP:** ${opp.mvp_weeks} Wochen · **Revenue:** ${opp.revenue_model}\n\n`;

    report += `| Score | Wert |\n|-------|------|\n`;
    report += `| Signal | ${opp.signal_strength} (${opp.signal_count} Signale) |\n`;
    report += `| Builder Fit | ${opp.builder_fit_score}/5 |\n`;
    report += `| Markt | ${opp.market_score}/5 |\n`;
    report += `| Komplexität | ${opp.complexity_score}/5 |\n`;
    report += `| **Final Score** | **${opp.final_score}** |\n\n`;

    if (!opp.is_strong) {
      report += `> ⚠ Schwach: ${opp.weak_reasons.join(', ')}\n\n`;
    }

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
