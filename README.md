# Mentis

App di apprendimento attivo per studenti delle superiori.

## Milestone 16 — AI Cost Optimization

Pipeline AI ottimizzata economicamente: caching, deduplicazione, retry, batching, rate limiting e monitoraggio costi.

### Ottimizzazioni

| Tecnica | Descrizione |
| ------- | ----------- |
| Caching | Risultati OCR ed estrazione LLM salvati in `ai_result_cache` |
| Deduplicazione | Stesso `fileHash` riusa cache estrazione; rilevamento materiali già elaborati |
| Retry | Retry automatico con backoff su errori transienti (429, 5xx) |
| Batching | OCR pagine in parallelo controllato (`AI_OCR_BATCH_SIZE`) |
| Rate limiting | Limite richieste concorrenti e delay minimo tra chiamate OpenAI |
| Monitoraggio costi | Token, costo stimato e cache hit/miss per ogni job |

### API utilizzate

- `GET /api/v1/ai/costs` — riepilogo costi utente
- `GET /api/v1/ai/costs?view=jobs` — ultimi job con metriche
- `GET /api/v1/ai-jobs/[id]` — include `inputTokens`, `estimatedCostUsd`, `cacheHits`

### Env AI optimization

| Variabile | Default | Descrizione |
| --------- | ------- | ----------- |
| `AI_MAX_CONCURRENT_REQUESTS` | 3 | Richieste OpenAI concorrenti max |
| `AI_MIN_REQUEST_DELAY_MS` | 200 | Delay minimo tra richieste |
| `AI_RETRY_MAX_ATTEMPTS` | 3 | Tentativi retry su errori transienti |
| `AI_CACHE_TTL_DAYS` | 30 | TTL cache risultati AI |
| `AI_OCR_BATCH_SIZE` | 3 | Pagine OCR elaborate in parallelo |
| `AI_COST_INPUT_PER_MILLION` | 0.15 | Costo stimato input (USD/1M token) |
| `AI_COST_OUTPUT_PER_MILLION` | 0.60 | Costo stimato output (USD/1M token) |

### Script

| Comando | Descrizione |
| ------- | ----------- |
| `npm run dev` | Server di sviluppo |
| `npm run build` | Build di produzione |
| `npm run db:migrate` | Applica migration (include `ai_result_cache`) |
