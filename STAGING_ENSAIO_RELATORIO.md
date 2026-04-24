# FitManager - Relatorio de Ensaio de Staging

Data de execucao: 2026-04-24
Branch: `cursor/fitmanager-hardening-a822`

## 1) Resultado do preflight automatizado

Comando executado:

```bash
set -a && source /workspace/backend/.env && set +a && \
export NEXT_PUBLIC_SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-$SUPABASE_URL}" \
       NEXT_PUBLIC_SUPABASE_ANON_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY:-$SUPABASE_ANON_KEY}" && \
bash /workspace/scripts/staging-preflight.sh
```

Status: **PASSOU**

Validacoes aprovadas:
- arquivos essenciais presentes
- variaveis de ambiente criticas carregadas
- frontend lint/build OK
- backend typecheck OK
- script SQL em dry-run OK
- backend runtime audit OK

Observacao de seguranca:
- frontend runtime audit continua com 1 vulnerabilidade high em `xlsx` (sem fix upstream).

## 2) Aplicacao real de SQL em staging

Verificacao:

```bash
SUPABASE_DB_URL=missing
```

Status: **BLOQUEADO**

Motivo:
- variavel `SUPABASE_DB_URL` nao esta configurada no ambiente atual.
- sem essa URL, o script `scripts/staging-apply-sql.sh` nao pode executar `APPLY=true`.

## 3) Smoke tecnico de rotas (HTTP)

Comando executado (app em dev no localhost:3000):

```bash
for p in / /login /dashboard /alunos /treinos /planos /cobrancas /meu-treino /meu-perfil; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$p")
  echo "$p -> $code"
done
```

Resultado:
- todas as rotas retornaram HTTP 200

## 4) Pendencias para concluir o ensaio funcional completo

1. Definir `SUPABASE_DB_URL` (staging) para aplicar migracoes SQL reais.
2. Executar smoke funcional com contas reais de staging:
   - `admin@staging...`
   - `recepcao@staging...`
   - `aluno@staging...`
3. Marcar checklist de `scripts/staging-smoke-tests.md` com evidencias.

## 5) Proxima acao recomendada

Assim que `SUPABASE_DB_URL` estiver disponivel:

```bash
APPLY=true SUPABASE_DB_URL="postgresql://..." ./scripts/staging-apply-sql.sh
```

Depois, executar o checklist funcional:

```bash
cat scripts/staging-smoke-tests.md
```
