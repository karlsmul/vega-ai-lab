# Business Recommendations — Heute

*7 von 10 Opportunities erfüllen alle Kriterien (STRONG + Part-Time Fit ≥ 4). Top 2 empfohlen.*

---

## 🥇 Empfehlung 1: AI Intake Bot

**Kategorie:** Bot Platform · **Final Score:** 2209.1

**Nische:** Agenturen

### Business Case

**Problem:** Onboarding-Prozesse und Intake-Formulare sind starr — Kunden brechen ab oder geben schlechte Daten

**Zielkunde:** Agenturen

**Lösung:** Conversational AI-Bot der Intake-Prozesse führt: Fragen stellt, validiert, nachfragt, strukturierte Daten liefert.

**Warum jetzt:** Pi.ai LLM Outperforms Palm/GPT3.5 (HackerNews AI); Show HN: AI Timeline – 171 LLMs from Transformer (2017) to GPT-5.3 (2026) (HackerNews AI); n8n-io/n8n (GitHub Trending AI)

### Revenue Reality

| | |
|---|---|
| Preisanker | 39€/Monat |
| Break-even | 1000€/Monat |
| Kunden nötig | 26 |

**Wachstums-Szenarien:**

| Szenario | Kunden | Umsatz/Monat |
|----------|--------|-------------|
| Starter | 5 | 195€ |
| Realistisch | 20 | 780€ |
| Stark | 50 | 1950€ |

26 Kunden bei 39€/Monat sind über 3-6 Monate aufbaubar. Fokus: Content-Marketing + direkter Outreach an Agenturen.

### Build Artifact

**Typ:** Bot Prototype

**Was:** Web-Chat: Conversational Intake-Flow mit Validierung, Rückfragen und JSON-Output.

### Zeitaufwand

| | |
|---|---|
| Gesamt bis MVP | 10–15 Stunden |
| Pro Woche | ~7h |
| MVP in | 2 Wochen |

**Wochenplan-Beispiel:**
- Dienstag Abend: 1.5h
- Donnerstag Abend: 1.5h
- Samstag: 3–4h

Bei ~7h pro Woche neben deinem 35h-Job ist das MVP in 2 Wochen realistisch. Jede Session ist in sich abgeschlossen — du kannst nach 1.5h aufhören und nächste Woche weitermachen. Der Schlüssel: Kleine, abgeschlossene Arbeitspakete statt langer Focus-Sessions.

### Weekend MVP Plan (19–25h gesamt)

**Woche 1: Validierung (5–7h)**
- [ ] Problem-Recherche: 3 Agenturen identifizieren und ansprechen
- [ ] Konkurrenzanalyse: Top-3 Alternativen und ihre Schwächen dokumentieren
- [ ] Definiere einen konkreten Intake-Prozess (z.B. Mandanten-Aufnahme bei Anwalt) und schreibe den Frage-Flow
- [ ] Entscheidung: Weiterbauen oder Pivot?

**Woche 2: MVP Core (8–10h)**
- [ ] Baue einen Web-Chat der den Flow conversational durchführt und JSON-Output generiert
- [ ] Füge WhatsApp/Telegram-Integration und Admin-Dashboard für Flow-Konfiguration hinzu
- [ ] Build Artifact: Bot Prototype
- [ ] Ersten Testlauf mit echten Daten

**Woche 3: Deploy + erste Nutzer (6–8h)**
- [ ] Deploy auf Hetzner/Vercel/Railway
- [ ] Einfache Landing Page oder README
- [ ] 3 Agenturen zum Testen einladen
- [ ] Feedback sammeln, kritische Bugs fixen

### Persönlicher Fit

- ✅ Perfekt für Teilzeit-Sessions
- ✅ Klarer Zielkunde identifiziert
- ✅ Starke Marktsignale
- ✅ Passt zu Fokus: Bot Platform

| | |
|---|---|
| Builder Fit | 3/5 |
| Part-Time Fit | 5/5 |
| Buyer Specificity | 4/5 |
| Markt | 4/5 |

### Risiken

- ⚠ Typeform/Tally haben KI-Features
- ⚠ Nutzer-Akzeptanz von Bot-basierten Formularen
- ⚠ Domain-spezifische Fragen brauchen Konfiguration

### Belege

- https://inflection.ai/inflection-1
- https://llm-timeline.com/
- https://github.com/n8n-io/n8n
- https://news.ycombinator.com/item?id=36865625
- https://github.com/langchain-ai/langchain

---

## 🥈 Empfehlung 2: AI Workflow Micro-SaaS

**Kategorie:** Micro SaaS · **Final Score:** 2063.8

### Nische (Pflicht!)

> ⚠ Zielkunde "Ops-Manager in 5-50 Personen Unternehmen, Freelancer mit wiederkehrenden Prozessen" ist zu generisch. Wähle eine Nische:

1. **Kleine Steuerkanzleien in Deutschland (5-15 Mitarbeiter)** ← **Empfohlen**
   Grund: Klarer Workflow, Dokumentenlast, erreichbar über Steuerberater-Verbände.

2. **Freelance-Übersetzer und Sprachdienstleister**
   Grund: Repetitive Dokument-Workflows, preissensitiv aber zahlungsbereit für Zeitersparnis.

3. **Boutique-Personalvermittler (1-5 Personen)**
   Grund: Hoher manueller Aufwand, klare Pain Points, reachable über LinkedIn.

**Empfohlene Nische:** Kleine Steuerkanzleien in Deutschland (5-15 Mitarbeiter)

### Business Case

**Problem:** KMUs verschwenden Stunden mit repetitiven Aufgaben die KI in Sekunden erledigen könnte

**Zielkunde:** Kleine Steuerkanzleien in Deutschland (5-15 Mitarbeiter)

**Lösung:** Fokussiertes Automations-Tool für eine Workflow-Nische (z.B. Invoice-Processing, Termin-Followups). Ein Workflow, perfekt gelöst.

**Warum jetzt:** n8n-io/n8n (GitHub Trending AI); Rakuten fixes issues twice as fast with Codex (OpenAI Blog); Designing AI agents to resist prompt injection (OpenAI Blog)

### Revenue Reality

| | |
|---|---|
| Preisanker | 29€/Monat |
| Break-even | 1000€/Monat |
| Kunden nötig | 35 |

**Wachstums-Szenarien:**

| Szenario | Kunden | Umsatz/Monat |
|----------|--------|-------------|
| Starter | 5 | 145€ |
| Realistisch | 20 | 580€ |
| Stark | 50 | 1450€ |

35 Kunden bei 29€/Monat erfordern systematisches Marketing. Erwäge höheren Preis oder Premium-Tier für schnelleres Break-even.

### Build Artifact

**Typ:** Working Script

**Was:** Node.js API-Endpunkt + Cron-Job der einen konkreten Workflow automatisiert (z.B. Invoice-Verarbeitung).

### Zeitaufwand

| | |
|---|---|
| Gesamt bis MVP | 10–15 Stunden |
| Pro Woche | ~7h |
| MVP in | 2 Wochen |

**Wochenplan-Beispiel:**
- Dienstag Abend: 1.5h
- Donnerstag Abend: 1.5h
- Samstag: 3–4h

Bei ~7h pro Woche neben deinem 35h-Job ist das MVP in 2 Wochen realistisch. Jede Session ist in sich abgeschlossen — du kannst nach 1.5h aufhören und nächste Woche weitermachen. Der Schlüssel: Kleine, abgeschlossene Arbeitspakete statt langer Focus-Sessions.

### Weekend MVP Plan (19–25h gesamt)

**Woche 1: Validierung (5–7h)**
- [ ] Problem-Recherche: 3 Ops-Manager in 5-50 Personen Unternehmen identifizieren und ansprechen
- [ ] Konkurrenzanalyse: Top-3 Alternativen und ihre Schwächen dokumentieren
- [ ] Identifiziere 3 spezifische Workflows die schlecht automatisiert sind (Reddit/HN/eigene Erfahrung)
- [ ] Entscheidung: Weiterbauen oder Pivot?

**Woche 2: MVP Core (8–10h)**
- [ ] Baue einen Prototyp für einen Workflow mit Node.js + Claude API und teste mit echten Daten
- [ ] Implementiere einen funktionierenden API-Endpunkt + Cron-Trigger + minimales Web-Dashboard
- [ ] Build Artifact: Working Script
- [ ] Ersten Testlauf mit echten Daten

**Woche 3: Deploy + erste Nutzer (6–8h)**
- [ ] Deploy auf Hetzner/Vercel/Railway
- [ ] Einfache Landing Page oder README
- [ ] 3 Ops-Manager in 5-50 Personen Unternehmen zum Testen einladen
- [ ] Feedback sammeln, kritische Bugs fixen

### Persönlicher Fit

- ✅ Starker Skill-Match
- ✅ Perfekt für Teilzeit-Sessions
- ✅ Klarer Zielkunde identifiziert
- ✅ Starke Marktsignale
- ✅ Passt zu Fokus: Micro SaaS

| | |
|---|---|
| Builder Fit | 5/5 |
| Part-Time Fit | 5/5 |
| Buyer Specificity | 4/5 |
| Markt | 4/5 |

### Risiken

- ⚠ Zapier/Make sind etabliert — Nische muss eng genug sein
- ⚠ Kunden erwarten sofort Ergebnisse
- ⚠ Support-Aufwand bei Edge Cases

### Belege

- https://github.com/n8n-io/n8n
- https://openai.com/index/rakuten
- https://openai.com/index/designing-agents-to-resist-prompt-injection
- https://openai.com/index/wayfair
- https://huggingface.co/blog/modular-diffusers

