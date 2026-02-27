import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { queryAI, hasAPIKey } from '../analyzers/ai-client.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

export async function generateIdeas(signals, trendsReport, opportunitiesReport) {
  console.log('🛠️  Generating project ideas...');

  if (hasAPIKey()) {
    const result = await generateIdeasWithAI(trendsReport, opportunitiesReport);
    if (result) return result;
  }
  return generateIdeasHeuristic(signals);
}

async function generateIdeasWithAI(trendsReport, opportunitiesReport) {
  try {
    const promptTemplate = readFileSync(
      join(ROOT, 'directives', 'prompts', 'generate-ideas.md'), 'utf-8'
    );
    const prompt = promptTemplate
      .replace('{{opportunities}}', opportunitiesReport)
      .replace('{{trends}}', trendsReport);
    const result = await queryAI(prompt);
    if (result) {
      console.log('  ✓ AI-powered idea generation');
      return result;
    }
  } catch (err) {
    console.warn(`  ⚠ AI idea generation failed: ${err.message}`);
  }
  return null;
}

// --- Signal-driven idea library ---
// Optimized for: A) Micro SaaS, B) Automation/Bots, C) Social Sector optional
// Every idea is: solo-realistic, 2-4 weeks, clear buyer, recurring revenue, MVP + anti-scope.

const IDEA_LIBRARY = [
  // === A: MICRO SAAS ===
  {
    triggers: /automat|workflow|pipeline|zapier|n8n|make/i,
    category: 'micro_saas',
    name: 'Niche Workflow SaaS',
    oneliner: 'Ein Micro-SaaS das genau einen Business-Workflow mit KI automatisiert — kein generischer Builder.',
    buyer: 'Ops-Manager in KMUs, Freelancer mit wiederkehrenden Prozessen',
    description: 'Wähle einen konkreten Workflow (z.B. Invoice-Processing, Termin-Followups, Angebotsversand) und automatisiere ihn end-to-end. Kein Zapier-Klon — ein Workflow, sofort einsatzbereit.',
    stack: 'Node.js, Express, Claude/GPT API, Cron, Hetzner VPS',
    plan: ['Tag 1-3: Workflow analysieren + Kernlogik + API-Endpunkte', 'Tag 4-7: Web-UI + Trigger-System + Monitoring', 'Tag 8-10: Onboarding-Flow + Stripe + Launch'],
    monetization: '€29/Monat pro Workflow-Instanz. €99/Mo für Custom-Konfiguration.',
    mvp_scope: 'Ein Workflow, ein Trigger, ein Output-Format, Web-Dashboard',
    anti_scope: 'Kein Workflow-Builder, keine Custom-Logik-UI, keine Mobile App, max 1 Integration',
    differentiator: 'Kein generischer Automations-Builder. Ein Workflow, perfekt gelöst, Setup in 5 Minuten.'
  },
  {
    triggers: /rag|retriev|search|knowledge|document|pdf|compliance/i,
    category: 'micro_saas',
    name: 'Document Q&A SaaS',
    oneliner: 'Dokumente hochladen, Fragen stellen, Antworten mit Quellenangaben bekommen.',
    buyer: 'Legal-Teams, Compliance-Abteilungen, Consulting-Firmen',
    description: 'Fokussiertes RAG-Tool für eine Dokumenten-Nische. Z.B.: Vertragsprüfung, Compliance-Checks, internes Wiki-Q&A. Upload → Frage → Antwort mit Seitenangabe.',
    stack: 'Node.js, Claude/OpenAI Embeddings, SQLite + Vektoren, Express, Hetzner',
    plan: ['Tag 1-3: Document Ingestion + RAG-Pipeline + Chat-API', 'Tag 4-7: Web-UI + Quellen-Links + Multi-Doc', 'Tag 8-14: Auth + Stripe + Admin + Launch'],
    monetization: '€39/Mo für 100 Dokumente, €99/Mo unlimited.',
    mvp_scope: 'PDF-Upload, Chat-Interface, Quellenangaben, ein Nutzer-Typ',
    anti_scope: 'Kein Notion/Confluence-Connector, kein Team-Management, kein eigenes Embedding-Modell',
    differentiator: 'Setup in 5 Minuten. Fokus auf eine Nische statt generischer Chatbot-Builder.'
  },
  {
    triggers: /email|outreach|sales|crm|lead/i,
    category: 'micro_saas',
    name: 'AI Outreach Personalizer',
    oneliner: 'CSV mit Leads rein, personalisierte Emails raus — basierend auf echtem Research.',
    buyer: 'SDRs, Freelancer, kleine Sales-Teams',
    description: 'Tool das LinkedIn/Website eines Leads crawlt, relevante Talking Points findet und personalisierte Email-Drafts generiert. Nicht "Hi {name}" — echte Anknüpfungspunkte.',
    stack: 'Node.js, Cheerio, Claude API, Express, CSV-Parser',
    plan: ['Tag 1-3: Lead-Research-Pipeline + Email-Generierung', 'Tag 4-7: Web-UI + Batch-Processing + Ton-Presets', 'Tag 8-10: Stripe + Export + Launch'],
    monetization: '€29/Mo für 200 Leads, €79/Mo für 1000 Leads.',
    mvp_scope: 'CSV-Import, Web-Scraping, personalisierte Drafts, CSV-Export',
    anti_scope: 'Kein CRM, kein Email-Versand, kein Tracking, keine Sequenzen',
    differentiator: 'Tiefes Research pro Lead statt oberflächliches Merge-Tagging.'
  },
  {
    triggers: /content|write|copy|blog|seo|newsletter/i,
    category: 'micro_saas',
    name: 'Content Repurposer SaaS',
    oneliner: 'Ein Blogpost rein → 10 plattformoptimierte Social-Posts raus.',
    buyer: 'B2B-Marketing-Manager, Solopreneure, kleine Agenturen',
    description: 'Nimmt Long-Form-Content und erstellt plattformoptimierte Versionen: LinkedIn-Post, X-Thread, Newsletter-Snippet, Instagram-Caption. Versteht Tonalität und Plattform-Regeln.',
    stack: 'Node.js, Claude API, Express, React Frontend',
    plan: ['Tag 1-3: Repurposing-Engine + Template-System', 'Tag 4-7: Web-UI + Vorschau + Tone-Kalibrierung', 'Tag 8-10: Stripe + Plattform-Presets + Launch'],
    monetization: '€19/Mo für 50 Repurposes, €49/Mo unlimited.',
    mvp_scope: 'Text-Input, 3 Plattformen (LinkedIn, X, Newsletter), Tone-Wahl',
    anti_scope: 'Kein Scheduling, kein Social-Media-Connector, keine Bild-Generierung',
    differentiator: 'Behält Stimme/Stil konsistent. Strategische Anpassung, nicht nur Umformatierung.'
  },
  {
    triggers: /api|sdk|developer|devtool|cli|terminal/i,
    category: 'micro_saas',
    name: 'AI Dev CLI Tool',
    oneliner: 'Ein CLI-Tool das einen nervigen Developer-Workflow mit KI löst — npm install und los.',
    buyer: 'Solo-Entwickler, kleine Dev-Teams, DevOps-Engineers',
    description: 'Fokussiert auf einen Workflow: Changelog-Gen, PR-Review, Error-Triage, API-Doc-Gen, oder Commit-Messages. npm-Paket, Config-File, Freemium-Modell.',
    stack: 'Node.js, Commander.js, Claude API, npm Registry',
    plan: ['Tag 1-3: CLI-Gerüst + KI-Integration + Kernfeature', 'Tag 4-7: Config, .rc-Datei, Edge Cases, Tests', 'Tag 8-10: npm publish + Stripe + Show HN'],
    monetization: '10 Aufrufe/Tag frei, €9/Mo unlimited. Teams: €29/Mo.',
    mvp_scope: 'Ein Feature, CLI-Interface, npm-Paket, Config-File',
    anti_scope: 'Keine GUI, keine IDE-Extension, keine Team-Features, max 1 LLM-Provider',
    differentiator: 'Ein Workflow, perfekt gelöst. Läuft im Terminal, keine Web-App nötig.'
  },

  // === B: AUTOMATION / BOT ===
  {
    triggers: /bot|chatbot|slack|discord|telegram|whatsapp/i,
    category: 'bot_platform',
    name: 'AI Knowledge Bot für Teams',
    oneliner: 'Slack/WhatsApp Bot der Team-Fragen beantwortet basierend auf eurer Dokumentation.',
    buyer: 'HR-Leads, Support-Teamleiter, Ops-Manager in KMUs',
    description: 'Bot der Unternehmensdokumente kennt und interne Fragen beantwortet. "Wo finde ich X?", "Was ist unsere Policy zu Y?" — 80% weniger repetitive Fragen. Setup: Docs verlinken, Bot einladen.',
    stack: 'Node.js, Slack/WhatsApp SDK, Claude API, Vector Store',
    plan: ['Tag 1-3: Bot-Framework + Docs-Ingestion + RAG', 'Tag 4-7: Antwort-Qualität + Admin-Commands + Feedback-Loop', 'Tag 8-14: Multi-Workspace + Stripe + Launch'],
    monetization: '€19/Mo pro Workspace. €49/Mo mit Custom Branding.',
    mvp_scope: 'Ein Messaging-Kanal, Markdown/PDF-Upload, Q&A-Bot, Admin-Commands',
    anti_scope: 'Kein Bot-Builder, keine Custom-Flows, kein CRM-Connector',
    differentiator: 'Lernt aus Team-Wissen. Setup in 10 Minuten statt Tagen.'
  },
  {
    triggers: /agent|agentic|autonomous|crew|swarm|tool.?use/i,
    category: 'automation_system',
    name: 'Vertikaler AI-Agent',
    oneliner: 'Ein spezialisierter KI-Agent der einen kompletten Branchenprozess end-to-end automatisiert.',
    buyer: 'Ops-Manager in KMUs, Agenturen, Support-Leads',
    description: 'Wähle eine Branche (Support, HR, Legal, Sales) und baue einen Agenten der 5-10 Schritte eines häufigen Prozesses autonom erledigt. Z.B.: Support-Ticket → Kategorisierung → Antwort-Draft → Eskalation.',
    stack: 'Node.js, Claude API (tool_use), Express, PostgreSQL',
    plan: ['Tag 1-3: Branche wählen + Prozess-Mapping + Agent-Logik', 'Tag 4-7: Tool-Definitionen + Review-UI + Error-Handling', 'Tag 8-14: Dashboard + Stripe + Launch'],
    monetization: '€49-149/Mo je nach Volumen. ROI klar messbar.',
    mvp_scope: 'Ein Prozess, 5 Schritte, Review-UI, Email-Notification',
    anti_scope: 'Kein Agent-Builder, keine Custom-Tools, keine Multi-Branche',
    differentiator: 'Kein generischer Agent-Builder. Ein Prozess, eine Branche, sofort produktiv.'
  },
  {
    triggers: /voice|speech|audio|whisper|transcri|podcast|meeting/i,
    category: 'automation_system',
    name: 'Meeting-to-Actions Pipeline',
    oneliner: 'Meeting aufnehmen → Transkript → Zusammenfassung → Action Items → Follow-up-Draft.',
    buyer: 'Remote-Teams (5-20 Personen), Consulting-Firmen, Agenturen',
    description: 'Automatisierte Pipeline: Audio-Upload → Whisper-Transkription → KI-Zusammenfassung → Action Items mit Verantwortlichen → Follow-up-Email-Draft. Integration in Slack oder Email.',
    stack: 'Node.js, Whisper API, Claude API, Express, Slack SDK',
    plan: ['Tag 1-3: Audio → Transkript → Zusammenfassung Pipeline', 'Tag 4-7: Action-Item-Extraktion + Slack-Integration', 'Tag 8-14: Web-Dashboard + History + Stripe + Launch'],
    monetization: '€15/Mo für 10 Meetings, €39/Mo unlimited.',
    mvp_scope: 'Audio-Upload, Transkript, Zusammenfassung, Action Items, Email-Export',
    anti_scope: 'Kein Live-Recording, keine Video-Analyse, kein eigenes STT-Modell',
    differentiator: 'Nicht nur Transkription — extrahiert wer was bis wann tun muss.'
  },
  {
    triggers: /intake|form|onboard|questionnaire|survey/i,
    category: 'bot_platform',
    name: 'AI Intake Bot',
    oneliner: 'Conversational Bot der Onboarding-Prozesse intelligent führt und strukturierte Daten liefert.',
    buyer: 'Agenturen, Kanzleien, Berater mit Kunden-Onboarding',
    description: 'Statt starrer Formulare: ein Bot der Fragen stellt, nachfragt, validiert und strukturierte Daten liefert. Für Mandantenaufnahme, Projekt-Briefs, Versicherungsanfragen.',
    stack: 'Node.js, Claude API, Express, WhatsApp/Telegram SDK',
    plan: ['Tag 1-3: Conversational Engine + Flow-Definition + JSON-Output', 'Tag 4-7: WhatsApp/Web-Widget + Admin-Dashboard', 'Tag 8-14: Flow-Builder + Stripe + Launch'],
    monetization: '€29/Mo pro Bot-Instanz. €79/Mo mit Custom Branding.',
    mvp_scope: 'Ein Intake-Flow, Web-Chat, JSON-Export, Admin-View',
    anti_scope: 'Kein Formular-Builder, kein CRM-Connector, keine Analyse',
    differentiator: 'Conversational statt starr. Bot fragt nach, validiert, liefert saubere Daten.'
  },
  {
    triggers: /data|analytics|insight|monitor|dashboard|report/i,
    category: 'automation_system',
    name: 'AI Weekly Report Generator',
    oneliner: 'Verbinde Datenquellen, bekomme wöchentlich KI-Insights-Reports — automatisch per Email.',
    buyer: 'Marketing-Manager, Ops-Leads in KMUs, SaaS-Gründer',
    description: 'Automatisierte Report-Pipeline: Stripe/GA/eigene API anbinden → KI analysiert Trends → wöchentlicher Insights-Report per Email/Slack. Kein Dashboard-Bauen, kein SQL.',
    stack: 'Node.js, Stripe/GA APIs, Claude API, Express, Cron',
    plan: ['Tag 1-3: API-Connectors + Daten-Extraktion + Report-Template', 'Tag 4-7: KI-Insight-Engine + Email/Slack-Delivery', 'Tag 8-14: Web-Config + Stripe + Launch'],
    monetization: '€29/Mo für 3 Quellen, €79/Mo für 10+ Quellen.',
    mvp_scope: 'Ein Daten-Connector, wöchentlicher Report, Email-Delivery',
    anti_scope: 'Kein Live-Dashboard, kein SQL-Editor, keine Custom-Visualisierungen',
    differentiator: 'Insights statt Zahlen. Automatisch, keine manuelle Report-Erstellung.'
  },

  // === C: SOCIAL SECTOR (OPTIONAL) ===
  {
    triggers: /social|jugend|youth|welfare|gdpr|datenschutz|dokumentation|bericht/i,
    category: 'social_sector',
    name: 'GDPR-Safe Dokumentations-Assistent',
    oneliner: 'KI-Assistent der Gesprächsnotizen in strukturierte Berichte für Sozialarbeit umwandelt.',
    buyer: 'Leiter von Jugendhilfe-Einrichtungen, kommunale Sozialträger',
    description: 'Sozialarbeiter verbringen 40%+ ihrer Zeit mit Dokumentation. Dieser Assistent wandelt Freitext-Notizen in Hilfepläne, Verlaufsberichte und Stellungnahmen um. Läuft GDPR-konform auf eigenem Server.',
    stack: 'Node.js, Claude API (EU-Endpoint), Express, Hetzner VPS',
    plan: ['Tag 1-5: Bericht-Templates + KI-Transformation + Web-UI', 'Tag 6-10: DSGVO-Maßnahmen + Export (PDF/Word)', 'Tag 11-14: Server-Setup + Test mit 3 Nutzern + Launch'],
    monetization: '€39/Mo pro Einrichtung. €99/Mo mit Custom Templates.',
    mvp_scope: 'Freitext → Strukturierter Bericht, 2 Bericht-Typen, PDF-Export, Server-Deployment',
    anti_scope: 'Kein Fallmanagement-System, keine Aktenführung, keine Fachsoftware-Integration',
    differentiator: 'DSGVO-konform auf eigenem Server. Versteht Sozialarbeit-Fachsprache. Spart 40% Doku-Zeit.'
  },
  {
    triggers: /local|privacy|self.?host|ollama|on.?prem|offline/i,
    category: 'social_sector',
    name: 'Local AI Deployment Service',
    oneliner: 'Datenschutz-sichere KI für Unternehmen — läuft auf eurem eigenen Server.',
    buyer: 'IT-Leiter in Mittelstand, Kanzleien, Arztpraxen, öffentliche Verwaltung',
    description: 'Self-hosted AI-Tool für Dokumenten-Analyse, Q&A und Zusammenfassungen. Läuft auf einem einzelnen Hetzner-Server, keine Cloud-Abhängigkeit. Ideal für DSGVO-sensible Organisationen.',
    stack: 'Node.js, Ollama, Express, Docker Compose, Hetzner',
    plan: ['Tag 1-5: Docker-Setup + Ollama + Web-UI + Auth', 'Tag 6-10: Dokument-Upload + RAG-Pipeline + Multi-User', 'Tag 11-14: Deploy-Script + Doku + Test + Launch'],
    monetization: '€49/Mo Hosting + Support. €149/Mo mit Custom-Modell-Konfiguration.',
    mvp_scope: 'Docker Compose Setup, Web-UI, Dokument-Upload, Q&A, Auth',
    anti_scope: 'Kein eigenes Modell-Training, keine GPU-Cluster, kein Multi-Server',
    differentiator: 'Ein Server, ein Docker-Compose, volle Datenhoheit. Funktioniert offline.'
  },
];

function generateIdeasHeuristic(signals) {
  const today = new Date().toISOString().split('T')[0];

  // Combine all signals for matching
  const allItems = [
    ...(signals.ai_news || []),
    ...(signals.tech_trends?.hackernews || []),
    ...(signals.tech_trends?.github_trending || []),
    ...(signals.business_signals || []),
  ];

  // Score each idea by how many signals match its trigger
  const scored = IDEA_LIBRARY.map(idea => {
    const matchCount = allItems.filter(i => idea.triggers.test(`${i.title} ${i.summary || ''}`)).length;
    return { ...idea, matchCount };
  });

  // Sort by match count, take top 5-7
  scored.sort((a, b) => b.matchCount - a.matchCount);
  const selected = scored.filter(i => i.matchCount > 0).slice(0, 7);

  // If fewer than 5 matched, add highest-rated unmatched ones
  if (selected.length < 5) {
    const remaining = scored.filter(i => i.matchCount === 0);
    selected.push(...remaining.slice(0, 5 - selected.length));
  }

  const CATEGORY_LABELS = {
    micro_saas: 'Micro SaaS',
    bot_platform: 'Bot Platform',
    automation_system: 'Automation System',
    social_sector: 'Social Sector',
  };

  let report = `# Projekt-Ideen — ${today}\n\n`;
  report += `*${selected.length} konkrete Build-Ideen, optimiert für Solo-Builder. Fokus: Micro SaaS, Automation, Bots. Jede ist auf 2-4 Wochen MVP ausgelegt.*\n\n`;

  for (const idea of selected) {
    const signalNote = idea.matchCount > 0
      ? `*(${idea.matchCount} passende Signale heute)*`
      : `*(Evergreen-Idee)*`;
    const catLabel = CATEGORY_LABELS[idea.category] || idea.category;

    report += `### ${idea.name}\n\n`;
    report += `**Kategorie:** ${catLabel} · ${signalNote}\n\n`;
    report += `**Pitch:** ${idea.oneliner}\n\n`;
    report += `**Zielkunde:** ${idea.buyer}\n\n`;
    report += `**Was es tut:** ${idea.description}\n\n`;
    report += `**Tech Stack:** ${idea.stack}\n\n`;
    report += `**Build Plan:**\n`;
    for (const step of idea.plan) {
      report += `- ${step}\n`;
    }
    report += `\n**Monetarisierung:** ${idea.monetization}\n\n`;
    report += `**MVP Scope:** ${idea.mvp_scope}\n\n`;
    report += `**Anti-Scope:** ${idea.anti_scope}\n\n`;
    report += `**Differenzierung:** ${idea.differentiator}\n\n---\n\n`;
  }

  console.log(`  ✓ ${selected.length} signal-driven project ideas generated`);
  return report;
}
