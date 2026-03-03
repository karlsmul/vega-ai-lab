// V3: Outreach Templates Generator
// Creates ready-to-use outreach templates for each recommendation:
// - LinkedIn connection message
// - Cold email template
// - Discovery call questions
// - Public validation post (LinkedIn / HN / Reddit)

/**
 * Generate outreach templates for recommendations.
 *
 * @param {Array} recommendations - From generateRecommendations
 * @param {Object} profile - User profile from config
 * @returns {{ templates: Array, report: string }}
 */
export function generateOutreach(recommendations, profile) {
  console.log('📧 Generating outreach templates...');

  if (!recommendations || recommendations.length === 0) {
    return {
      templates: [],
      report: '# Outreach Templates\n\nKeine Empfehlungen vorhanden — keine Outreach-Templates generiert.\n',
    };
  }

  const builderName = profile.name || 'Samuel';
  const templates = recommendations.map(rec => buildOutreachTemplates(rec, builderName, profile));
  const report = buildOutreachReport(templates);

  console.log(`  ✓ ${templates.length} outreach template set(s) generated`);
  return { templates, report };
}

function buildOutreachTemplates(rec, builderName, profile) {
  return {
    name: rec.name,
    category_label: rec.category_label,
    linkedin_message: buildLinkedInMessage(rec, builderName),
    cold_email: buildColdEmail(rec, builderName),
    discovery_questions: buildDiscoveryQuestions(rec),
    public_post_linkedin: buildLinkedInPost(rec, builderName),
    public_post_hn: buildHNPost(rec, builderName),
  };
}

function buildLinkedInMessage(rec, name) {
  const buyer = rec.target_buyer.split(',')[0].trim();
  return {
    subject: null, // LinkedIn messages don't have subjects
    body: `Hi! Ich bin ${name} und baue gerade ein Tool für ${buyer}.

Kurze Frage: Wie gehst du aktuell mit [${rec.problem.slice(0, 60)}...] um?

Ich suche 5 Leute für ein kurzes Feedback-Gespräch (15 min). Kein Verkauf — ich will verstehen, ob das Problem real ist.

Hättest du Interesse?`,
    notes: 'Personalisiere die erste Zeile mit etwas Spezifischem aus dem Profil der Person.',
  };
}

function buildColdEmail(rec, name) {
  const buyer = rec.target_buyer.split(',')[0].trim();
  return {
    subject: `Kurze Frage: Wie löst ihr [${rec.problem.slice(0, 40)}]?`,
    body: `Hi [Name],

ich bin ${name} und recherchiere gerade ein Problem, das viele ${buyer} betrifft:

${rec.problem}

Ich baue einen Prototyp und suche 5 Leute für ein kurzes Feedback-Gespräch (15 min, remote). Kein Sales-Pitch — ich will nur verstehen, ob und wie ihr das Problem habt.

Als Dankeschön: Früher Zugang zum Tool + Lifetime-Rabatt, wenn es was wird.

Hättest du 15 Minuten diese Woche?

Beste Grüße
${name}`,
    notes: 'Verwende den echten Firmennamen statt [Name]. Halte es unter 150 Wörtern.',
  };
}

function buildDiscoveryQuestions(rec) {
  return [
    {
      phase: 'Einstieg',
      questions: [
        `Erzähl mir kurz: Was ist deine Rolle und was machst du täglich?`,
        `Wie sieht dein typischer Workflow für [${rec.problem.slice(0, 50)}] aus?`,
      ],
    },
    {
      phase: 'Problem-Tiefe',
      questions: [
        `Was nervt dich am meisten an deinem aktuellen Prozess?`,
        `Wie viel Zeit verbringst du pro Woche damit?`,
        `Hast du schon versucht, das Problem zu lösen? Was hast du probiert?`,
        `Was würde passieren, wenn das Problem morgen gelöst wäre?`,
      ],
    },
    {
      phase: 'Lösung-Test',
      questions: [
        `Wenn ich dir ein Tool zeige, das [${rec.proposed_solution.slice(0, 60)}] — wäre das interessant?`,
        `Was müsste das Tool UNBEDINGT können?`,
        `Was wäre ein absolutes No-Go?`,
      ],
    },
    {
      phase: 'Zahlungsbereitschaft',
      questions: [
        `Zahlst du aktuell für Tools die dieses Problem lösen? Wenn ja, wie viel?`,
        `Wenn das Tool genau das löst — wären ${rec.pricing_anchor} im Rahmen?`,
        `Wer entscheidet bei euch über Tool-Käufe in dieser Preisklasse?`,
      ],
    },
    {
      phase: 'Abschluss',
      questions: [
        `Darf ich dir den Prototyp zeigen, wenn er fertig ist?`,
        `Kennst du 2-3 andere Leute mit dem gleichen Problem?`,
      ],
    },
  ];
}

function buildLinkedInPost(rec, name) {
  return {
    type: 'linkedin',
    body: `Ich baue gerade ein Tool für ${rec.target_buyer.split(',')[0].trim()}.

Das Problem: ${rec.problem}

Mein Ansatz: ${rec.proposed_solution.slice(0, 120)}

Ich suche 5 Beta-Tester die genau dieses Problem haben.

👉 Kommentiere "Interessiert" oder schreib mir eine DM.

Kein Verkauf. Ich will validieren, ob das Problem echt ist — bevor ich wochenlang baue.

#buildinpublic #${rec.category === 'micro_saas' ? 'microsaas' : rec.category === 'bot_platform' ? 'chatbots' : 'automation'} #ai`,
    notes: 'Poste morgens 8-9 Uhr (DACH) für maximale Reichweite. Antworte auf JEDEN Kommentar.',
  };
}

function buildHNPost(rec, name) {
  return {
    type: 'hackernews',
    title: `Show HN: ${rec.name} – ${rec.proposed_solution.slice(0, 60)}`,
    body: `Hi HN,

I'm building ${rec.name.toLowerCase()} because ${rec.problem.toLowerCase()}.

The idea: ${rec.proposed_solution}

Target users: ${rec.target_buyer}

I'm looking for feedback from people who have this problem. Is this something you'd pay ${rec.pricing_anchor} for?

What am I missing? What would make this a must-have vs nice-to-have?`,
    notes: 'HN posts sollten auf Englisch sein. Poste zu US-Morgen (15-17 Uhr MESZ). Antworte sachlich auf Kritik.',
  };
}

function buildOutreachReport(allTemplates) {
  let report = `# Outreach Templates\n\n`;
  report += `*Fertige Vorlagen für Kundenvalidierung. Kopieren, personalisieren, senden.*\n\n`;

  for (const tpl of allTemplates) {
    report += `---\n\n`;
    report += `## Outreach: ${tpl.name}\n\n`;
    report += `**Kategorie:** ${tpl.category_label}\n\n`;

    // LinkedIn DM
    report += `### 1. LinkedIn-Nachricht\n\n`;
    report += `\`\`\`\n${tpl.linkedin_message.body}\n\`\`\`\n\n`;
    report += `*${tpl.linkedin_message.notes}*\n\n`;

    // Cold Email
    report += `### 2. Cold Email\n\n`;
    report += `**Betreff:** ${tpl.cold_email.subject}\n\n`;
    report += `\`\`\`\n${tpl.cold_email.body}\n\`\`\`\n\n`;
    report += `*${tpl.cold_email.notes}*\n\n`;

    // Discovery Questions
    report += `### 3. Discovery-Call Fragen\n\n`;
    for (const phase of tpl.discovery_questions) {
      report += `**${phase.phase}:**\n`;
      for (const q of phase.questions) {
        report += `- "${q}"\n`;
      }
      report += '\n';
    }

    // LinkedIn Post
    report += `### 4. LinkedIn Post (öffentlich)\n\n`;
    report += `\`\`\`\n${tpl.public_post_linkedin.body}\n\`\`\`\n\n`;
    report += `*${tpl.public_post_linkedin.notes}*\n\n`;

    // HN Post
    report += `### 5. HackerNews Post\n\n`;
    report += `**Titel:** ${tpl.public_post_hn.title}\n\n`;
    report += `\`\`\`\n${tpl.public_post_hn.body}\n\`\`\`\n\n`;
    report += `*${tpl.public_post_hn.notes}*\n\n`;
  }

  return report;
}
