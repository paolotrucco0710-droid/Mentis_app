# Mentis

App di apprendimento attivo per studenti delle superiori.

## Milestone 20 — Production Hardening

Infrastruttura operativa per utenti reali: logging strutturato, gestione errori centralizzata, sicurezza HTTP, rate limiting, health checks, backup/recovery e deploy con migrazioni automatiche.

### Componenti

| Area | Implementazione |
| ---- | --------------- |
| Logging | `src/lib/logger` — log JSON strutturati con `requestId`, route e codice errore |
| Error handling | `src/lib/api/handle-route-error.ts` — handler unificato + `trackApiError` |
| Sicurezza | Header CSP/HSTS/X-Frame-Options in middleware (`src/lib/security/headers.ts`) |
| Rate limiting | Policy per auth/upload/API in middleware (`src/lib/rate-limit/`) |
| Monitoring | `GET /api/health` (liveness), `GET /api/ready` (readiness DB + env) |
| Env validation | `src/lib/env.schema.ts` + `src/instrumentation.ts` (fail-fast in produzione) |
| Backup | `npm run backup:db`, `backup:storage`, `backup:verify` |
| Deploy | `Dockerfile`, `docker-compose.prod.yml`, `npm run start:production` |

### Comandi operativi

| Comando | Descrizione |
| ------- | ----------- |
| `npm run start:production` | `prisma migrate deploy` + `next start` |
| `npm run backup:db` | Dump PostgreSQL (`pg_dump`) in `backups/db/` |
| `npm run backup:storage` | Manifest + sync S3 (se `STORAGE_PROVIDER=s3`) |
| `npm run backup:verify` | Verifica dump DB e manifest storage |

### Health checks

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/ready
```

`/api/ready` risponde `503` se il database o la configurazione produzione non sono validi.

### Deploy Docker

```bash
docker compose -f docker-compose.prod.yml up --build
```

Il container applicativo esegue `prisma migrate deploy` all'avvio prima di servire il traffico.

### Requisiti produzione

- `DATABASE_URL` configurato
- `AUTH_JWT_SECRET` casuale (≥ 32 caratteri)
- `AUTH_DEV_FALLBACK=false`
- `STORAGE_PROVIDER=s3` con `STORAGE_BUCKET` valorizzato

## Milestone 19 — Testing

Suite di test automatici per engine, AI pipeline, database, scheduler, integrazione, regressione ed end-to-end.

### Suite

| Tipo | Path | Descrizione |
| ---- | ---- | ----------- |
| Unit | `tests/unit/` | Engine, mastery, AI optimization, review priority, production hardening |
| Integration | `tests/integration/` | Repository analytics (DB) e API summary |
| Regression | `tests/regression/` | Comportamenti cognitivi e AI invarianti |
| E2E | `e2e/` | Smoke test Playwright su login/signup/redirect |

### Comandi

| Comando | Descrizione |
| ------- | ----------- |
| `npm run test` | Esegue tutti i test Vitest |
| `npm run test:watch` | Vitest in modalità watch |
| `npm run test:coverage` | Coverage report |
| `npm run test:e2e` | Playwright end-to-end |
| `npm run test:all` | Unit + E2E |

### CI

GitHub Actions (`.github/workflows/test.yml`):

- Vitest con Postgres di servizio + migrate/seed
- Lint + build
- Playwright smoke tests

### Env test (opzionale locale)

Per i test di integrazione database, imposta `DATABASE_URL` e applica migrate/seed:

```bash
npm run db:migrate
npm run db:seed
npm run test
```
