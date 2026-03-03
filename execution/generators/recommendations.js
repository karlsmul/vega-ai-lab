// V3.1: Business Recommendations Generator
// Selects 1-2 TOP recommendations from scored opportunities.
// Requirements: STRONG + part_time_fit_score >= 4
//
// V3.1 additions:
// - Niche enforcement (no generic buyers)
// - Revenue reality model (concrete math)
// - Build artifact mode (concrete deliverable)
// - Weekend MVP plan (fits 35h/week job)
// - Better time feasibility (weekly schedule)

const CATEGORY_LABELS = {
  micro_saas: 'Micro SaaS',
  automation_system: 'Automation System',
  bot_platform: 'Bot Platform',
  social_sector_tools: 'Social Sector',
  local_ai_tools: 'Local AI',
  other: 'Other',
};

const REVENUE_LABELS = {
  LOW: '< 500€/Monat',
  MEDIUM: '500–3.000€/Monat',
  HIGH: '3.000–10.000€/Monat',
  VERY_HIGH: '10.000+€/Monat',
};

// --- NICHE ENFORCEMENT ---
// Generic buyer terms that trigger niche refinement
const GENERIC_BUYER_TERMS = /\b(businesses|teams|knowledge workers|companies|professionals|unternehmen|wissensarbeiter)\b/i;

// Niche suggestions per category
const NICHE_MAP = {
  micro_saas: [
    { niche: 'Kleine Steuerkanzleien in Deutschland (5-15 Mitarbeiter)', reason: 'Klarer Workflow, Dokumentenlast, erreichbar über Steuerberater-Verbände.' },
    { niche: 'Freelance-Übersetzer und Sprachdienstleister', reason: 'Repetitive Dokument-Workflows, preissensitiv aber zahlungsbereit für Zeitersparnis.' },
    { niche: 'Boutique-Personalvermittler (1-5 Personen)', reason: 'Hoher manueller Aufwand, klare Pain Points, reachable über LinkedIn.' },
  ],
  automation_system: [
    { niche: 'E-Commerce-Shops mit 50-500 Bestellungen/Tag', reason: 'Klarer Automatisierungsbedarf, messbarer ROI, Shopify/WooCommerce-Ökosystem.' },
    { niche: 'Kleine Marketing-Agenturen (3-10 Personen)', reason: 'Wiederkehrende Report-/Content-Workflows, hohe Bereitschaft für Automation.' },
    { niche: 'Immobilienmakler-Büros', reason: 'Repetitive Exposé-Erstellung, Kundenkommunikation, Dokumenten-Workflows.' },
  ],
  bot_platform: [
    { niche: 'Anwaltskanzleien mit Mandanten-Onboarding', reason: 'Strukturierter Intake-Prozess, hohe Zahlungsbereitschaft, DSGVO-relevant.' },
    { niche: 'Physiotherapie-Praxen', reason: 'Klarer Onboarding-Flow, Patienten-Anamnese, geringe digitale Reife = Chance.' },
    { niche: 'IT-Dienstleister mit Support-Tickets', reason: 'Hohe Ticket-Frequenz, repetitive FAQ, Slack/Teams-Integration naheliegend.' },
  ],
  social_sector_tools: [
    { niche: 'Jugendhilfe-Einrichtungen nach SGB VIII', reason: 'Domain-Wissen vorhanden, klarer Dokumentationsbedarf, DSGVO-kritisch.' },
    { niche: 'Ambulante Pflegedienste', reason: 'Dokumentationslast, klarer Workflow, öffentlich finanziert.' },
    { niche: 'Schulsozialarbeiter an Grundschulen', reason: 'Standardisierte Berichte, geringe digitale Reife = wenig Konkurrenz.' },
  ],
  local_ai_tools: [
    { niche: 'Arztpraxen mit Patientendaten', reason: 'Höchste Datenschutz-Anforderungen, klarer Use Case, zahlungskräftig.' },
    { niche: 'Notariate und Kanzleien', reason: 'Vertrauliche Dokumente, Bereitschaft für lokale Lösung, hoher Stundensatz.' },
    { niche: 'Mittelständische Ingenieurbüros', reason: 'Technische Dokumentation, IP-Schutz, eigene Server-Infrastruktur oft vorhanden.' },
  ],
  other: [
    { niche: 'Freiberufliche Berater und Coaches', reason: 'Erreichbar, zahlungsbereit, klare Pain Points.' },
    { niche: 'Kleine Handwerksbetriebe', reason: 'Geringe Digitalisierung, einfache Workflows automatisierbar.' },
    { niche: 'Online-Kursersteller und Infoprodukt-Seller', reason: 'Digital-affin, Content-Workflows, gewohnt für Tools zu zahlen.' },
  ],
};

const ARTIFACT_LABELS = {
  demo_app: 'Demo App',
  github_repo: 'GitHub Repo',
  landing_page: 'Landing Page',
  working_script: 'Working Script',
  bot_prototype: 'Bot Prototype',
};

/**
 * Generate 1-2 top business recommendations for a part-time builder.
 */
export function generateRecommendations(opportunities, profile) {
  console.log('🏆 Generating business recommendations...');

  if (!opportunities || opportunities.length === 0) {
    return {
      recommendations: [],
      report: '# Business Recommendations\n\nKeine Opportunities vorhanden — keine Empfehlungen heute.\n',
    };
  }

  // Filter: STRONG + part_time_fit >= 4
  const eligible = opportunities.filter(o => o.is_strong && o.part_time_fit_score >= 4);

  if (eligible.length === 0) {
    const report = buildNoRecommendationReport(opportunities);
    console.log('  ⚠ No opportunities meet recommendation criteria');
    return { recommendations: [], report };
  }

  // Take top 1-2
  const top = eligible.slice(0, 2);
  const recommendations = top.map((opp, idx) => buildRecommendation(opp, idx + 1, profile));
  const report = buildRecommendationReport(recommendations, opportunities.length, eligible.length);

  console.log(`  ✓ ${recommendations.length} recommendation(s): ${recommendations.map(r => r.name).join(', ')}`);
  return { recommendations, report };
}

function buildRecommendation(opp, rank, profile) {
  const catLabel = CATEGORY_LABELS[opp.category] || opp.category;
  const revenueLabel = REVENUE_LABELS[opp.revenue_potential] || opp.revenue_potential;

  // --- NICHE ENFORCEMENT ---
  const nicheRefinement = generateNicheRefinement(opp);

  // --- REVENUE REALITY ---
  const revenueReality = generateRevenueReality(opp);

  // --- TIME FEASIBILITY ---
  const timeFeasibility = generateTimeFeasibility(opp);

  // --- WEEKEND MVP PLAN ---
  const weekendPlan = generateWeekendPlan(opp);

  // --- ARTIFACT ---
  const artifact = {
    type: opp.artifact_type || 'demo_app',
    type_label: ARTIFACT_LABELS[opp.artifact_type] || 'Demo App',
    description: opp.artifact_description || '',
  };

  // Personal fit reasons
  const fitReasons = [];
  if (opp.builder_fit_score >= 4) fitReasons.push('Starker Skill-Match');
  if (opp.part_time_fit_score >= 5) fitReasons.push('Perfekt für Teilzeit-Sessions');
  else if (opp.part_time_fit_score >= 4) fitReasons.push('Gut machbar in 1-2h Sessions');
  if (opp.buyer_specificity_score >= 4) fitReasons.push('Klarer Zielkunde identifiziert');
  if (opp.market_score >= 4) fitReasons.push('Starke Marktsignale');
  if (['micro_saas', 'automation_system', 'bot_platform'].includes(opp.category)) {
    fitReasons.push(`Passt zu Fokus: ${catLabel}`);
  }

  return {
    rank,
    name: opp.name,
    opportunity_id: opp.opportunity_id,
    category: opp.category,
    category_label: catLabel,
    // Business case
    problem: opp.problem,
    target_buyer: opp.target_buyer,
    proposed_solution: opp.proposed_solution,
    pricing_anchor: opp.pricing_anchor,
    revenue_potential: opp.revenue_potential,
    revenue_label: revenueLabel,
    revenue_model: opp.revenue_model,
    // V3.1: Niche
    niche_refinement: nicheRefinement,
    // V3.1: Revenue Reality
    revenue_reality: revenueReality,
    // Fit
    builder_fit_score: opp.builder_fit_score,
    part_time_fit_score: opp.part_time_fit_score,
    buyer_specificity_score: opp.buyer_specificity_score,
    fit_reasons: fitReasons,
    // V3.1: Time feasibility
    time_feasibility: timeFeasibility,
    // V3.1: Weekend MVP plan
    weekend_plan: weekendPlan,
    // V3.1: Artifact
    artifact,
    // Action
    next_actions: opp.next_actions,
    risks: opp.risks,
    evidence_links: opp.evidence_links,
    // Scores
    final_score: opp.final_score,
    signal_strength: opp.signal_strength,
    market_score: opp.market_score,
    mvp_weeks: opp.mvp_weeks || 4,
    why_now: opp.why_now,
  };
}

// --- NICHE ENFORCEMENT (Step 1) ---

function generateNicheRefinement(opp) {
  const buyerText = opp.target_buyer || '';
  const needsRefinement = opp.buyer_specificity_score < 4 || GENERIC_BUYER_TERMS.test(buyerText);

  if (!needsRefinement) {
    return {
      needs_refinement: false,
      recommended_niche: buyerText.split(',')[0].trim(),
      possible_niches: [],
      reason: 'Zielkunde ist bereits spezifisch genug.',
    };
  }

  const category = opp.category || 'other';
  const niches = NICHE_MAP[category] || NICHE_MAP.other;

  return {
    needs_refinement: true,
    possible_niches: niches,
    recommended_niche: niches[0].niche,
    reason: niches[0].reason,
  };
}

// --- REVENUE REALITY (Step 2) ---

function generateRevenueReality(opp) {
  const pricingStr = opp.pricing_anchor || '29€/Monat';
  // Extract the lower number from pricing anchor like "29-49€/Monat"
  const priceMatch = pricingStr.match(/(\d+)/);
  const monthlyPrice = priceMatch ? parseInt(priceMatch[1]) : 29;

  const breakEvenTarget = 1000; // €/month as baseline
  const customersNeeded = Math.ceil(breakEvenTarget / monthlyPrice);

  return {
    pricing_assumption: `${monthlyPrice}€/Monat`,
    monthly_price: monthlyPrice,
    break_even_target: `${breakEvenTarget}€/Monat`,
    customers_needed: customersNeeded,
    scenarios: {
      starter: { customers: 5, revenue: 5 * monthlyPrice },
      realistic: { customers: 20, revenue: 20 * monthlyPrice },
      strong: { customers: 50, revenue: 50 * monthlyPrice },
    },
    explanation: generateRevenueExplanation(monthlyPrice, customersNeeded, opp),
  };
}

function generateRevenueExplanation(price, needed, opp) {
  const buyer = opp.target_buyer?.split(',')[0]?.trim() || 'Zielkunden';
  if (needed <= 10) {
    return `Bei ${price}€/Monat brauchst du nur ${needed} zahlende Kunden für 1.000€/Monat. Das ist realistisch erreichbar durch direktes Outreach an ${buyer}.`;
  } else if (needed <= 30) {
    return `${needed} Kunden bei ${price}€/Monat sind über 3-6 Monate aufbaubar. Fokus: Content-Marketing + direkter Outreach an ${buyer}.`;
  } else {
    return `${needed} Kunden bei ${price}€/Monat erfordern systematisches Marketing. Erwäge höheren Preis oder Premium-Tier für schnelleres Break-even.`;
  }
}

// --- TIME FEASIBILITY (Step 5) ---

function generateTimeFeasibility(opp) {
  const mvpWeeks = opp.mvp_weeks || 4;
  const ptFit = opp.part_time_fit_score || 3;

  // Realistic hour estimates based on part-time fit
  let weeklyHours, totalHours;
  if (ptFit >= 5) {
    weeklyHours = 7;
    totalHours = mvpWeeks * weeklyHours;
  } else if (ptFit >= 4) {
    weeklyHours = 9;
    totalHours = mvpWeeks * weeklyHours;
  } else {
    weeklyHours = 12;
    totalHours = mvpWeeks * weeklyHours;
  }

  // Cap at realistic range
  totalHours = Math.min(totalHours, 35);
  totalHours = Math.max(totalHours, 15);

  return {
    total_hours: `${totalHours - 5}–${totalHours} Stunden`,
    total_hours_num: totalHours,
    weekly_hours: weeklyHours,
    weekly_schedule: {
      dienstag_abend: '1.5h',
      donnerstag_abend: '1.5h',
      samstag: '3–4h',
    },
    explanation: `Bei ~${weeklyHours}h pro Woche neben deinem 35h-Job ist das MVP in ${mvpWeeks} Wochen realistisch. Jede Session ist in sich abgeschlossen — du kannst nach 1.5h aufhören und nächste Woche weitermachen. Der Schlüssel: Kleine, abgeschlossene Arbeitspakete statt langer Focus-Sessions.`,
  };
}

// --- WEEKEND MVP PLAN (Step 4) ---

function generateWeekendPlan(opp) {
  const artifact = opp.artifact_type || 'demo_app';
  const buyer = opp.target_buyer?.split(',')[0]?.trim() || 'Zielkunden';

  return {
    week_1: {
      title: 'Validierung',
      hours: '5–7h',
      tasks: [
        `Problem-Recherche: 3 ${buyer} identifizieren und ansprechen`,
        'Konkurrenzanalyse: Top-3 Alternativen und ihre Schwächen dokumentieren',
        `${opp.next_actions?.step_30_min || 'Ersten Research-Spike durchführen'}`,
        'Entscheidung: Weiterbauen oder Pivot?',
      ],
    },
    week_2: {
      title: 'MVP Core',
      hours: '8–10h',
      tasks: [
        `${opp.next_actions?.step_2_hours || 'Kern-Feature implementieren'}`,
        `${opp.next_actions?.step_6_hours?.replace(/,.*/,'') || 'Prototyp fertigstellen'}`,
        `Build Artifact: ${ARTIFACT_LABELS[artifact] || artifact}`,
        'Ersten Testlauf mit echten Daten',
      ],
    },
    week_3: {
      title: 'Deploy + erste Nutzer',
      hours: '6–8h',
      tasks: [
        'Deploy auf Hetzner/Vercel/Railway',
        'Einfache Landing Page oder README',
        `3 ${buyer} zum Testen einladen`,
        'Feedback sammeln, kritische Bugs fixen',
      ],
    },
    total_hours: '19–25h',
  };
}

// --- REPORT BUILDING ---

function buildNoRecommendationReport(opportunities) {
  let report = `# Business Recommendations — Heute\n\n`;
  report += `**Keine Empfehlung heute.**\n\n`;
  report += `Von ${opportunities.length} Opportunities erfüllt keine alle Kriterien:\n`;
  report += `- ✅ Brutal Realism: STRONG\n`;
  report += `- ✅ Part-Time Fit: ≥ 4/5\n\n`;

  report += `### Warum nicht?\n\n`;
  const strong = opportunities.filter(o => o.is_strong);

  if (strong.length === 0) {
    report += `- Keine Opportunity ist STRONG (fehlender Käufer, Problem, Revenue-Modell, oder MVP > 4 Wochen)\n`;
  } else {
    report += `- ${strong.length} Opportunities sind STRONG, aber keine hat Part-Time Fit ≥ 4\n`;
  }

  report += `\n### Top 3 Candidates (warum nicht empfohlen):\n\n`;
  for (const opp of opportunities.slice(0, 3)) {
    const reasons = [];
    if (!opp.is_strong) reasons.push(`Nicht STRONG: ${opp.weak_reasons?.join(', ')}`);
    if (opp.part_time_fit_score < 4) reasons.push(`Part-Time Fit nur ${opp.part_time_fit_score}/5`);
    report += `- **${opp.name}** — ${reasons.join('; ')}\n`;
  }
  report += `\n*Morgen erneut prüfen. Signale ändern sich täglich.*\n`;

  return report;
}

function buildRecommendationReport(recommendations, totalOpps, eligibleCount) {
  let report = `# Business Recommendations — Heute\n\n`;
  report += `*${eligibleCount} von ${totalOpps} Opportunities erfüllen alle Kriterien (STRONG + Part-Time Fit ≥ 4). Top ${recommendations.length} empfohlen.*\n\n`;

  for (const rec of recommendations) {
    report += `---\n\n`;
    report += `## ${rec.rank === 1 ? '🥇' : '🥈'} Empfehlung ${rec.rank}: ${rec.name}\n\n`;
    report += `**Kategorie:** ${rec.category_label} · **Final Score:** ${rec.final_score}\n\n`;

    // --- NICHE REFINEMENT ---
    if (rec.niche_refinement.needs_refinement) {
      report += `### Nische (Pflicht!)\n\n`;
      report += `> ⚠ Zielkunde "${rec.target_buyer}" ist zu generisch. Wähle eine Nische:\n\n`;
      for (let i = 0; i < rec.niche_refinement.possible_niches.length; i++) {
        const n = rec.niche_refinement.possible_niches[i];
        const marker = i === 0 ? ' ← **Empfohlen**' : '';
        report += `${i + 1}. **${n.niche}**${marker}\n   Grund: ${n.reason}\n\n`;
      }
      report += `**Empfohlene Nische:** ${rec.niche_refinement.recommended_niche}\n\n`;
    } else {
      report += `**Nische:** ${rec.niche_refinement.recommended_niche}\n\n`;
    }

    // Business Case
    report += `### Business Case\n\n`;
    report += `**Problem:** ${rec.problem}\n\n`;
    report += `**Zielkunde:** ${rec.niche_refinement.recommended_niche}\n\n`;
    report += `**Lösung:** ${rec.proposed_solution}\n\n`;
    report += `**Warum jetzt:** ${rec.why_now}\n\n`;

    // --- REVENUE REALITY ---
    const rev = rec.revenue_reality;
    report += `### Revenue Reality\n\n`;
    report += `| | |\n|---|---|\n`;
    report += `| Preisanker | ${rev.pricing_assumption} |\n`;
    report += `| Break-even | ${rev.break_even_target} |\n`;
    report += `| Kunden nötig | ${rev.customers_needed} |\n\n`;

    report += `**Wachstums-Szenarien:**\n\n`;
    report += `| Szenario | Kunden | Umsatz/Monat |\n|----------|--------|-------------|\n`;
    report += `| Starter | ${rev.scenarios.starter.customers} | ${rev.scenarios.starter.revenue}€ |\n`;
    report += `| Realistisch | ${rev.scenarios.realistic.customers} | ${rev.scenarios.realistic.revenue}€ |\n`;
    report += `| Stark | ${rev.scenarios.strong.customers} | ${rev.scenarios.strong.revenue}€ |\n\n`;
    report += `${rev.explanation}\n\n`;

    // --- BUILD ARTIFACT ---
    report += `### Build Artifact\n\n`;
    report += `**Typ:** ${rec.artifact.type_label}\n\n`;
    if (rec.artifact.description) {
      report += `**Was:** ${rec.artifact.description}\n\n`;
    }

    // --- TIME FEASIBILITY ---
    const tf = rec.time_feasibility;
    report += `### Zeitaufwand\n\n`;
    report += `| | |\n|---|---|\n`;
    report += `| Gesamt bis MVP | ${tf.total_hours} |\n`;
    report += `| Pro Woche | ~${tf.weekly_hours}h |\n`;
    report += `| MVP in | ${rec.mvp_weeks} Wochen |\n\n`;

    report += `**Wochenplan-Beispiel:**\n`;
    report += `- Dienstag Abend: ${tf.weekly_schedule.dienstag_abend}\n`;
    report += `- Donnerstag Abend: ${tf.weekly_schedule.donnerstag_abend}\n`;
    report += `- Samstag: ${tf.weekly_schedule.samstag}\n\n`;
    report += `${tf.explanation}\n\n`;

    // --- WEEKEND MVP PLAN ---
    const wp = rec.weekend_plan;
    report += `### Weekend MVP Plan (${wp.total_hours} gesamt)\n\n`;

    report += `**Woche 1: ${wp.week_1.title} (${wp.week_1.hours})**\n`;
    for (const task of wp.week_1.tasks) {
      report += `- [ ] ${task}\n`;
    }
    report += '\n';

    report += `**Woche 2: ${wp.week_2.title} (${wp.week_2.hours})**\n`;
    for (const task of wp.week_2.tasks) {
      report += `- [ ] ${task}\n`;
    }
    report += '\n';

    report += `**Woche 3: ${wp.week_3.title} (${wp.week_3.hours})**\n`;
    for (const task of wp.week_3.tasks) {
      report += `- [ ] ${task}\n`;
    }
    report += '\n';

    // Fit
    report += `### Persönlicher Fit\n\n`;
    for (const reason of rec.fit_reasons) {
      report += `- ✅ ${reason}\n`;
    }
    report += '\n';

    report += `| | |\n|---|---|\n`;
    report += `| Builder Fit | ${rec.builder_fit_score}/5 |\n`;
    report += `| Part-Time Fit | ${rec.part_time_fit_score}/5 |\n`;
    report += `| Buyer Specificity | ${rec.buyer_specificity_score}/5 |\n`;
    report += `| Markt | ${rec.market_score}/5 |\n\n`;

    // Risks
    report += `### Risiken\n\n`;
    for (const risk of rec.risks) {
      report += `- ⚠ ${risk}\n`;
    }
    report += '\n';

    // Evidence
    if (rec.evidence_links && rec.evidence_links.length > 0) {
      report += `### Belege\n\n`;
      for (const link of rec.evidence_links.slice(0, 5)) {
        report += `- ${link}\n`;
      }
      report += '\n';
    }
  }

  return report;
}
