# Changelog

## 1.0.0 — 2026-07-31

### MVP Release (Milestone 21)

Prima release pubblica dell'MVP Mentis: ciclo completo da upload a revisione programmata.

- Acceptance test end-to-end del ciclo fondamentale (auth → upload → AI → studio → progresso → review)
- Generazione automatica di tutte le card del feed MVP (Learn, Quiz, Blurting, Feynman, Vero/Falso, Trova l'errore, Immagine)
- Seed demo con capitolo studiabile per sviluppo e test E2E
- Playwright E2E per il flusso di studio autenticato
- Checklist di release in `docs/M21_RELEASE_CHECKLIST.md`
- Versione prodotto portata a `1.0.0`

### Production Hardening (Milestone 20)

- Logging strutturato, gestione errori centralizzata, security headers
- Rate limiting HTTP, health/readiness endpoints
- Validazione env produzione, backup/recovery, deploy Docker

### Testing (Milestone 19)

- Suite Vitest (engine, AI, progress, review)
- Playwright smoke tests e CI GitHub Actions
