# Mentis

App di apprendimento attivo per studenti delle superiori.

## Milestone 17 — Performance Optimization

Ottimizzazioni frontend e backend per un'esperienza fluida anche con grandi quantità di contenuti.

### Ottimizzazioni

| Tecnica | Descrizione |
| ------- | ----------- |
| Query caching | Cache client-side con deduplicazione richieste per libreria, ricerca, profilo e URL immagini |
| Server cache | Cache in-memory su API libreria e ricerca con TTL configurabile |
| Code splitting | `next/dynamic` su pagine pesanti (feed, profilo, libreria, ricerca, upload, elaborazione) |
| Lazy loading card | Ogni tipo di card del feed caricato on-demand |
| Feed prefetch | Prefetch della prossima card mentre l'utente studia quella corrente |
| Virtualizzazione | Liste virtualizzate per risultati ricerca (capitoli e concetti oltre 20 elementi) |
| Memoizzazione | `React.memo` su card feed, renderer, `SubjectCard` e `ChapterRow` |
| Immagini ottimizzate | `next/image` con placeholder e supporto URL firmati (S3, locale) |

### Env performance

| Variabile | Default | Descrizione |
| --------- | ------- | ----------- |
| `QUERY_CACHE_TTL_SECONDS` | 60 | TTL cache query client (secondi) |
| `SERVER_QUERY_CACHE_TTL_SECONDS` | 30 | TTL cache server libreria/ricerca (secondi) |

### Script

| Comando | Descrizione |
| ------- | ----------- |
| `npm run dev` | Server di sviluppo |
| `npm run build` | Build di produzione |
| `npm run lint` | ESLint |
