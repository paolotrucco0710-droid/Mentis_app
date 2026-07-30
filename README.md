<<<<<<< HEAD
# Mentis_app
=======
# Mentis

App di apprendimento attivo per studenti delle superiori.

## Milestone 1 — Project Foundation

Base tecnica del progetto: Next.js, TypeScript, Tailwind, ESLint, Prettier.

### Struttura

```text
src/
├── app/           # Next.js App Router
├── assets/        # Asset statici dell'app
├── components/    # Componenti UI
│   ├── layout/
│   └── ui/
├── engine/        # Cognitive Engine
├── ai/            # Pipeline AI
├── db/            # Database layer
├── hooks/         # React hooks
└── lib/           # Utility condivise
```

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
>>>>>>> 4ce4c5e (feat: Milestone 1 — Project Foundation)
