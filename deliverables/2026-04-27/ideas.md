# Projekt-Ideen — 2026-04-27

*7 konkrete Build-Ideen, optimiert für Solo-Builder. Fokus: Micro SaaS, Automation, Bots. Jede ist auf 2-4 Wochen MVP ausgelegt.*

### Niche Workflow SaaS

**Kategorie:** Micro SaaS · *(18 passende Signale heute)*

**Pitch:** Ein Micro-SaaS das genau einen Business-Workflow mit KI automatisiert — kein generischer Builder.

**Zielkunde:** Ops-Manager in KMUs, Freelancer mit wiederkehrenden Prozessen

**Was es tut:** Wähle einen konkreten Workflow (z.B. Invoice-Processing, Termin-Followups, Angebotsversand) und automatisiere ihn end-to-end. Kein Zapier-Klon — ein Workflow, sofort einsatzbereit.

**Tech Stack:** Node.js, Express, Claude/GPT API, Cron, Hetzner VPS

**Build Plan:**
- Tag 1-3: Workflow analysieren + Kernlogik + API-Endpunkte
- Tag 4-7: Web-UI + Trigger-System + Monitoring
- Tag 8-10: Onboarding-Flow + Stripe + Launch

**Monetarisierung:** €29/Monat pro Workflow-Instanz. €99/Mo für Custom-Konfiguration.

**MVP Scope:** Ein Workflow, ein Trigger, ein Output-Format, Web-Dashboard

**Anti-Scope:** Kein Workflow-Builder, keine Custom-Logik-UI, keine Mobile App, max 1 Integration

**Differenzierung:** Kein generischer Automations-Builder. Ein Workflow, perfekt gelöst, Setup in 5 Minuten.

---

### Vertikaler AI-Agent

**Kategorie:** Automation System · *(17 passende Signale heute)*

**Pitch:** Ein spezialisierter KI-Agent der einen kompletten Branchenprozess end-to-end automatisiert.

**Zielkunde:** Ops-Manager in KMUs, Agenturen, Support-Leads

**Was es tut:** Wähle eine Branche (Support, HR, Legal, Sales) und baue einen Agenten der 5-10 Schritte eines häufigen Prozesses autonom erledigt. Z.B.: Support-Ticket → Kategorisierung → Antwort-Draft → Eskalation.

**Tech Stack:** Node.js, Claude API (tool_use), Express, PostgreSQL

**Build Plan:**
- Tag 1-3: Branche wählen + Prozess-Mapping + Agent-Logik
- Tag 4-7: Tool-Definitionen + Review-UI + Error-Handling
- Tag 8-14: Dashboard + Stripe + Launch

**Monetarisierung:** €49-149/Mo je nach Volumen. ROI klar messbar.

**MVP Scope:** Ein Prozess, 5 Schritte, Review-UI, Email-Notification

**Anti-Scope:** Kein Agent-Builder, keine Custom-Tools, keine Multi-Branche

**Differenzierung:** Kein generischer Agent-Builder. Ein Prozess, eine Branche, sofort produktiv.

---

### AI Weekly Report Generator

**Kategorie:** Automation System · *(15 passende Signale heute)*

**Pitch:** Verbinde Datenquellen, bekomme wöchentlich KI-Insights-Reports — automatisch per Email.

**Zielkunde:** Marketing-Manager, Ops-Leads in KMUs, SaaS-Gründer

**Was es tut:** Automatisierte Report-Pipeline: Stripe/GA/eigene API anbinden → KI analysiert Trends → wöchentlicher Insights-Report per Email/Slack. Kein Dashboard-Bauen, kein SQL.

**Tech Stack:** Node.js, Stripe/GA APIs, Claude API, Express, Cron

**Build Plan:**
- Tag 1-3: API-Connectors + Daten-Extraktion + Report-Template
- Tag 4-7: KI-Insight-Engine + Email/Slack-Delivery
- Tag 8-14: Web-Config + Stripe + Launch

**Monetarisierung:** €29/Mo für 3 Quellen, €79/Mo für 10+ Quellen.

**MVP Scope:** Ein Daten-Connector, wöchentlicher Report, Email-Delivery

**Anti-Scope:** Kein Live-Dashboard, kein SQL-Editor, keine Custom-Visualisierungen

**Differenzierung:** Insights statt Zahlen. Automatisch, keine manuelle Report-Erstellung.

---

### Document Q&A SaaS

**Kategorie:** Micro SaaS · *(12 passende Signale heute)*

**Pitch:** Dokumente hochladen, Fragen stellen, Antworten mit Quellenangaben bekommen.

**Zielkunde:** Legal-Teams, Compliance-Abteilungen, Consulting-Firmen

**Was es tut:** Fokussiertes RAG-Tool für eine Dokumenten-Nische. Z.B.: Vertragsprüfung, Compliance-Checks, internes Wiki-Q&A. Upload → Frage → Antwort mit Seitenangabe.

**Tech Stack:** Node.js, Claude/OpenAI Embeddings, SQLite + Vektoren, Express, Hetzner

**Build Plan:**
- Tag 1-3: Document Ingestion + RAG-Pipeline + Chat-API
- Tag 4-7: Web-UI + Quellen-Links + Multi-Doc
- Tag 8-14: Auth + Stripe + Admin + Launch

**Monetarisierung:** €39/Mo für 100 Dokumente, €99/Mo unlimited.

**MVP Scope:** PDF-Upload, Chat-Interface, Quellenangaben, ein Nutzer-Typ

**Anti-Scope:** Kein Notion/Confluence-Connector, kein Team-Management, kein eigenes Embedding-Modell

**Differenzierung:** Setup in 5 Minuten. Fokus auf eine Nische statt generischer Chatbot-Builder.

---

### AI Intake Bot

**Kategorie:** Bot Platform · *(12 passende Signale heute)*

**Pitch:** Conversational Bot der Onboarding-Prozesse intelligent führt und strukturierte Daten liefert.

**Zielkunde:** Agenturen, Kanzleien, Berater mit Kunden-Onboarding

**Was es tut:** Statt starrer Formulare: ein Bot der Fragen stellt, nachfragt, validiert und strukturierte Daten liefert. Für Mandantenaufnahme, Projekt-Briefs, Versicherungsanfragen.

**Tech Stack:** Node.js, Claude API, Express, WhatsApp/Telegram SDK

**Build Plan:**
- Tag 1-3: Conversational Engine + Flow-Definition + JSON-Output
- Tag 4-7: WhatsApp/Web-Widget + Admin-Dashboard
- Tag 8-14: Flow-Builder + Stripe + Launch

**Monetarisierung:** €29/Mo pro Bot-Instanz. €79/Mo mit Custom Branding.

**MVP Scope:** Ein Intake-Flow, Web-Chat, JSON-Export, Admin-View

**Anti-Scope:** Kein Formular-Builder, kein CRM-Connector, keine Analyse

**Differenzierung:** Conversational statt starr. Bot fragt nach, validiert, liefert saubere Daten.

---

### AI Dev CLI Tool

**Kategorie:** Micro SaaS · *(10 passende Signale heute)*

**Pitch:** Ein CLI-Tool das einen nervigen Developer-Workflow mit KI löst — npm install und los.

**Zielkunde:** Solo-Entwickler, kleine Dev-Teams, DevOps-Engineers

**Was es tut:** Fokussiert auf einen Workflow: Changelog-Gen, PR-Review, Error-Triage, API-Doc-Gen, oder Commit-Messages. npm-Paket, Config-File, Freemium-Modell.

**Tech Stack:** Node.js, Commander.js, Claude API, npm Registry

**Build Plan:**
- Tag 1-3: CLI-Gerüst + KI-Integration + Kernfeature
- Tag 4-7: Config, .rc-Datei, Edge Cases, Tests
- Tag 8-10: npm publish + Stripe + Show HN

**Monetarisierung:** 10 Aufrufe/Tag frei, €9/Mo unlimited. Teams: €29/Mo.

**MVP Scope:** Ein Feature, CLI-Interface, npm-Paket, Config-File

**Anti-Scope:** Keine GUI, keine IDE-Extension, keine Team-Features, max 1 LLM-Provider

**Differenzierung:** Ein Workflow, perfekt gelöst. Läuft im Terminal, keine Web-App nötig.

---

### AI Outreach Personalizer

**Kategorie:** Micro SaaS · *(4 passende Signale heute)*

**Pitch:** CSV mit Leads rein, personalisierte Emails raus — basierend auf echtem Research.

**Zielkunde:** SDRs, Freelancer, kleine Sales-Teams

**Was es tut:** Tool das LinkedIn/Website eines Leads crawlt, relevante Talking Points findet und personalisierte Email-Drafts generiert. Nicht "Hi {name}" — echte Anknüpfungspunkte.

**Tech Stack:** Node.js, Cheerio, Claude API, Express, CSV-Parser

**Build Plan:**
- Tag 1-3: Lead-Research-Pipeline + Email-Generierung
- Tag 4-7: Web-UI + Batch-Processing + Ton-Presets
- Tag 8-10: Stripe + Export + Launch

**Monetarisierung:** €29/Mo für 200 Leads, €79/Mo für 1000 Leads.

**MVP Scope:** CSV-Import, Web-Scraping, personalisierte Drafts, CSV-Export

**Anti-Scope:** Kein CRM, kein Email-Versand, kein Tracking, keine Sequenzen

**Differenzierung:** Tiefes Research pro Lead statt oberflächliches Merge-Tagging.

---

