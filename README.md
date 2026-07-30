# Mentis

App di apprendimento attivo per studenti delle superiori.

## Milestone 10 — Frontend Foundation

Interfaccia completa con layout, navigazione, design system e pagine base.

### Pagine

| Route | Descrizione |
| ----- | ----------- |
| `/home` | Dashboard — "Cosa devi fare adesso?" |
| `/feed` | Layout studio full-screen (card in M11) |
| `/upload` | Caricamento materiale |
| `/processing` | Stato pipeline AI |
| `/review` | Ripassi programmati |
| `/profile` | Profilo e statistiche |
| `/settings` | Impostazioni |
| `/login`, `/signup`, `/onboarding` | Auth layout |

### Design System (`src/components/ui/`)

Button, Card, Input, TextArea, Badge, Avatar, ProgressBar, Skeleton, Loader, EmptyState e icone condivise.

### Layout (`src/components/layout/`)

- **AppShell** — top bar + bottom navigation (Home layout)
- **AuthLayout** — login/signup centrati
- **FeedLayout** — full-screen senza distrazioni

### Bottom Navigation

Home · Studio · Upload · Ripasso · Profilo

### Script

| Comando | Descrizione |
| ------- | ----------- |
| `npm run dev` | Server di sviluppo |
| `npm run build` | Build di produzione |
