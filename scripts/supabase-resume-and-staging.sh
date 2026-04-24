#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_REF="${PROJECT_REF:-}"
SUPABASE_ACCESS_TOKEN="${SUPABASE_ACCESS_TOKEN:-}"
APPLY_SQL="${APPLY_SQL:-false}"
POLL_INTERVAL_SECONDS="${POLL_INTERVAL_SECONDS:-15}"
POLL_ATTEMPTS="${POLL_ATTEMPTS:-40}"

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  echo "Uso:"
  echo "  PROJECT_REF=aszpzytdodqgfzqlbmvx SUPABASE_ACCESS_TOKEN=sbp_... \\"
  echo "    ./scripts/supabase-resume-and-staging.sh"
  echo ""
  echo "Opcional:"
  echo "  APPLY_SQL=true SUPABASE_DB_URL=postgresql://... \\"
  echo "    PROJECT_REF=... SUPABASE_ACCESS_TOKEN=... ./scripts/supabase-resume-and-staging.sh"
  echo ""
  echo "Obs:"
  echo "  - Este script usa a Management API para restaurar projeto pausado."
  echo "  - Se o projeto já estiver ativo, segue para as validações de staging."
  exit 0
fi

if [[ -z "$PROJECT_REF" ]]; then
  echo "ERRO: defina PROJECT_REF (ex: aszpzytdodqgfzqlbmvx)."
  exit 1
fi

if [[ -z "$SUPABASE_ACCESS_TOKEN" ]]; then
  echo "ERRO: defina SUPABASE_ACCESS_TOKEN (token de gerenciamento Supabase, prefixo sbp_)."
  exit 1
fi

resume_project() {
  local response
  local body
  local status_code

  response="$(curl -sS -w $'\n%{http_code}' -X POST "https://api.supabase.com/v1/projects/${PROJECT_REF}/restore" \
    -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
    -H "Content-Type: application/json")"
  body="$(echo "$response" | sed '$d')"
  status_code="$(echo "$response" | tail -n1)"

  echo "Restore HTTP status: ${status_code}"
  if [[ -n "$body" ]]; then
    echo "Restore response: $body"
  fi

  if [[ "$status_code" =~ ^2[0-9][0-9]$ ]]; then
    return 0
  fi

  if echo "$body" | rg -qi "no longer in a paused state|PAUSING|ACTIVE"; then
    echo "INFO: projeto já está em transição/ativo. Continuando..."
    return 0
  fi

  echo "ERRO: falha ao solicitar restore via Management API."
  return 1
}

poll_project_status() {
  local attempt=1
  local response
  local body
  local status_code
  local project_status

  while (( attempt <= POLL_ATTEMPTS )); do
    response="$(curl -sS -w $'\n%{http_code}' "https://api.supabase.com/v1/projects/${PROJECT_REF}" \
      -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}")"
    body="$(echo "$response" | sed '$d')"
    status_code="$(echo "$response" | tail -n1)"

    if [[ ! "$status_code" =~ ^2[0-9][0-9]$ ]]; then
      echo "Tentativa ${attempt}/${POLL_ATTEMPTS}: status HTTP ${status_code} ao consultar projeto."
      sleep "$POLL_INTERVAL_SECONDS"
      ((attempt++))
      continue
    fi

    project_status="$(echo "$body" | jq -r '.status // "UNKNOWN"')"
    echo "Tentativa ${attempt}/${POLL_ATTEMPTS}: project.status=${project_status}"

    if [[ "$project_status" == "ACTIVE_HEALTHY" || "$project_status" == "ACTIVE" ]]; then
      return 0
    fi

    sleep "$POLL_INTERVAL_SECONDS"
    ((attempt++))
  done

  echo "ERRO: timeout aguardando projeto ficar ACTIVE/ACTIVE_HEALTHY."
  return 1
}

ensure_runtime_env() {
  if [[ -z "${SUPABASE_URL:-}" ]]; then
    export SUPABASE_URL="https://${PROJECT_REF}.supabase.co"
  fi
  if [[ -z "${NEXT_PUBLIC_SUPABASE_URL:-}" ]]; then
    export NEXT_PUBLIC_SUPABASE_URL="${SUPABASE_URL}"
  fi
  if [[ -z "${SUPABASE_ANON_KEY:-}" && -n "${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}" ]]; then
    export SUPABASE_ANON_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY}"
  fi
  if [[ -z "${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}" && -n "${SUPABASE_ANON_KEY:-}" ]]; then
    export NEXT_PUBLIC_SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY}"
  fi
}

echo "== FitManager Supabase Resume + Staging =="
echo "Projeto: ${PROJECT_REF}"

echo "[1/5] Solicitando restore do projeto (se pausado)..."
resume_project

echo "[2/5] Aguardando projeto ficar ativo..."
poll_project_status

echo "[3/5] Verificando DNS do endpoint do projeto..."
if getent hosts "${PROJECT_REF}.supabase.co" >/dev/null 2>&1; then
  echo "DNS OK para ${PROJECT_REF}.supabase.co"
else
  echo "AVISO: DNS ainda não resolveu ${PROJECT_REF}.supabase.co"
fi

echo "[4/5] Rodando preflight de staging..."
ensure_runtime_env
bash "${ROOT_DIR}/scripts/staging-preflight.sh"

echo "[5/5] SQL rollout..."
if [[ "$APPLY_SQL" == "true" ]]; then
  APPLY=true bash "${ROOT_DIR}/scripts/staging-apply-sql.sh"
else
  echo "APPLY_SQL=false (dry-run apenas)."
  bash "${ROOT_DIR}/scripts/staging-apply-sql.sh"
fi

echo "Fluxo concluído."
