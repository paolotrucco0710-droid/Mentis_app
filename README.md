# Mentis

App di apprendimento attivo per studenti delle superiori.

## Milestone 8 — Session Engine

Gestisce il ciclo di vita completo di una sessione di studio.

### Flusso completo (M6–M8)

```text
POST /sessions → GET /feed/next → POST /progress/responses
              → POST /sessions/:id/pause|resume → POST /sessions/:id/end
```

### Endpoint sessione

| Metodo | URL | Descrizione |
| ------ | --- | ----------- |
| `POST` | `/api/v1/sessions` | Apre una nuova sessione |
| `GET`  | `/api/v1/sessions/[id]` | Stato e metriche della sessione |
| `POST` | `/api/v1/sessions/[id]/pause` | Mette in pausa |
| `POST` | `/api/v1/sessions/[id]/resume` | Riprende |
| `POST` | `/api/v1/sessions/[id]/end` | Chiude e registra metriche finali |

`POST /api/v1/feed/sessions` resta disponibile come alias per aprire una sessione.

### Stati sessione

- `active` — studio in corso
- `paused` — in pausa (feed e progresso bloccati)
- `ended` — chiusa con metriche finali

### Metriche calcolate

- accuracy, durata attiva (escluse le pause)
- pause count / tempo totale in pausa
- cards per minuto, focus score, fatigue score

### Script

| Comando | Descrizione |
| ------- | ----------- |
| `npm run dev` | Server di sviluppo |
| `npm run build` | Build di produzione |
| `npm run db:migrate` | Applica migrazioni DB |
| `npm run db:seed` | Crea utente e materia di test |
