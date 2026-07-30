# Mentis

App di apprendimento attivo per studenti delle superiori.

## Milestone 7 — Progress Engine

Ogni risposta dello studente aggiorna mastery, statistiche e progresso.

### Flusso completo (M6 + M7)

```text
POST /feed/sessions → GET /feed/next → POST /progress/responses → GET /feed/next
```

### Endpoint

| Metodo | URL | Descrizione |
| ------ | --- | ----------- |
| `POST` | `/api/v1/progress/responses` | Registra risposta e aggiorna progresso |
| `GET`  | `/api/v1/progress?scopeType=subject&scopeId=...` | Progresso aggregato |

### Body `POST /progress/responses`

```json
{
  "sessionId": "...",
  "cardId": "...",
  "atomId": "...",
  "outcome": "success",
  "isCorrect": true,
  "responseTimeMs": 3200,
  "durationMs": 15000
}
```

`outcome`: `success` | `failure` | `skipped` | `neutral`

### Cosa viene aggiornato

- **UserAtomState** — mastery, comprensione, streak, decay, stage, prossimo ripasso
- **UserCardState** — evidenze per card
- **SessionEvent** — cronologia interazione
- **StudySession** — contatori sessione
- **DailyStatistics** — tempo studio, accuracy, streak giornaliero
- **Unlock** — atom dipendenti sbloccati quando i prerequisiti sono soddisfatti

### Script

| Comando | Descrizione |
| ------- | ----------- |
| `npm run dev` | Server di sviluppo |
| `npm run build` | Build di produzione |
| `npm run db:migrate` | Applica migrazioni DB |
| `npm run db:seed` | Crea utente e materia di test |
