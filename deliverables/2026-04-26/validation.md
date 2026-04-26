# Validation Plans

*Für jede Empfehlung: Annahmen testen bevor du baust.*

---

## Validation: AI Workflow Micro-SaaS

### Zielkunden

**Primär:** Ops-Manager in 5-50 Personen Unternehmen

**Sekundär:** Freelancer mit wiederkehrenden Prozessen

**Wo finden:**
- LinkedIn: Suche nach Jobtiteln die zum Zielkunden passen
- Reddit: r/SaaS, r/startups, branchenspezifische Subreddits
- Slack/Discord: relevante Community-Gruppen
- Indie Hackers: Forum + Meetups
- Twitter/X: Hashtags zum Problem-Bereich

**Wie viele:** 5-10 Gespräche für initiale Validierung

### Annahmen

- **A1** [🔴 KRITISCH]: Das Problem "KMUs verschwenden Stunden mit repetitiven Aufgaben die KI in Sekunden erledigen ..." existiert und ist schmerzhaft genug, dass Leute dafür zahlen.
- **A2** [🔴 KRITISCH]: Ops-Manager in 5-50 Personen Unternehmen, Freelancer mit wiederkehrenden Prozessen sind erreichbar und haben Budget für 29-49€/Monat.
- **A3** [🔴 KRITISCH]: Die vorgeschlagene Lösung löst das Problem besser als der aktuelle Workaround.
- **A4** [🔴 KRITISCH]: Zielkunden würden 29-49€/Monat für diese Lösung bezahlen.
- **A5** [🟡 WICHTIG]: MVP ist in 2 Wochen mit ~undefinedh/Woche realisierbar.

### Validierungstests

#### T1: Problem-Interview
- **Was:** Führe 5 Gespräche mit Ops-Manager in 5-50 Personen Unternehmen, Freelancer mit wiederkehrenden Prozessen. Frage: "Wie löst du aktuell [Problem]?" und "Was stört dich am meisten?"
- **Erfolg wenn:** ≥3 von 5 beschreiben das Problem als Top-3 Pain Point
- **Aufwand:** 2-3 Stunden
- **Testet:** A1

#### T2: Käufer-Erreichbarkeit
- **Was:** Schreibe 20 potentielle Käufer auf LinkedIn an. Miss Response-Rate.
- **Erfolg wenn:** ≥15% Response-Rate (≥3 Antworten)
- **Aufwand:** 1-2 Stunden
- **Testet:** A2

#### T3: Lösung-Demo
- **Was:** Baue einen klickbaren Prototyp oder Loom-Video der Lösung. Zeige es 5 Leuten.
- **Erfolg wenn:** ≥3 sagen "Das würde ich sofort ausprobieren"
- **Aufwand:** 4-6 Stunden
- **Testet:** A3

#### T4: Preis-Validierung
- **Was:** Frage direkt: "Würdest du 29-49€/Monat zahlen?" oder zeige eine Landing Page mit Pricing.
- **Erfolg wenn:** ≥2 von 5 sagen "Ja, sofort" oder tragen sich auf Warteliste ein
- **Aufwand:** 1-2 Stunden
- **Testet:** A4

#### T5: Öffentlicher Signal-Test
- **Was:** Poste einen konkreten Use-Case auf HackerNews (Show HN), Reddit, oder LinkedIn. Miss Engagement.
- **Erfolg wenn:** ≥50 Upvotes/Likes ODER ≥5 DMs/Kommentare mit "Wo kann ich das bekommen?"
- **Aufwand:** 1 Stunde + warten
- **Testet:** A1,A3

### Validierungs-Timeline

| Woche | Aktivität |
|-------|----------|
| Woche 1 | Problem-Interviews (T1) + Käufer-Erreichbarkeit (T2) |
| Woche 2 | Lösung-Demo bauen (T3) + Öffentlicher Post (T5) |
| Woche 3 | Preis-Validierung (T4) + Entscheidung: Build or Kill |

**Entscheidungs-Gate:** Nach Woche 3: Mindestens 3 von 5 Tests bestanden → Build MVP. Sonst: Pivot oder Kill.

---

## Validation: AI Intake Bot

### Zielkunden

**Primär:** Agenturen

**Sekundär:** Kanzleien, Berater mit Kunden-Onboarding-Prozess

**Wo finden:**
- LinkedIn: Suche nach Jobtiteln die zum Zielkunden passen
- Reddit: r/SaaS, r/startups, branchenspezifische Subreddits
- Slack/Discord: relevante Community-Gruppen
- Indie Hackers: Forum + Meetups
- Twitter/X: Hashtags zum Problem-Bereich

**Wie viele:** 5-10 Gespräche für initiale Validierung

### Annahmen

- **A1** [🔴 KRITISCH]: Das Problem "Onboarding-Prozesse und Intake-Formulare sind starr — Kunden brechen ab oder geb..." existiert und ist schmerzhaft genug, dass Leute dafür zahlen.
- **A2** [🔴 KRITISCH]: Agenturen, Kanzleien, Berater mit Kunden-Onboarding-Prozess sind erreichbar und haben Budget für 39-79€/Monat.
- **A3** [🔴 KRITISCH]: Die vorgeschlagene Lösung löst das Problem besser als der aktuelle Workaround.
- **A4** [🔴 KRITISCH]: Zielkunden würden 39-79€/Monat für diese Lösung bezahlen.
- **A5** [🟡 WICHTIG]: MVP ist in 2 Wochen mit ~undefinedh/Woche realisierbar.

### Validierungstests

#### T1: Problem-Interview
- **Was:** Führe 5 Gespräche mit Agenturen, Kanzleien, Berater mit Kunden-Onboarding-Prozess. Frage: "Wie löst du aktuell [Problem]?" und "Was stört dich am meisten?"
- **Erfolg wenn:** ≥3 von 5 beschreiben das Problem als Top-3 Pain Point
- **Aufwand:** 2-3 Stunden
- **Testet:** A1

#### T2: Käufer-Erreichbarkeit
- **Was:** Schreibe 20 potentielle Käufer auf LinkedIn an. Miss Response-Rate.
- **Erfolg wenn:** ≥15% Response-Rate (≥3 Antworten)
- **Aufwand:** 1-2 Stunden
- **Testet:** A2

#### T3: Lösung-Demo
- **Was:** Baue einen klickbaren Prototyp oder Loom-Video der Lösung. Zeige es 5 Leuten.
- **Erfolg wenn:** ≥3 sagen "Das würde ich sofort ausprobieren"
- **Aufwand:** 4-6 Stunden
- **Testet:** A3

#### T4: Preis-Validierung
- **Was:** Frage direkt: "Würdest du 39-79€/Monat zahlen?" oder zeige eine Landing Page mit Pricing.
- **Erfolg wenn:** ≥2 von 5 sagen "Ja, sofort" oder tragen sich auf Warteliste ein
- **Aufwand:** 1-2 Stunden
- **Testet:** A4

#### T5: Öffentlicher Signal-Test
- **Was:** Poste einen konkreten Use-Case auf HackerNews (Show HN), Reddit, oder LinkedIn. Miss Engagement.
- **Erfolg wenn:** ≥50 Upvotes/Likes ODER ≥5 DMs/Kommentare mit "Wo kann ich das bekommen?"
- **Aufwand:** 1 Stunde + warten
- **Testet:** A1,A3

### Validierungs-Timeline

| Woche | Aktivität |
|-------|----------|
| Woche 1 | Problem-Interviews (T1) + Käufer-Erreichbarkeit (T2) |
| Woche 2 | Lösung-Demo bauen (T3) + Öffentlicher Post (T5) |
| Woche 3 | Preis-Validierung (T4) + Entscheidung: Build or Kill |

**Entscheidungs-Gate:** Nach Woche 3: Mindestens 3 von 5 Tests bestanden → Build MVP. Sonst: Pivot oder Kill.

