# Mentis

App di apprendimento attivo per studenti delle superiori.

## Milestone 4 — Upload Pipeline

API per caricare capitoli (foto multipagina o PDF): validazione, compressione immagini, salvataggio file e registrazione nel database.

### Endpoint

| Metodo | URL                   | Descrizione        |
| ------ | --------------------- | ------------------ |
| `POST` | `/api/v1/upload`      | Carica un capitolo |
| `GET`  | `/api/v1/upload/[id]` | Stato upload       |

### Formato richiesta (POST)

`multipart/form-data`:

| Campo       | Obbligatorio | Descrizione                        |
| ----------- | ------------ | ---------------------------------- |
| `files`     | Sì           | Una o più foto, oppure un solo PDF |
| `subjectId` | Sì           | ID materia (da seed)               |
| `title`     | No           | Titolo capitolo                    |
| `courseId`  | No           | ID corso                           |
| `language`  | No           | Default `it`                       |

### Setup (quando avrai database + deploy)

Questi passi servono **quando** collegherai Supabase e pubblicherai l'app. Con solo Agent + merge su GitHub non devi farli subito.

1. Crea progetto su [supabase.com](https://supabase.com)
2. Copia `DATABASE_URL` in `.env.local` (su Vercel → Environment Variables)
3. Applica migrazioni: `npm run db:migrate`
4. Crea utente dev: `npm run db:seed`
5. Aggiungi `DEV_USER_ID` e `DEV_SUBJECT_ID` nelle variabili ambiente

### Script

| Comando              | Descrizione                   |
| -------------------- | ----------------------------- |
| `npm run dev`        | Server di sviluppo            |
| `npm run build`      | Build di produzione           |
| `npm run db:migrate` | Applica migrazioni DB         |
| `npm run db:seed`    | Crea utente e materia di test |
