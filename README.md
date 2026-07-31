# Mentis

App di apprendimento attivo per studenti delle superiori.

## Milestone 15 — Cloud Storage

Storage remoto per PDF, immagini e avatar. In produzione nessun file resta sul filesystem locale dell'app.

### Provider supportati

| Provider | Env | Uso |
| -------- | --- | --- |
| `local` | `STORAGE_PROVIDER=local` | Sviluppo locale (`UPLOAD_STORAGE_PATH`) |
| `s3` | `STORAGE_PROVIDER=s3` | AWS S3, Cloudflare R2, MinIO |

### Flusso storage

```text
Upload → StorageProvider.save() → storageKey nel DB
Accesso file → URL firmata temporanea (S3 presigned o token locale)
Eliminazione materiale → delete oggetti storage + soft delete DB
```

### API utilizzate

- `GET /api/v1/images/[id]/url` — URL firmata per immagine di un capitolo
- `GET /api/v1/profile/avatar` — URL firmata avatar utente
- `POST /api/v1/profile/avatar` — upload avatar
- `GET /api/v1/storage/access` — accesso locale firmato (solo `STORAGE_PROVIDER=local`)

### Env storage

| Variabile | Descrizione |
| --------- | ----------- |
| `STORAGE_PROVIDER` | `local` o `s3` (in produzione usare `s3`) |
| `STORAGE_BUCKET` | Nome bucket S3 |
| `STORAGE_REGION` | Regione AWS (default: `eu-west-1`) |
| `STORAGE_ENDPOINT` | Endpoint custom per R2/MinIO |
| `AWS_ACCESS_KEY_ID` | Credenziali (opzionale con IAM role) |
| `AWS_SECRET_ACCESS_KEY` | Credenziali (opzionale con IAM role) |
| `STORAGE_SIGNED_URL_TTL_SECONDS` | Durata URL firmate (default: 3600) |
| `STORAGE_FORCE_PATH_STYLE` | `true` per MinIO |
| `STORAGE_SIGNING_SECRET` | Firma accesso locale (default: `AUTH_JWT_SECRET`) |

### Backup

Il backup dei file è a livello infrastruttura:

- Abilitare **versioning** sul bucket S3
- Eseguire backup PostgreSQL (metadata `storageKey` nelle tabelle `Image` e `User`)
- Generare manifest oggetti: `npm run storage:manifest`

### Migrazione locale → S3

```bash
STORAGE_PROVIDER=s3 STORAGE_BUCKET=... AWS_ACCESS_KEY_ID=... AWS_SECRET_ACCESS_KEY=... npm run storage:migrate-to-s3
```

### Script

| Comando | Descrizione |
| ------- | ----------- |
| `npm run dev` | Server di sviluppo |
| `npm run build` | Build di produzione |
| `npm run storage:manifest` | Esporta manifest oggetti storage dal DB |
| `npm run storage:migrate-to-s3` | Carica file locali esistenti su S3 |
