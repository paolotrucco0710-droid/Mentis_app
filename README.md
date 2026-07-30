# Mentis

App di apprendimento attivo per studenti delle superiori.

## Milestone 6 — Feed Engine

Il motore cognitivo decide in tempo reale quale card mostrare allo studente.

### Pipeline decisionale

```text
Carica contesto → Calcola priorità Atom → Seleziona card → FeedItem
```

### Endpoint

| Metodo | URL | Descrizione |
| ------ | --- | ----------- |
| `POST` | `/api/v1/feed/sessions` | Avvia una sessione di studio |
| `GET`  | `/api/v1/feed/next?sessionId=...&subjectId=...` | Prossima card del feed |

### Flusso tipico

1. `POST /api/v1/feed/sessions` con `{ "subjectId": "..." }` (opzionale, default `DEV_SUBJECT_ID`)
2. `GET /api/v1/feed/next?sessionId=<id>` — ripeti per ogni card

### Variabili ambiente

| Variabile | Descrizione |
| --------- | ----------- |
| `DEV_USER_ID` | Utente dev (fino a M13 Auth) |
| `DEV_SUBJECT_ID` | Materia dev di default |
| `FEED_SESSION_TARGET_CARDS` | Numero card per sessione (default: `20`) |

### Setup database (quando deployerai)

1. Crea progetto Supabase
2. Imposta `DATABASE_URL` nelle variabili ambiente
3. `npm run db:migrate`
4. `npm run db:seed`

### Script

| Comando | Descrizione |
| ------- | ----------- |
| `npm run dev` | Server di sviluppo |
| `npm run build` | Build di produzione |
| `npm run db:migrate` | Applica migrazioni DB |
| `npm run db:seed` | Crea utente e materia di test |
