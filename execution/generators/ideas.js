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
// Each idea template includes trigger patterns so ideas are matched to today's signals.

const IDEA_LIBRARY = [
  {
    triggers: /automat|workflow|pipeline|zapier|n8n|make/i,
    name: 'AI Workflow Automator für [Nische]',
    oneliner: 'Ein fokussiertes Automations-Tool das einen spezifischen Business-Workflow mit KI erledigt.',
    description: 'Wähle einen konkreten Workflow (z.B. Invoice-Processing, Meeting-Followups, Lead-Qualification) und automatisiere ihn end-to-end mit LLMs. Nicht generisch — ein Workflow, perfekt gelöst.',
    stack: 'Node.js, Express, Claude/GPT API, Cron, optional: Slack SDK',
    plan: ['Tag 1: Workflow analysieren + Kernlogik implementieren', 'Tag 2-3: API-Endpunkte + Trigger-System', 'Tag 4-5: Dashboard + Monitoring', 'Tag 6-7: Onboarding-Flow + Launch'],
    monetization: '€29/Monat pro Workflow. Enterprise: €99/Mo mit Custom-Workflows.',
    launch: 'ProductHunt, relevante Subreddits, LinkedIn mit konkretem ROI-Beispiel.',
    differentiator: 'Kein generischer Automations-Builder. Ein Workflow, perfekt gelöst, sofort einsatzbereit.'
  },
  {
    triggers: /local|ollama|privacy|self.?host|gguf|offline/i,
    name: 'Local AI Document Analyst',
    oneliner: 'Chatten mit privaten Dokumenten — 100% lokal, keine Daten verlassen den Rechner.',
    description: 'Desktop-App: PDFs, Verträge, Research Papers droppen und Fragen stellen. Läuft komplett lokal mit Ollama + Embedding-Modellen. Ideal für Anwälte, Forscher, datenschutzbewusste Unternehmen.',
    stack: 'Tauri oder Electron, Ollama, ChromaDB, Node.js/Python',
    plan: ['Tag 1-2: Document Ingestion + lokale RAG-Pipeline', 'Tag 3-4: Desktop-UI + Chat-Interface', 'Tag 5-6: Multi-Document-Support + Export', 'Tag 7: Polish + Launch'],
    monetization: '€39 Einmalkauf oder €9/Monat. Keine Usage-Limits da lokal.',
    launch: 'HackerNews Show HN, Privacy-Communities, Legal-Tech-Foren.',
    differentiator: 'Zero Cloud-Abhängigkeit. Nutzer behalten volle Datenhoheit. Funktioniert offline.'
  },
  {
    triggers: /agent|agentic|autonomous|crew|swarm/i,
    name: 'Vertikaler AI-Agent als Service',
    oneliner: 'Ein spezialisierter KI-Agent der einen kompletten Branchenprozess automatisiert.',
    description: 'Wähle eine Branche (Legal, HR, Support, Real Estate) und baue einen Agenten der 5-10 Schritte eines häufigen Prozesses autonom erledigt. Z.B.: Mietvertragsprüfung, Bewerber-Screening, Support-Ticket-Triage.',
    stack: 'Node.js, Claude API (tool_use), PostgreSQL, React Dashboard',
    plan: ['Tag 1: Branche wählen + Prozess-Mapping', 'Tag 2-3: Agent-Logik + Tool-Definitionen', 'Tag 4-5: Web-Dashboard + Ergebnis-Review-UI', 'Tag 6-7: Fehlerbehandlung + Launch'],
    monetization: '€49-149/Monat je nach Volumen. ROI ist klar messbar.',
    launch: 'Branchenspezifische LinkedIn-Gruppen, Cold Outreach an 20 potentielle Kunden.',
    differentiator: 'Kein generischer Agent-Builder. Ein Prozess, eine Branche, sofort produktiv.'
  },
  {
    triggers: /api|sdk|developer|devtool|cli|terminal|vscode/i,
    name: 'AI-Powered Dev CLI Tool',
    oneliner: 'Ein CLI-Tool das einen nervigen Developer-Workflow mit KI löst.',
    description: 'Z.B.: AI-gestütztes Code Review, automatische Changelog-Generierung, intelligente Git-Commit-Messages, API-Dokumentation aus Code. Ein Tool, ein Problem, perfekt gelöst.',
    stack: 'Node.js, Commander.js, Claude/GPT API, npm-Paket',
    plan: ['Tag 1: Problem wählen + CLI-Grundgerüst', 'Tag 2-3: KI-Integration + Kernfeature', 'Tag 4-5: Config, .rc-Datei, Dokumentation', 'Tag 6-7: npm publish + Show HN'],
    monetization: 'Freemium: 10 Aufrufe/Tag frei, €9/Mo unlimited. Teams: €29/Mo.',
    launch: 'npm registry, Show HN, Dev Twitter, relevante GitHub Discussions.',
    differentiator: 'Fokus auf einen Workflow statt Swiss Army Knife. Läuft im Terminal, keine Web-App nötig.'
  },
  {
    triggers: /content|write|copy|blog|market|seo/i,
    name: 'AI Content Repurposer',
    oneliner: 'Aus einem Blogpost 10 Social-Media-Posts, Newsletter-Snippets und Threads generieren.',
    description: 'Tool das Long-Form-Content nimmt und plattformoptimierte Versionen erstellt. Versteht Tonalität, extrahiert Kernaussagen, formatiert für LinkedIn, X, Newsletter. Spart Content Creators Stunden pro Beitrag.',
    stack: 'Node.js, Claude API, React Frontend, optional: Scheduling via Buffer API',
    plan: ['Tag 1-2: Repurposing-Engine + Template-System', 'Tag 3-4: Web-UI + Vorschau', 'Tag 5-6: Ton-Kalibrierung + Plattform-Presets', 'Tag 7: Launch'],
    monetization: '€19/Mo für 50 Repurposes, €49/Mo unlimited.',
    launch: 'IndieHackers, ProductHunt, Content-Creator-Communities.',
    differentiator: 'Behält Stimme/Stil konsistent über Plattformen. Nicht nur Umformatierung — strategische Anpassung.'
  },
  {
    triggers: /voice|speech|audio|whisper|transcri|podcast/i,
    name: 'Meeting-zu-Action-Items Pipeline',
    oneliner: 'Meeting aufnehmen → automatisch Transkript, Zusammenfassung, Action Items, Follow-up-Draft.',
    description: 'Nimmt Audio/Video von Meetings und extrahiert: Transkript, 3-Satz-Zusammenfassung, Action Items mit Verantwortlichen, Follow-up-Email-Draft. Integration in Slack/Notion/Email.',
    stack: 'Node.js, Whisper API oder lokal, Claude für Zusammenfassung, Slack SDK',
    plan: ['Tag 1-2: Audio → Transkript → Zusammenfassungs-Pipeline', 'Tag 3-4: Action-Item-Extraktion + Slack-Integration', 'Tag 5-6: Web-Dashboard + History', 'Tag 7: Launch'],
    monetization: '€15/Mo für 10 Meetings, €39/Mo unlimited.',
    launch: 'ProductHunt, Remote-Work-Communities, Slack App Directory.',
    differentiator: 'Nicht nur Transkription — extrahiert konkret wer was bis wann tun muss.'
  },
  {
    triggers: /rag|retriev|search|knowledge|document|pdf/i,
    name: 'Docs-to-Chatbot Builder',
    oneliner: 'Lade deine Docs hoch, bekomme in 5 Minuten einen Chatbot der alles darüber weiß.',
    description: 'SaaS das Unternehmen erlaubt, ihre Dokumentation (PDFs, Notion, Confluence) hochzuladen und sofort einen Chatbot zu bekommen. Für internen Wissenstransfer oder Kunden-Support.',
    stack: 'Node.js, OpenAI Embeddings, Postgres+pgvector, React, Vercel',
    plan: ['Tag 1-2: Document Ingestion + Embedding Pipeline', 'Tag 3-4: Chat-Interface + Widget-Embed', 'Tag 5-6: Admin-Dashboard + Analytics', 'Tag 7: Launch'],
    monetization: '€29/Mo für 100 Docs, €79/Mo für 1000 Docs + Custom Branding.',
    launch: 'ProductHunt, SaaS-Communities, LinkedIn mit Demo-Video.',
    differentiator: 'Setup in 5 Minuten statt Tagen. Kein technisches Wissen nötig.'
  },
  {
    triggers: /bot|chatbot|slack|discord|telegram/i,
    name: 'AI Support Bot für KMUs',
    oneliner: 'Slack/Discord Bot der Team-Fragen beantwortet basierend auf eurer Dokumentation.',
    description: 'Bot der sich in Slack/Discord integriert, die Team-Dokumentation kennt und Fragen beantwortet. Reduziert interne "Wo finde ich X?"-Anfragen um 80%. Setup: Docs verlinken, Bot einladen, fertig.',
    stack: 'Node.js, Slack/Discord SDK, Claude API, Vector DB',
    plan: ['Tag 1-2: Bot-Framework + Docs-Anbindung', 'Tag 3-4: RAG-Pipeline + Antwort-Qualität', 'Tag 5-6: Admin-Commands + Feedback-Loop', 'Tag 7: Launch'],
    monetization: '€19/Mo pro Workspace. Enterprise: €49/Mo mit SSO.',
    launch: 'Slack App Directory, ProductHunt, Remote-Team-Communities.',
    differentiator: 'Lernt aus dem Team-Wissen. Nicht generisch — kennt eure Prozesse.'
  },
  {
    triggers: /image|vision|design|figma|ui|screenshot/i,
    name: 'Screenshot-zu-Code Konverter',
    oneliner: 'Screenshot hochladen, funktionierenden Code rausbekommen.',
    description: 'Web-Tool: Screenshot oder Mockup hochladen → bekomme clean HTML/CSS/React Code zurück. Nutzt Vision-Modelle um Layout, Farben, Abstände zu erkennen und in sauberen Code umzusetzen.',
    stack: 'Node.js, Claude Vision API, React Frontend, Tailwind',
    plan: ['Tag 1-2: Vision API Integration + Code-Generierung', 'Tag 3-4: Web-UI + Live-Preview', 'Tag 5-6: Framework-Auswahl (React/Vue/HTML) + Export', 'Tag 7: Launch'],
    monetization: '€9/Mo für 20 Konvertierungen, €29/Mo unlimited.',
    launch: 'Designer-Communities, Frontend-Dev Twitter, ProductHunt.',
    differentiator: 'Generiert echten, sauberen Code — nicht nur ein Bild-Overlay.'
  },
  {
    triggers: /email|outreach|sales|crm|lead/i,
    name: 'AI Cold-Outreach Personalizer',
    oneliner: 'Importiere eine Lead-Liste, bekomme personalisierte Emails die tatsächlich geöffnet werden.',
    description: 'Tool das LinkedIn/Website eines Leads scraped, relevante Talking Points findet und eine personalisierte Email generiert. Kein generisches "Ich habe gesehen dass Sie bei X arbeiten" — echte, relevante Anknüpfungspunkte.',
    stack: 'Node.js, Puppeteer/Cheerio, Claude API, CSV Import/Export',
    plan: ['Tag 1-2: Lead-Research-Pipeline + Scraping', 'Tag 3-4: Email-Generierung + Template-System', 'Tag 5-6: Batch-Processing + CSV-Workflow', 'Tag 7: Launch'],
    monetization: '€29/Mo für 200 Leads, €79/Mo für 1000 Leads.',
    launch: 'Sales-Communities, LinkedIn, IndieHackers.',
    differentiator: 'Tiefes Research pro Lead statt oberflächliches Merge-Tagging.'
  },
  {
    triggers: /data|analytics|insight|monitor|dashboard/i,
    name: 'KPI-Dashboard mit AI-Insights',
    oneliner: 'Verbinde deine Datenquellen, bekomme tägliche AI-Insights statt nur Zahlen.',
    description: 'Dashboard das sich mit Stripe, Google Analytics, Posthog etc. verbindet und nicht nur Zahlen zeigt, sondern erklärt: Warum ist der Umsatz gestiegen? Was korreliert mit Churn? Welcher Kanal performt überproportional?',
    stack: 'Node.js, React, Stripe/GA APIs, Claude für Insights, PostgreSQL',
    plan: ['Tag 1-2: API-Integrationen + Daten-Sammlung', 'Tag 3-4: Insight-Engine + Dashboard-UI', 'Tag 5-6: Alerting + Trend-Erkennung', 'Tag 7: Launch'],
    monetization: '€39/Mo für 3 Datenquellen, €99/Mo für 10+ Quellen.',
    launch: 'IndieHackers, SaaS-Founder-Communities, ProductHunt.',
    differentiator: 'Nicht nur Visualisierung — erklärt warum Zahlen sich ändern.'
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
  const allText = allItems.map(i => `${i.title} ${i.summary || ''}`).join(' ');

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

  let report = `# Projekt-Ideen — ${today}\n\n`;
  report += `*${selected.length} konkrete Build-Ideen, basierend auf heutigen Signalen. Jede ist auf 1-Wochen-MVP ausgelegt.*\n\n`;

  for (const idea of selected) {
    const signalNote = idea.matchCount > 0
      ? `*(${idea.matchCount} passende Signale heute)*`
      : `*(Evergreen-Idee)*`;

    report += `### ${idea.name}\n\n`;
    report += `${signalNote}\n\n`;
    report += `**Pitch:** ${idea.oneliner}\n\n`;
    report += `**Was es tut:** ${idea.description}\n\n`;
    report += `**Tech Stack:** ${idea.stack}\n\n`;
    report += `**Build Plan:**\n`;
    for (const step of idea.plan) {
      report += `- ${step}\n`;
    }
    report += `\n**Monetarisierung:** ${idea.monetization}\n\n`;
    report += `**Launch-Strategie:** ${idea.launch}\n\n`;
    report += `**Differenzierung:** ${idea.differentiator}\n\n---\n\n`;
  }

  console.log(`  ✓ ${selected.length} signal-driven project ideas generated`);
  return report;
}
