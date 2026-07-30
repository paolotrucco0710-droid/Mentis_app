# Mentis

App di apprendimento attivo per studenti delle superiori.

## Milestone 11 — Feed UI

L'utente può studiare tramite il feed interattivo collegato al backend.

### Flusso studio

```text
/feed → crea sessione → mostra card → invia risposta → prossima card
```

### Card supportate

| Tipo | Componente |
| ---- | ---------- |
| Explain | Learn Card |
| ImageExplain | Image Card |
| Quiz | Quiz Card |
| TrueFalse | Vero/Falso |
| Blurting | Blurting Card |
| Feynman | Feynman Card |
| ErrorDetection | Trova l'errore |

### API utilizzate

- `POST /api/v1/sessions`
- `GET /api/v1/feed/next`
- `POST /api/v1/progress/responses`
- `POST /api/v1/sessions/[id]/pause|end`

### Env frontend

`NEXT_PUBLIC_DEV_SUBJECT_ID` — materia usata dal feed (default: seed dev)

### Script

| Comando | Descrizione |
| ------- | ----------- |
| `npm run dev` | Server di sviluppo |
| `npm run build` | Build di produzione |
