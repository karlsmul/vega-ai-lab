// Top Opportunity + Action Plan generator

/**
 * Select the top opportunity and generate an action plan.
 *
 * @param {Array} opportunities - Scored opportunity objects
 * @param {Array} topics - Clustered topics
 * @returns {{ topOpportunity: Object, actionPlan: string }}
 */
export function generateActionPlan(opportunities, topics) {
  console.log('🎯 Generating top opportunity + action plan...');

  if (!opportunities || opportunities.length === 0) {
    return { topOpportunity: null, actionPlan: '# Keine Opportunities gefunden\n\nHeute wurden keine passenden Opportunities erkannt.\n' };
  }

  // Top opportunity is already #1 after sorting
  const top = opportunities[0];

  const actionPlan = buildActionPlan(top, topics);

  console.log(`  ✓ Top opportunity: ${top.name} (Score: ${top.final_score})`);
  return { topOpportunity: top, actionPlan };
}

function buildActionPlan(opp, topics) {
  let plan = `# Top Opportunity: ${opp.name}\n\n`;
  plan += `**Final Score:** ${opp.final_score} · **Builder Fit:** ${opp.builder_fit_score}/5 · **Schwierigkeit:** ${opp.difficulty}/5\n\n`;

  // Summary
  plan += `## Zusammenfassung\n\n`;
  plan += `**Problem:** ${opp.problem}\n\n`;
  plan += `**Zielkunde:** ${opp.who_has_pain}\n\n`;
  plan += `**Lösung:** ${opp.proposed_solution}\n\n`;
  plan += `**Warum jetzt:** ${opp.why_now}\n\n`;
  plan += `**Revenue-Modell:** ${opp.revenue_model} · **MVP in:** ${opp.mvp_weeks} Wochen\n\n`;

  // 1-Day Plan
  plan += `## 1-Tages-Plan\n\n`;
  plan += `### Block 1: Research (2h)\n`;
  plan += `- ${opp.next_actions.step_30_min}\n`;
  plan += `- Analysiere die Top-3-Konkurrenten und ihre Schwächen\n`;
  plan += `- Dokumentiere: Was fehlt am Markt?\n\n`;
  plan += `### Block 2: Validation (2h)\n`;
  plan += `- ${opp.next_actions.step_2_hours}\n`;
  plan += `- Schreibe 3 potentiellen Nutzern eine kurze Nachricht\n`;
  plan += `- Sammle initiales Feedback\n\n`;
  plan += `### Block 3: Build Spike (4h)\n`;
  plan += `- ${opp.next_actions.step_6_hours}\n`;
  plan += `- Teste den Kern-Workflow end-to-end\n`;
  plan += `- Dokumentiere technische Risiken\n\n`;

  // 3-Day Plan
  plan += `## 3-Tages-Plan\n\n`;
  plan += `- **Tag 1:** Research + Validation + erster Prototyp\n`;
  plan += `- **Tag 2:** Core MVP implementieren, Kernfeature funktional\n`;
  plan += `- **Tag 3:** Polish, Landing Page, erste Distribution (HN Show, PH, Reddit)\n\n`;

  // MVP Scope
  plan += `## MVP Scope\n\n`;
  plan += `**In Scope:**\n`;
  plan += `- Kernfunktion die das Hauptproblem löst\n`;
  plan += `- Minimales UI (kann CLI oder simple Web-App sein)\n`;
  plan += `- Ein klarer Workflow von Input → Output\n`;
  plan += `- Basis-Auth und Nutzerverwaltung falls SaaS\n\n`;
  plan += `**Anti-Scope (NICHT im MVP):**\n`;
  plan += `- Team-Features, Rollen, Permissions\n`;
  plan += `- Mehr als 1 Integration\n`;
  plan += `- Mobile App\n`;
  plan += `- Analytics Dashboard\n`;
  plan += `- Eigene Modelle trainieren\n\n`;

  // Validation Script
  plan += `## Validierungs-Skript\n\n`;
  plan += `**Wen kontaktieren:**\n`;
  plan += `- ${opp.who_has_pain}\n`;
  plan += `- Suche in: LinkedIn, relevante Slack-Communities, Reddit r/SaaS, IndieHackers\n\n`;
  plan += `**Wo posten:**\n`;
  plan += `- HackerNews (Show HN)\n`;
  plan += `- ProductHunt\n`;
  plan += `- Relevante Subreddits\n`;
  plan += `- LinkedIn mit konkretem Use-Case-Beispiel\n\n`;
  plan += `**Was fragen:**\n`;
  plan += `- "Wie löst du aktuell [Problem]?"\n`;
  plan += `- "Was stört dich am meisten an deinem aktuellen Workflow?"\n`;
  plan += `- "Würdest du X€/Monat zahlen, wenn [Lösung]?"\n\n`;

  // Risks
  plan += `## Risiken\n\n`;
  for (const risk of opp.risks) {
    plan += `- ${risk}\n`;
  }
  plan += '\n';

  // Evidence
  if (opp.evidence_links && opp.evidence_links.length > 0) {
    plan += `## Belege\n\n`;
    for (const link of opp.evidence_links) {
      plan += `- ${link}\n`;
    }
    plan += '\n';
  }

  return plan;
}
