#!/usr/bin/env bash
# Deploy Firestore (regras + índices) com token CI.
# Ver scripts/firebase-env.example
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

if [[ -z "${FIREBASE_TOKEN:-}" ]]; then
  echo "Erro: FIREBASE_TOKEN não definido. Use: npx firebase-tools login:ci" >&2
  echo "  Ou crie .env.firebase.local (scripts/firebase-env.example)." >&2
  exit 1
fi

if [[ -z "${FIREBASE_PROJECT_ID:-}" ]]; then
  echo "Erro: FIREBASE_PROJECT_ID não definido." >&2
  exit 1
fi

exec npx --yes firebase-tools@latest deploy \
  --only firestore \
  --project "$FIREBASE_PROJECT_ID" \
  --token "$FIREBASE_TOKEN" \
  --non-interactive
