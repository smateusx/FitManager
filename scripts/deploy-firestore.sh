#!/usr/bin/env bash
# Deploy das regras/índices Firestore usando token CI (sem firebase login interativo).
#
# Na sua máquina (uma vez): npx firebase-tools login:ci
# Depois: copie scripts/firebase-env.example para .env.firebase.local e preencha,
# ou exporte FIREBASE_TOKEN e FIREBASE_PROJECT_ID no shell.
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
  echo "Erro: FIREBASE_TOKEN não definido." >&2
  echo "  Gere com: npx firebase-tools login:ci" >&2
  echo "  Ou crie .env.firebase.local (veja scripts/firebase-env.example)." >&2
  exit 1
fi

if [[ -z "${FIREBASE_PROJECT_ID:-}" ]]; then
  echo "Erro: FIREBASE_PROJECT_ID não definido (ID do projeto na consola Firebase)." >&2
  exit 1
fi

exec npx --yes firebase-tools@latest deploy \
  --only firestore \
  --project "$FIREBASE_PROJECT_ID" \
  --token "$FIREBASE_TOKEN" \
  --non-interactive
