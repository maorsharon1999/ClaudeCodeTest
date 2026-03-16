# Bubble — Cloud Deployment Guide

Branch: `feature/firebase-migration`
**Do not merge to main without explicit approval.**

---

## Prerequisites

- Google Cloud project created (separate projects for dev and prod)
- Firebase project linked to the GCP project
- `gcloud` CLI installed and authenticated
- `firebase` CLI installed

---

## Phase 1 — Firebase Auth

### 1. Enable Firebase Phone Authentication
Firebase Console → Authentication → Sign-in method → Phone → Enable

### 2. Create a service account key
Firebase Console → Project Settings → Service Accounts → Generate new private key
Save the JSON file **outside the repo**. Never commit it.

### 3. Set env vars
```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT=/absolute/path/to/key.json
# OR pass as JSON string:
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

### 4. Frontend — add Firebase web config
Firebase Console → Project Settings → Your apps → Web → SDK setup
Set in `frontend/.env`:
```
EXPO_PUBLIC_FIREBASE_API_KEY=AIza...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
```

### 5. Verify
```bash
# Start backend with Firebase vars set
cd backend && node src/index.js

# Obtain a Firebase ID token (use Firebase Auth Emulator or real phone)
curl -X POST http://localhost:3000/api/v1/auth/firebase/verify \
  -H 'Content-Type: application/json' \
  -d '{"id_token": "<firebase-id-token>"}'
# Expected: { access_token, refresh_token, user_id, profile_complete }
```

---

## Phase 2 — Cloud SQL

### 1. Create a Cloud SQL PostgreSQL instance
```bash
gcloud sql instances create bubble-dev \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region=us-central1
```

### 2. Create the database and user
```bash
gcloud sql databases create bubble_db --instance=bubble-dev
gcloud sql users create bubble_app --instance=bubble-dev --password=<password>
```

### 3. Run migrations
```bash
DATABASE_URL="postgresql://bubble_app:<password>@<cloud-sql-ip>/bubble_db" \
  node backend/src/db/migrate.js
```

### 4. Update env var
```
DATABASE_URL=postgresql://bubble_app:<password>@<cloud-sql-ip>/bubble_db
# Redis is no longer needed — leave REDIS_URL blank
```

---

## Phase 3 — Firebase Storage

### 1. Enable Firebase Storage
Firebase Console → Storage → Get started → Set rules to:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Backend writes only — no direct client uploads
    match /{allPaths=**} {
      allow read: if true;   // public read (profile photos)
      allow write: if false; // backend only via Admin SDK
    }
  }
}
```

### 2. Set env var
```
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
```

---

## Phase 4 — Cloud Run deployment

### 1. Build and push the Docker image
```bash
cd backend
gcloud builds submit --tag gcr.io/<project-id>/bubble-backend
```

### 2. Deploy to Cloud Run
```bash
gcloud run deploy bubble-backend \
  --image gcr.io/<project-id>/bubble-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000 \
  --set-env-vars NODE_ENV=production \
  --set-env-vars FIREBASE_PROJECT_ID=<project-id> \
  --set-env-vars FIREBASE_STORAGE_BUCKET=<project>.appspot.com
```

### 3. Use Secret Manager for sensitive vars
```bash
# Create secrets
echo -n "<value>" | gcloud secrets create JWT_ACCESS_SECRET --data-file=-
echo -n "<value>" | gcloud secrets create JWT_REFRESH_SECRET --data-file=-
echo -n "<value>" | gcloud secrets create PHONE_HMAC_SECRET --data-file=-
echo -n "<value>" | gcloud secrets create ADMIN_SECRET --data-file=-
echo -n "<value>" | gcloud secrets create DATABASE_URL --data-file=-

# Grant Cloud Run service account access
gcloud secrets add-iam-policy-binding JWT_ACCESS_SECRET \
  --member=serviceAccount:<run-service-account>@developer.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor
# (repeat for each secret)

# Reference secrets in Cloud Run deploy command:
# --set-secrets JWT_ACCESS_SECRET=JWT_ACCESS_SECRET:latest
```

### 4. Update frontend API URL
```
# frontend/.env (or set in EAS build secrets)
EXPO_PUBLIC_API_URL=https://<cloud-run-url>/api/v1
```

### 5. Verify
```bash
curl https://<cloud-run-url>/health
# Expected: {"status":"ok"}
```

---

## Phase 5 — Environment separation

- Use separate Firebase projects for `dev` and `prod`
- Use separate Cloud SQL instances
- Use separate GCP projects (recommended) or at minimum separate service accounts
- Never share secrets across environments

---

## Required env vars summary

| Var | Required | Notes |
|-----|----------|-------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Yes | 32+ byte random hex |
| `JWT_REFRESH_SECRET` | Yes | 32+ byte random hex |
| `PHONE_HMAC_SECRET` | Yes | 32+ byte random hex |
| `ADMIN_SECRET` | Yes | Internal API secret |
| `STORAGE_BASE_URL` | Yes | Backend public URL (for local storage URLs) |
| `FIREBASE_PROJECT_ID` | Phase 1+ | Firebase project ID |
| `FIREBASE_SERVICE_ACCOUNT` | Phase 1+ | Service account JSON or path |
| `FIREBASE_STORAGE_BUCKET` | Phase 3+ | GCS bucket name |
| `REDIS_URL` | No | Retired in Phase 2 |
| `PORT` | No | Default 3000 |
