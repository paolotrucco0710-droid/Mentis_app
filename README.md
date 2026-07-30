# Mentis

App di apprendimento attivo per studenti delle superiori.

## Milestone 5 — AI Processing Pipeline

Trasforma il materiale caricato in Atoms e Cards tramite pipeline AI.

### Pipeline

```text
Upload → OCR → Pulizia testo → LLM → Validazione JSON
       → Normalizzazione → Salvataggio Atoms/Cards
```

### Endpoint

| Metodo | URL                                      | Descrizione                                                 |
| ------ | ---------------------------------------- | ----------------------------------------------------------- |
| `POST` | `/api/v1/knowledge-sources/[id]/process` | Avvia elaborazione AI                                       |
| `GET`  | `/api/v1/ai-jobs/[id]`                   | Stato job AI                                                |
| `POST` | `/api/v1/upload`                         | Upload (+ elaborazione se `AUTO_PROCESS_AFTER_UPLOAD=true`) |

### Variabili ambiente (quando deployerai)

| Variabile                   | Descrizione                                           |
| --------------------------- | ----------------------------------------------------- |
| `OPENAI_API_KEY`            | Chiave API OpenAI (obbligatoria per M5)               |
| `AI_VISION_MODEL`           | Modello per OCR immagini (default: `gpt-4o-mini`)     |
| `AI_REASONING_MODEL`        | Modello per estrazione Atoms (default: `gpt-4o-mini`) |
| `AUTO_PROCESS_AFTER_UPLOAD` | `true` per elaborare subito dopo upload               |

### Setup database (quando deployerai)

1. Crea progetto Supabase
2. Imposta `DATABASE_URL` nelle variabili ambiente
3. `npm run db:migrate`
4. `npm run db:seed`

### Script

| Comando              | Descrizione                   |
| -------------------- | ----------------------------- |
| `npm run dev`        | Server di sviluppo            |
| `npm run build`      | Build di produzione           |
| `npm run db:migrate` | Applica migrazioni DB         |
| `npm run db:seed`    | Crea utente e materia di test |
