# Mentis

App di apprendimento attivo per studenti delle superiori.

## Milestone 9 — Review Engine

Gestisce scheduling, coda, overdue e priorità delle revisioni.

### Endpoint

| Metodo | URL | Descrizione |
| ------ | --- | ----------- |
| `GET` | `/api/v1/reviews/queue?subjectId=...` | Coda revisioni (due, overdue, upcoming) |
| `GET` | `/api/v1/reviews/daily?subjectId=...` | Piano revisione giornaliero |
| `POST` | `/api/v1/reviews/sync` | Sincronizza revisioni da UserAtomState |
| `POST` | `/api/v1/reviews/[id]/complete` | Completa una revisione |

### Body `POST /reviews/[id]/complete`

```json
{ "outcome": "success" }
```

`outcome`: `success` | `partial` | `failure`

### Integrazione

- Il **Progress Engine** (M7) programma automaticamente la prossima revisione dopo ogni risposta
- Il **Feed Engine** (M6) usa `nextReviewAt` e priorità per proporre atom in ripasso

### Script

| Comando | Descrizione |
| ------- | ----------- |
| `npm run dev` | Server di sviluppo |
| `npm run build` | Build di produzione |
| `npm run db:migrate` | Applica migrazioni DB |
| `npm run db:seed` | Crea utente e materia di test |
