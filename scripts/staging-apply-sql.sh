#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SUPABASE_DB_URL="${SUPABASE_DB_URL:-}"
APPLY="${APPLY:-false}"
INCLUDE_LEGACY_REGISTROS="${INCLUDE_LEGACY_REGISTROS:-false}"

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  echo "Uso:"
  echo "  ./scripts/staging-apply-sql.sh                               # dry-run"
  echo "  APPLY=true SUPABASE_DB_URL=... ./scripts/staging-apply-sql.sh # aplica SQL"
  echo ""
  echo "Opções extras:"
  echo "  INCLUDE_LEGACY_REGISTROS=true  # inclui supabase/registros_carga.sql (legado)"
  exit 0
fi

SQL_FILES=(
  "supabase/schema.sql"
  "supabase/fichas_treino.sql"
  "supabase/planos_matriculas.sql"
  "supabase/update_perfis_avatar.sql"
  "supabase/update_rls.sql"
  "supabase/fix_rls.sql"
  "supabase/fix_aluno_rls.sql"
  "supabase/rbac_policies.sql"
  "supabase/vencimentos_proximos.sql"
  "supabase/evolucao_carga.sql"
)

if [[ "$INCLUDE_LEGACY_REGISTROS" == "true" ]]; then
  SQL_FILES+=("supabase/registros_carga.sql")
fi

echo "== FitManager SQL Deploy Order (staging) =="
for file in "${SQL_FILES[@]}"; do
  if [[ ! -f "$ROOT_DIR/$file" ]]; then
    echo "ERRO: arquivo SQL ausente -> $file"
    exit 1
  fi
  echo " - $file"
done

if [[ "$APPLY" != "true" ]]; then
  echo ""
  echo "Dry-run concluído."
  echo "Para aplicar de verdade:"
  echo "  APPLY=true SUPABASE_DB_URL=... ./scripts/staging-apply-sql.sh"
  exit 0
fi

if [[ -z "$SUPABASE_DB_URL" ]]; then
  echo "ERRO: defina SUPABASE_DB_URL para aplicar SQL no staging."
  exit 1
fi

for file in "${SQL_FILES[@]}"; do
  echo ""
  echo "Aplicando $file ..."
  psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -1 -f "$ROOT_DIR/$file"
done

echo ""
echo "Migrações SQL aplicadas com sucesso no staging."
