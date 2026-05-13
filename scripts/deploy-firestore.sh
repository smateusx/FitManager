#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
ENV_FILE="$ROOT/.env.firebase.local"
if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi
: "${FIREBASE_TOKEN:?Defina FIREBASE_TOKEN}"
: "${FIREBASE_PROJECT_ID:?Defina FIREBASE_PROJECT_ID}"
exec npx --yes firebase-tools@latest deploy \
  --only firestore,storage \
  --project "$FIREBASE_PROJECT_ID" \
  --token "$FIREBASE_TOKEN" \
  --non-interactive
