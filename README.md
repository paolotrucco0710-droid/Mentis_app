# Mentis

App di apprendimento attivo per studenti delle superiori.

## Milestone 2 — Domain Architecture

Modello dati completo del dominio Mentis: entità, enum, relazioni e vincoli.
Nessuna logica implementata — solo tipi TypeScript.

### Struttura dominio

```text
src/domain/
├── ids.ts              # ID tipizzati (branded types)
├── enums/              # Stati, tipologie, scale
├── entities/           # User, Subject, Course, Chapter, Atom, Card, …
├── knowledge/          # Schema Knowledge JSON (output LLM)
└── constraints/        # Vincoli di integrità
```

### Entità principali

| Layer         | Entità                                                       |
| ------------- | ------------------------------------------------------------ |
| Contenuto     | Subject, Course, Chapter, KnowledgeSource, Atom, Card, Image |
| Elaborazione  | Upload, AIJob                                                |
| Apprendimento | UserAtomState, UserCardState, Review, Progress               |
| Comportamento | StudySession, SessionEvent, FeedItem                         |
| Trasversali   | DailyStatistics, Achievement, Notification                   |

### Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

### Script

| Comando                | Descrizione                   |
| ---------------------- | ----------------------------- |
| `npm run dev`          | Avvia il server di sviluppo   |
| `npm run build`        | Build di produzione           |
| `npm run start`        | Avvia il server di produzione |
| `npm run lint`         | ESLint                        |
| `npm run format`       | Prettier (write)              |
| `npm run format:check` | Prettier (check)              |
