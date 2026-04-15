#!/usr/bin/env bash
# ============================================================
# Bubble Backend — Cloud Run deployment script
# ============================================================
# Prerequisites:
#   1. gcloud CLI installed and authenticated: gcloud auth login
#   2. Docker running
#   3. Neon DATABASE_URL exported: export DATABASE_URL="postgresql://..."
#   4. All secrets exported (see below)
#
# One-time setup (already done on this machine if you ran this before):
#   gcloud services enable run.googleapis.com artifactregistry.googleapis.com --project=bubble-b6e04
#   gcloud artifacts repositories create bubble-backend \
#     --repository-format=docker --location=us-central1 --project=bubble-b6e04
# ============================================================
set -euo pipefail

PROJECT="bubble-b6e04"
REGION="us-central1"
REPO="bubble-backend"
SERVICE="bubble-backend"
IMAGE="$REGION-docker.pkg.dev/$PROJECT/$REPO/api:latest"

# ---- Required env vars ---- (export these before running, or edit here)
: "${DATABASE_URL:?export DATABASE_URL=<your-neon-connection-string>}"
: "${JWT_ACCESS_SECRET:?export JWT_ACCESS_SECRET=<value>}"
: "${JWT_REFRESH_SECRET:?export JWT_REFRESH_SECRET=<value>}"
: "${ADMIN_SECRET:?export ADMIN_SECRET=<value>}"
: "${FIREBASE_SERVICE_ACCOUNT:?export FIREBASE_SERVICE_ACCOUNT=<minified-json>}"

# ---- Step 1: Auth Docker to Artifact Registry ----
echo ">>> Authenticating Docker to Artifact Registry..."
gcloud auth configure-docker "$REGION-docker.pkg.dev" --quiet --project="$PROJECT"

# ---- Step 2: Build image ----
echo ">>> Building Docker image..."
docker build -t "$IMAGE" "$(dirname "$0")"

# ---- Step 3: Push image ----
echo ">>> Pushing image to Artifact Registry..."
docker push "$IMAGE"

# ---- Step 4: Deploy to Cloud Run ----
echo ">>> Deploying to Cloud Run..."
gcloud run deploy "$SERVICE" \
  --image="$IMAGE" \
  --region="$REGION" \
  --platform=managed \
  --allow-unauthenticated \
  --port=3000 \
  --set-env-vars="DATABASE_URL=${DATABASE_URL}" \
  --set-env-vars="JWT_ACCESS_SECRET=${JWT_ACCESS_SECRET}" \
  --set-env-vars="JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}" \
  --set-env-vars="ADMIN_SECRET=${ADMIN_SECRET}" \
  --set-env-vars="FIREBASE_PROJECT_ID=bubble-b6e04" \
  --set-env-vars="FIREBASE_STORAGE_BUCKET=bubble-b6e04.firebasestorage.app" \
  --set-env-vars="FIREBASE_SERVICE_ACCOUNT=${FIREBASE_SERVICE_ACCOUNT}" \
  --set-env-vars="NODE_ENV=production" \
  --project="$PROJECT"

echo ""
echo ">>> Deployment complete! Get the service URL:"
SERVICE_URL=$(gcloud run services describe "$SERVICE" --region="$REGION" --project="$PROJECT" --format="value(status.url)")
echo "    $SERVICE_URL"
echo ""
echo ">>> Verifying /health endpoint..."
curl -sf "$SERVICE_URL/health" && echo " ✓" || echo " FAILED — check Cloud Run logs"

echo ""
echo ">>> Update frontend/.env:"
echo "    EXPO_PUBLIC_API_URL=$SERVICE_URL/api/v1"
