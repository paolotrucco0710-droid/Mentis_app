# Mentis

App di apprendimento attivo per studenti delle superiori.

## Milestone 3 — Database Layer

PostgreSQL + Prisma: schema, migrazioni, indici, relazioni e query principali.

### Struttura database

```text
prisma/
├── schema.prisma          # Schema completo (21 tabelle)
└── migrations/            # Migrazioni SQL

src/db/
├── client.ts              # Prisma client singleton
├── mappers/               # Prisma → tipi dominio
└── repositories/          # Query principali
```

### Setup database locale

```bash
# 1. Avvia PostgreSQL
docker compose up -d

# 2. Configura env
cp .env.example .env.local

# 3. Applica migrazioni
npm run db:migrate

# 4. Avvia l'app
npm run dev
```

### Script database

| Comando                  | Descrizione                            |
| ------------------------ | -------------------------------------- |
| `npm run db:generate`    | Genera Prisma Client                   |
| `npm run db:migrate`     | Applica migrazioni (produzione/locale) |
| `npm run db:migrate:dev` | Crea e applica nuove migrazioni        |
| `npm run db:studio`      | Apri Prisma Studio (GUI)               |

### Script generali

| Comando          | Descrizione         |
| ---------------- | ------------------- |
| `npm run dev`    | Server di sviluppo  |
| `npm run build`  | Build di produzione |
| `npm run lint`   | ESLint              |
| `npm run format` | Prettier            |
