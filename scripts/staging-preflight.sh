#!/usr/bin/env bash

set -euo pipefail

echo "== FitManager Staging Preflight =="

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

check_file_exists() {
  local path="$1"
  if [[ ! -f "$path" ]]; then
    echo "ERRO: arquivo ausente -> $path"
    exit 1
  fi
}

check_env_var() {
  local var_name="$1"
  if [[ -z "${!var_name:-}" ]]; then
    echo "ERRO: variável de ambiente ausente -> $var_name"
    exit 1
  fi
}

echo "[1/6] Validando arquivos essenciais..."
check_file_exists "$ROOT_DIR/frontend/.env.example"
check_file_exists "$ROOT_DIR/backend/.env.example"
check_file_exists "$ROOT_DIR/supabase/schema.sql"
check_file_exists "$ROOT_DIR/supabase/evolucao_carga.sql"
check_file_exists "$ROOT_DIR/supabase/rbac_policies.sql"

echo "[2/6] Validando variáveis de ambiente do staging..."
check_env_var "NEXT_PUBLIC_SUPABASE_URL"
check_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY"
check_env_var "SUPABASE_URL"
check_env_var "SUPABASE_ANON_KEY"

echo "[3/6] Frontend lint..."
(
  cd "$ROOT_DIR/frontend"
  npm run lint
)

echo "[4/6] Frontend build..."
(
  cd "$ROOT_DIR/frontend"
  npm run build
)

echo "[5/7] Backend typecheck..."
(
  cd "$ROOT_DIR/backend"
  node ./node_modules/typescript/lib/tsc.js --noEmit
)

echo "[6/7] SQL staging script dry-run..."
(
  cd "$ROOT_DIR"
  bash "./scripts/staging-apply-sql.sh" --dry-run
)

echo "[7/7] Dependency audit (runtime)..."
(
  cd "$ROOT_DIR/frontend"
  if ! npm audit --omit=dev; then
    echo "AVISO: frontend audit retornou vulnerabilidades (ver saída acima)."
  fi
)
(
  cd "$ROOT_DIR/backend"
  npm audit --omit=dev
)

echo "Preflight concluído com sucesso."
