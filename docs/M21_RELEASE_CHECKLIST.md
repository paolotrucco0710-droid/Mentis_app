# Milestone 21 — MVP Release Checklist

Use this checklist before tagging `v1.0.0`.

## Ciclo fondamentale

- [ ] Registrazione e login funzionano (`/signup`, `/login`)
- [ ] Creazione materia e capitolo (`/library`, upload)
- [ ] Upload immagini o PDF completato con successo
- [ ] Pipeline AI genera atomi e tutte le card del feed MVP
- [ ] Feed Engine propone una sequenza di studio personalizzata (`/feed`)
- [ ] Sessione di studio completabile con le tipologie card supportate
- [ ] Progress Engine aggiorna mastery dopo le risposte
- [ ] Review Engine pianifica revisioni future (`/review`)
- [ ] Dati persistiti su database e storage configurato

## Test automatici

- [ ] `npm run test` — unit, integration e acceptance MVP green
- [ ] `npm run test:e2e` — smoke + ciclo MVP green
- [ ] `npm run lint` — senza errori
- [ ] `npm run build` — build di produzione ok

## Produzione

- [ ] `GET /api/health` risponde `200`
- [ ] `GET /api/ready` risponde `200` con database connesso
- [ ] `AUTH_DEV_FALLBACK=false`
- [ ] `AUTH_JWT_SECRET` casuale (≥ 32 caratteri)
- [ ] `STORAGE_PROVIDER=s3` con bucket configurato
- [ ] `npm run start:production` applica `prisma migrate deploy`
- [ ] `npm run backup:db` e `npm run backup:verify` eseguiti almeno una volta

## Release

- [ ] Versione `1.0.0` in `package.json`
- [ ] `CHANGELOG.md` aggiornato
- [ ] Tag git `v1.0.0` creato dopo merge su `main`
