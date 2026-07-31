# Mentis

App di apprendimento attivo per studenti delle superiori.

## Milestone 14 — User Profile

Profilo utente completo: dati personali, preferenze, statistiche e impostazioni.

### Flusso profilo

```text
/profile → statistiche e riepilogo studio
/settings → modifica account, preferenze, obiettivi, password
/onboarding → salva obiettivi iniziali → /upload
```

### Pagine

| Route | Descrizione |
| ----- | ----------- |
| `/profile` | Header, streak, mastery, statistiche e grafico 7 giorni |
| `/settings` | Account, preferenze, scuola, obiettivi, password, sessioni |
| `/onboarding` | Selezione obiettivi iniziali (persistiti) |

### API utilizzate

- `GET /api/v1/profile`
- `PATCH /api/v1/profile`
- `DELETE /api/v1/profile`
- `GET /api/v1/profile/statistics`
- `GET /api/v1/profile/statistics/daily?days=7`
- `PATCH /api/v1/profile/password`

### Statistiche esposte

- Studio oggi (tempo, card, accuratezza)
- Streak corrente
- Mastery media e salute memoria
- Totali lifetime (tempo, card, atomi, sessioni)
- Attività recente e grafico ultimi 7 giorni

### Script

| Comando | Descrizione |
| ------- | ----------- |
| `npm run dev` | Server di sviluppo |
| `npm run build` | Build di produzione |
| `npm run db:migrate` | Applica migration Prisma |
