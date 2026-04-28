# Deploy manual com smoke check

Este guia descreve como usar o workflow manual:

- `.github/workflows/deploy-manual.yml`

## Objetivo

Executar deploy sob demanda com:

1. **Quality gate obrigatório**
   - Frontend: `lint` + `build`
   - Backend: `check` (`lint` + `test` + `typecheck` + `build`)
2. **Deploy por provedor** (Vercel/Render) ou por comando customizado
3. **Smoke checks pós-deploy**
   - Backend (`/health`) obrigatório
   - Frontend (URL) opcional

## Como executar

No GitHub:

- `Actions` → `Deploy (manual)` → `Run workflow`

Preencha os inputs:

- `environment`: `staging` ou `production`
- `provider`:
  - `none` (não faz deploy, apenas smoke checks)
  - `vercel`
  - `render`
- `deploy_command` (opcional):
  - Se informado, tem prioridade sobre `provider`
  - Exemplo: `npm run deploy:staging`
  - Exemplo: `npm run deploy:prod`
- `backend_health_url` (obrigatório):
  - Exemplo: `https://api.seu-dominio.com/health`
- `frontend_url` (opcional):
  - Exemplo: `https://app.seu-dominio.com`
- `timeout_seconds` (opcional, padrão `30`)

## Fluxo de execução

1. Job **Quality gate**
2. Job **Deploy and smoke check**
   - roda `deploy_command` se informado
   - senão, executa deploy pelo `provider` selecionado
   - valida JSON do backend (`status === "ok"`)
   - valida resposta HTTP da URL do frontend (se informada)

## Secrets necessários por provedor

### Vercel

Configure nos **Environment secrets** (`staging`/`production`):

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Comportamento no workflow:

- `staging`: `vercel pull --environment=preview` + `vercel deploy`
- `production`: `vercel pull --environment=production` + `vercel deploy --prod`

### Render

Configure:

- `RENDER_API_KEY`
- `RENDER_SERVICE_ID`

Comportamento:

- chama o endpoint da API do Render para criar deploy e aguarda até status `live`.

## Recomendação de segurança

- Configure **Environment protection rules** no GitHub:
  - `staging`: opcionalmente sem aprovação
  - `production`: exigir aprovação antes de executar
- Use secrets dos environments para comandos reais de deploy.

## Observações

- Se `provider=none` e `deploy_command` vazio, o workflow roda apenas smoke checks.
- Mantenha `backend_health_url` sempre apontando para o endpoint público de saúde.
