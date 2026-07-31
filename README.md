# Mentis

App di apprendimento attivo per studenti delle superiori.

## Milestone 18 — Analytics

Sistema di analytics osservazionale: ogni azione significativa è misurabile senza influenzare il motore cognitivo.

### Comprende

| Area | Descrizione |
| ---- | ----------- |
| Eventi | Log append-only `analytics_events` con categorie auth, upload, AI, studio, apprendimento, feature, funnel, errori |
| Funnel | Onboarding da registrazione a prima elaborazione AI |
| Errori | Tracciamento errori API e pipeline |
| Tempo studio | Aggregati da `daily_statistics` e sessioni |
| Utilizzo AI | Job, token, costi e cache hit rate |
| Metriche apprendimento | Mastery, accuratezza, review, sessioni completate |

### API

- `POST /api/v1/analytics/events` — ingest eventi client (es. page view)
- `GET /api/v1/analytics/summary?view=overview` — panoramica
- `GET /api/v1/analytics/summary?view=funnel` — funnel onboarding
- `GET /api/v1/analytics/summary?view=learning` — metriche apprendimento
- `GET /api/v1/analytics/summary?view=study-time` — tempo di studio
- `GET /api/v1/analytics/summary?view=ai-usage` — utilizzo AI
- `GET /api/v1/analytics/summary?view=errors` — errori recenti
- `GET /api/v1/analytics/summary?view=features&days=30` — utilizzo funzionalità

### UI

- Pagina `/analytics` con dashboard completa
- Tracker automatico page view nel layout principale

### Script

| Comando | Descrizione |
| ------- | ----------- |
| `npm run dev` | Server di sviluppo |
| `npm run build` | Build di produzione |
| `npm run db:migrate` | Applica migration (include `analytics_events`) |
