# Mentis

App di apprendimento attivo per studenti delle superiori.

## Milestone 13 — Authentication

Sistema utenti completo: registrazione, login, reset password e gestione sessioni.

### Flusso auth

```text
/signup o /login → cookie httpOnly → accesso alle pagine protette
/forgot-password → /reset-password?token=... → nuova password
/settings → sessioni attive → revoca dispositivi
```

### Pagine

| Route | Descrizione |
| ----- | ----------- |
| `/login` | Accesso con email e password |
| `/signup` | Registrazione nuovo account |
| `/forgot-password` | Richiesta link reset password |
| `/reset-password` | Impostazione nuova password |
| `/settings` | Account e sessioni attive |

### API utilizzate

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `GET /api/v1/auth/sessions`
- `DELETE /api/v1/auth/sessions/[id]`

### Env auth

| Variabile | Descrizione |
| --------- | ----------- |
| `AUTH_JWT_SECRET` | Segreto per firmare i JWT (obbligatorio in produzione) |
| `AUTH_ACCESS_TOKEN_TTL_MINUTES` | Durata access token (default: 15) |
| `AUTH_REFRESH_TOKEN_TTL_DAYS` | Durata refresh token (default: 30) |
| `AUTH_PASSWORD_RESET_TTL_MINUTES` | Validità link reset (default: 60) |
| `AUTH_DEV_FALLBACK` | Se `true`, consente accesso senza login usando `DEV_USER_ID` |

In sviluppo, senza configurare auth, imposta `AUTH_DEV_FALLBACK=true` e `DEV_USER_ID` per mantenere il workflow locale precedente.

### Script

| Comando | Descrizione |
| ------- | ----------- |
| `npm run dev` | Server di sviluppo |
| `npm run build` | Build di produzione |
| `npm run db:migrate` | Applica migration Prisma |
| `npm run db:seed` | Seed database dev |
