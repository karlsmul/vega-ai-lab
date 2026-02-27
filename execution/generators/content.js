import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { queryAI, hasAPIKey } from '../analyzers/ai-client.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

/**
 * Generate 3 content drafts:
 * 1. Newsjacking (today's top topic)
 * 2. Evergreen (recurring pattern from last 7 days)
 * 3. Build-in-public (based on top opportunity)
 *
 * Default language: German. Professional tone, no buzzword-salad.
 *
 * @param {Object} signals
 * @param {{ report: string, topics: Array }} trendsResult
 * @param {{ report: string, opportunities: Array }} oppsResult
 * @param {Object|null} delta
 * @returns {{ report: string, posts: Array }}
 */
export async function generateContent(signals, trendsResult, oppsResult, delta) {
  console.log('📝 Generating content drafts...');

  const topics = trendsResult?.topics || [];
  const opportunities = oppsResult?.opportunities || [];
  const topTopic = topics[0] || null;
  const topOpp = opportunities[0] || null;
  const recurringTopics = delta?.recurring_topics || [];

  let report;
  let posts;

  if (hasAPIKey()) {
    report = await generateWithAI(trendsResult.report, oppsResult.report, topTopic, topOpp, recurringTopics);
  }

  if (!report) {
    const result = generateHeuristic(signals, topTopic, topOpp, recurringTopics);
    report = result.report;
    posts = result.posts;
  }

  console.log('  ✓ Generated 3 content drafts (DE)');
  return { report, posts: posts || [] };
}

async function generateWithAI(trendsReport, oppsReport, topTopic, topOpp, recurringTopics) {
  try {
    const promptTemplate = readFileSync(
      join(ROOT, 'directives', 'prompts', 'draft-content.md'), 'utf-8'
    );
    const prompt = promptTemplate
      .replace('{{trends}}', trendsReport)
      .replace('{{opportunities}}', oppsReport);
    const result = await queryAI(prompt);
    if (result) {
      console.log('  ✓ AI-powered content generation');
      return result;
    }
  } catch (err) {
    console.warn(`  ⚠ AI content generation failed: ${err.message}`);
  }
  return null;
}

function generateHeuristic(signals, topTopic, topOpp, recurringTopics) {
  const today = new Date().toISOString().split('T')[0];
  const posts = [];

  let report = `# Content Drafts — ${today}\n\n`;
  report += `*3 Posts: Newsjacking, Evergreen-Insight, Build-in-Public. Sprache: Deutsch.*\n\n`;

  // --- POST 1: Newsjacking (today's top topic) ---
  report += `## 1. Newsjacking: Heutiges Top-Thema\n\n`;

  if (topTopic) {
    const topItems = topTopic.representative_items || [];
    const sources = topTopic.sources?.join(', ') || '';

    const post1 = {
      type: 'newsjacking',
      title: topTopic.topic_title,
      content: ''
    };

    report += `### LinkedIn\n\n`;
    report += `Heute bewegt sich die AI-Welt um ein Thema: **${topTopic.topic_title}**.\n\n`;
    report += `Was passiert ist:\n\n`;
    for (const item of topItems.slice(0, 3)) {
      report += `→ ${item.title} (${item.source})\n`;
    }
    report += `\nWarum das relevant ist:\n\n`;
    report += `${topTopic.item_count} Signale aus ${topTopic.sources?.length || 1} Quellen (${sources}) zeigen: Das ist kein Rauschen, das ist ein Trend.\n\n`;
    report += `Für Builder bedeutet das konkret: Wer jetzt Tools in diesem Bereich baut, hat einen Timing-Vorteil. Die Nachfrage ist da, das Tooling fehlt noch.\n\n`;
    report += `Meine Beobachtung: Die meisten AI-Produkte scheitern nicht an der Technologie, sondern am Timing. Zu früh = kein Markt. Zu spät = zu viel Konkurrenz.\n\n`;
    report += `Was baut ihr gerade im AI-Bereich?\n\n`;
    report += `#AI #BuildInPublic #TechTrends\n\n`;

    report += `### X/Twitter\n\n`;
    report += `${topTopic.item_count} Signale heute zu "${topTopic.topic_title}". Wenn ${topTopic.sources?.length || 1} unabhängige Quellen gleichzeitig ein Thema aufgreifen, ist es kein Zufall — es ist eine Opportunity.\n\n`;

    post1.content = `Newsjacking: ${topTopic.topic_title}`;
    posts.push(post1);
  } else {
    report += `*Kein dominantes Thema heute erkannt. Prüfe die Signale manuell.*\n\n`;
  }

  report += `---\n\n`;

  // --- POST 2: Evergreen Insight (recurring pattern) ---
  report += `## 2. Evergreen Insight: Wiederkehrendes Muster\n\n`;

  if (recurringTopics.length > 0) {
    const recurring = recurringTopics[0];

    report += `### LinkedIn\n\n`;
    report += `Ein Muster, das ich seit ${recurring.days_seen} Tagen beobachte:\n\n`;
    report += `**"${recurring.topic_title}"** taucht konsistent in meinem AI-Radar auf.\n\n`;
    report += `Das ist kein Hype-Spike. Das ist ein Dauerbrenner.\n\n`;
    report += `Die Implikation für Builder:\n\n`;
    report += `- Dauerbrenner-Themen haben stabile Nachfrage\n`;
    report += `- Stabile Nachfrage = geringeres Risiko für Produkte\n`;
    report += `- Geringeres Risiko = ideales Terrain für Solo-Gründer\n\n`;
    report += `Der Fehler, den die meisten machen: Sie jagen den neuesten Hype statt auf bewährte Muster zu setzen.\n\n`;
    report += `Mein nächster Schritt: Ein konkretes Tool in diesem Bereich bauen.\n\n`;
    report += `#IndieHacker #AI #SaaS\n\n`;

    report += `### X/Twitter\n\n`;
    report += `"${recurring.topic_title}" — jetzt ${recurring.days_seen} Tage in Folge in meinem AI-Radar. Hypes kommen und gehen. Dauerbrenner sind das Signal.\n\n`;

    posts.push({ type: 'evergreen', title: recurring.topic_title, content: `Evergreen: ${recurring.topic_title}` });
  } else {
    // Fallback: use a general evergreen insight
    report += `### LinkedIn\n\n`;
    report += `Eine Beobachtung aus meinem täglichen AI-Research:\n\n`;
    report += `Die erfolgreichsten AI-Produkte lösen keine neuen Probleme.\n\n`;
    report += `Sie lösen alte Probleme — aber 10x schneller, 10x günstiger, oder 10x einfacher.\n\n`;
    report += `Beispiele:\n`;
    report += `- Transkription gab es schon. Whisper macht es 100x günstiger.\n`;
    report += `- Codesuche gab es schon. Embedding-basierte Suche macht es 10x besser.\n`;
    report += `- Content-Erstellung gab es schon. LLMs machen den ersten Draft 10x schneller.\n\n`;
    report += `Die Frage ist nicht "Was ist möglich mit AI?" sondern "Welcher existierende Workflow ist unnötig langsam?"\n\n`;
    report += `#AI #Produktentwicklung #SaaS\n\n`;

    report += `### X/Twitter\n\n`;
    report += `Die besten AI-Produkte lösen keine neuen Probleme. Sie lösen alte Probleme 10x besser. Suche nicht nach neuen Use Cases — suche nach langsamen Workflows.\n\n`;

    posts.push({ type: 'evergreen', title: 'Alte Probleme, neue Geschwindigkeit', content: 'Evergreen insight' });
  }

  report += `---\n\n`;

  // --- POST 3: Build-in-Public (top opportunity) ---
  report += `## 3. Build-in-Public: Top-Opportunity\n\n`;

  if (topOpp) {
    report += `### LinkedIn\n\n`;
    report += `Mein AI-Opportunity-Scanner hat heute ${topOpp.signal_count} Signale für "${topOpp.name}" gefunden.\n\n`;
    report += `Das Problem: ${topOpp.problem}\n\n`;
    report += `Wer den Pain hat: ${topOpp.who_has_pain}\n\n`;
    report += `Meine Einschätzung:\n`;
    report += `- Builder Fit: ${topOpp.builder_fit_score}/5\n`;
    report += `- Markt-Score: ${topOpp.market_score}/5\n`;
    report += `- Komplexität: ${topOpp.complexity_score}/5\n`;
    report += `- MVP in: ${topOpp.mvp_weeks} Wochen\n\n`;
    report += `Nächster Schritt: ${topOpp.next_actions.step_30_min}\n\n`;
    report += `Ich dokumentiere den Prozess hier. Follow für Updates.\n\n`;
    report += `#BuildInPublic #AI #IndieHacker\n\n`;

    report += `### X/Twitter\n\n`;
    report += `Heutiges AI-Signal: ${topOpp.signal_count}x "${topOpp.name}" in meinem Scanner. Builder Fit ${topOpp.builder_fit_score}/5. MVP in ${topOpp.mvp_weeks} Wochen machbar. Erster Schritt heute: Research.\n\n`;

    posts.push({ type: 'build_in_public', title: topOpp.name, content: `Build: ${topOpp.name}` });
  } else {
    report += `*Keine Top-Opportunity heute identifiziert.*\n\n`;
  }

  return { report, posts };
}
