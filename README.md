# Mentis

App di apprendimento attivo per studenti delle superiori.

**Versione MVP: 1.0.0**

## Milestone 21 — MVP Release

L'MVP implementa il ciclo fondamentale:

```text
Upload → Elaborazione AI → Costruzione conoscenza → Studio → Valutazione → Progresso → Revisione
```

### Criteri di completamento

| Criterio | Stato |
| -------- | ----- |
| Registrazione e autenticazione | Implementato |
| Creazione materia e capitolo | Implementato |
| Upload immagini/PDF | Implementato |
| Pipeline AI → atomi e card MVP | Implementato (7 tipologie feed) |
| Feed Engine personalizzato | Implementato |
| Sessione di studio completabile | Implementato |
| Progress Engine (mastery) | Implementato |
| Review Engine (revisioni) | Implementato |
| Persistenza DB + storage | Implementato |
| Test automatici | `npm run test:all` |

### Verifica MVP

```bash
npm run db:migrate
npm run db:seed
npm run test:all
```

- **Acceptance test:** `tests/acceptance/m21-mvp-cycle.test.ts` (richiede `DATABASE_URL`)
- **E2E studio:** `e2e/mvp-cycle.spec.ts` (usa seed demo + `AUTH_DEV_FALLBACK`)
- **Checklist release:** `docs/M21_RELEASE_CHECKLIST.md`
- **Changelog:** `CHANGELOG.md`

### Card generate dalla pipeline AI

Learn, Quiz, Blurting, Feynman, Vero/Falso, Trova l'errore, Immagine (se presente un'immagine nel capitolo).

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

## Test da telefono (Milestone 0)

Per vedere le immagini nel feed da smartphone sulla stessa rete Wi‑Fi del PC:

1. Trova l'IPv4 del PC (`ipconfig` su Windows → scheda Wi‑Fi).
2. Nel file `.env` (non `.env.example`):

   ```env
   NEXT_PUBLIC_APP_URL=http://192.168.1.5:3000
   OPENAI_HTTP_REFERER=http://192.168.1.5:3000
   ```

   Sostituisci `192.168.1.5` con il tuo IP reale.

3. Avvia il server in ascolto su tutte le interfacce:

   ```bash
   npm run dev:mobile
   ```

4. Sul telefono apri `http://<IP-PC>:3000` (stessa Wi‑Fi).
5. **Carica un capitolo nuovo** (i capitoli vecchi possono non avere card/immagini aggiornate).
6. Dopo l'elaborazione, avvia lo studio: le card Explain e Immagine devono mostrare la foto del libro.

Se l'immagine non compare, apri gli strumenti di rete del browser sul telefono (o prova l'URL immagine sul PC): l'host deve essere l'IP del PC, **mai** `localhost`.

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
