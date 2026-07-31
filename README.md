# Mentis

App di apprendimento attivo per studenti delle superiori.

## Milestone 19 — Testing

Suite di test automatici per engine, AI pipeline, database, scheduler, integrazione, regressione ed end-to-end.

### Suite

| Tipo | Path | Descrizione |
| ---- | ---- | ----------- |
| Unit | `tests/unit/` | Engine, mastery, AI optimization, review priority |
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
