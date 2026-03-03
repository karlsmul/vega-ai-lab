// V3: Validation Plan Generator
// Creates a validation plan for each recommendation:
// - Target customers (who to talk to)
// - Assumptions to test
// - Validation tests with success criteria

/**
 * Generate validation plans for recommendations.
 *
 * @param {Array} recommendations - From generateRecommendations
 * @returns {{ plans: Array, report: string }}
 */
export function generateValidation(recommendations) {
  console.log('🧪 Generating validation plans...');

  if (!recommendations || recommendations.length === 0) {
    return {
      plans: [],
      report: '# Validation Plans\n\nKeine Empfehlungen vorhanden — keine Validierung nötig.\n',
    };
  }

  const plans = recommendations.map(rec => buildValidationPlan(rec));
  const report = buildValidationReport(plans);

  console.log(`  ✓ ${plans.length} validation plan(s) generated`);
  return { plans, report };
}

function buildValidationPlan(rec) {
  const assumptions = generateAssumptions(rec);
  const targetCustomers = generateTargetCustomers(rec);
  const tests = generateTests(rec, assumptions);

  return {
    name: rec.name,
    category: rec.category,
    category_label: rec.category_label,
    target_customers: targetCustomers,
    assumptions,
    tests,
    timeline: generateTimeline(rec),
  };
}

function generateTargetCustomers(rec) {
  const buyers = rec.target_buyer.split(',').map(b => b.trim());

  return {
    primary: buyers[0] || rec.target_buyer,
    secondary: buyers.slice(1),
    where_to_find: [
      'LinkedIn: Suche nach Jobtiteln die zum Zielkunden passen',
      'Reddit: r/SaaS, r/startups, branchenspezifische Subreddits',
      'Slack/Discord: relevante Community-Gruppen',
      'Indie Hackers: Forum + Meetups',
      'Twitter/X: Hashtags zum Problem-Bereich',
    ],
    how_many: '5-10 Gespräche für initiale Validierung',
  };
}

function generateAssumptions(rec) {
  const assumptions = [];

  // Problem assumption
  assumptions.push({
    id: 'A1',
    type: 'problem',
    assumption: `Das Problem "${rec.problem.slice(0, 80)}..." existiert und ist schmerzhaft genug, dass Leute dafür zahlen.`,
    critical: true,
  });

  // Buyer assumption
  assumptions.push({
    id: 'A2',
    type: 'buyer',
    assumption: `${rec.target_buyer} sind erreichbar und haben Budget für ${rec.pricing_anchor}.`,
    critical: true,
  });

  // Solution assumption
  assumptions.push({
    id: 'A3',
    type: 'solution',
    assumption: `Die vorgeschlagene Lösung löst das Problem besser als der aktuelle Workaround.`,
    critical: true,
  });

  // Willingness to pay
  assumptions.push({
    id: 'A4',
    type: 'willingness_to_pay',
    assumption: `Zielkunden würden ${rec.pricing_anchor} für diese Lösung bezahlen.`,
    critical: true,
  });

  // Part-time feasibility
  assumptions.push({
    id: 'A5',
    type: 'feasibility',
    assumption: `MVP ist in ${rec.mvp_weeks} Wochen mit ~${rec.weekly_hours}h/Woche realisierbar.`,
    critical: false,
  });

  return assumptions;
}

function generateTests(rec, assumptions) {
  return [
    {
      test_id: 'T1',
      tests_assumption: 'A1',
      name: 'Problem-Interview',
      description: `Führe 5 Gespräche mit ${rec.target_buyer}. Frage: "Wie löst du aktuell [Problem]?" und "Was stört dich am meisten?"`,
      method: 'interview',
      success_criteria: '≥3 von 5 beschreiben das Problem als Top-3 Pain Point',
      effort: '2-3 Stunden',
    },
    {
      test_id: 'T2',
      tests_assumption: 'A2',
      name: 'Käufer-Erreichbarkeit',
      description: 'Schreibe 20 potentielle Käufer auf LinkedIn an. Miss Response-Rate.',
      method: 'outreach',
      success_criteria: '≥15% Response-Rate (≥3 Antworten)',
      effort: '1-2 Stunden',
    },
    {
      test_id: 'T3',
      tests_assumption: 'A3',
      name: 'Lösung-Demo',
      description: `Baue einen klickbaren Prototyp oder Loom-Video der Lösung. Zeige es 5 Leuten.`,
      method: 'prototype',
      success_criteria: '≥3 sagen "Das würde ich sofort ausprobieren"',
      effort: '4-6 Stunden',
    },
    {
      test_id: 'T4',
      tests_assumption: 'A4',
      name: 'Preis-Validierung',
      description: `Frage direkt: "Würdest du ${rec.pricing_anchor} zahlen?" oder zeige eine Landing Page mit Pricing.`,
      method: 'pricing_test',
      success_criteria: '≥2 von 5 sagen "Ja, sofort" oder tragen sich auf Warteliste ein',
      effort: '1-2 Stunden',
    },
    {
      test_id: 'T5',
      tests_assumption: 'A1,A3',
      name: 'Öffentlicher Signal-Test',
      description: 'Poste einen konkreten Use-Case auf HackerNews (Show HN), Reddit, oder LinkedIn. Miss Engagement.',
      method: 'public_post',
      success_criteria: '≥50 Upvotes/Likes ODER ≥5 DMs/Kommentare mit "Wo kann ich das bekommen?"',
      effort: '1 Stunde + warten',
    },
  ];
}

function generateTimeline(rec) {
  return {
    week_1: 'Problem-Interviews (T1) + Käufer-Erreichbarkeit (T2)',
    week_2: 'Lösung-Demo bauen (T3) + Öffentlicher Post (T5)',
    week_3: 'Preis-Validierung (T4) + Entscheidung: Build or Kill',
    decision_gate: 'Nach Woche 3: Mindestens 3 von 5 Tests bestanden → Build MVP. Sonst: Pivot oder Kill.',
  };
}

function buildValidationReport(plans) {
  let report = `# Validation Plans\n\n`;
  report += `*Für jede Empfehlung: Annahmen testen bevor du baust.*\n\n`;

  for (const plan of plans) {
    report += `---\n\n`;
    report += `## Validation: ${plan.name}\n\n`;

    // Target Customers
    report += `### Zielkunden\n\n`;
    report += `**Primär:** ${plan.target_customers.primary}\n\n`;
    if (plan.target_customers.secondary.length > 0) {
      report += `**Sekundär:** ${plan.target_customers.secondary.join(', ')}\n\n`;
    }
    report += `**Wo finden:**\n`;
    for (const where of plan.target_customers.where_to_find) {
      report += `- ${where}\n`;
    }
    report += `\n**Wie viele:** ${plan.target_customers.how_many}\n\n`;

    // Assumptions
    report += `### Annahmen\n\n`;
    for (const a of plan.assumptions) {
      const critical = a.critical ? '🔴 KRITISCH' : '🟡 WICHTIG';
      report += `- **${a.id}** [${critical}]: ${a.assumption}\n`;
    }
    report += '\n';

    // Tests
    report += `### Validierungstests\n\n`;
    for (const t of plan.tests) {
      report += `#### ${t.test_id}: ${t.name}\n`;
      report += `- **Was:** ${t.description}\n`;
      report += `- **Erfolg wenn:** ${t.success_criteria}\n`;
      report += `- **Aufwand:** ${t.effort}\n`;
      report += `- **Testet:** ${t.tests_assumption}\n\n`;
    }

    // Timeline
    report += `### Validierungs-Timeline\n\n`;
    report += `| Woche | Aktivität |\n|-------|----------|\n`;
    report += `| Woche 1 | ${plan.timeline.week_1} |\n`;
    report += `| Woche 2 | ${plan.timeline.week_2} |\n`;
    report += `| Woche 3 | ${plan.timeline.week_3} |\n\n`;
    report += `**Entscheidungs-Gate:** ${plan.timeline.decision_gate}\n\n`;
  }

  return report;
}
