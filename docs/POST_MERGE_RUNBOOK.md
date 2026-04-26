# Runbook pós-merge (main)

Checklist operacional para executar após merge de PRs importantes no FitManager.

## 1) Confirmar estado da `main`

No GitHub:

- PR mergeada com checks verdes
- Nenhum check obrigatório em falha

No ambiente local:

```bash
git checkout main
git pull origin main
```

## 2) Validar qualidade do frontend

```bash
cd frontend
npm ci
npm run lint
npm run build
```

Esperado: lint sem erros e build concluído com sucesso.

## 3) Validar qualidade do backend

```bash
cd backend
npm ci
npm run check
```

Esperado: `lint`, `test`, `typecheck` e `build` passando.

## 4) Smoke test rápido da API (backend)

```bash
cd backend
npm run start
```

Em outro terminal:

```bash
curl http://127.0.0.1:3001/health
```

Esperado:

```json
{"status":"ok","message":"FitManager API is running"}
```

Depois, encerrar o processo do servidor.

## 5) Configuração de proteção de branch

Confirmar se a branch `main` está com regras ativas conforme:

- `docs/BRANCH_PROTECTION.md`

Pontos críticos:

- PR obrigatória para merge
- checks obrigatórios:
  - `Frontend (lint + build)`
  - `Backend (check)`
- force push e delete desabilitados

## 6) Publicação (quando aplicável)

Se houver deploy automático:

- verificar último deploy no provedor
- validar app em produção (`/health` backend e carregamento frontend)

Se deploy for manual:

- disparar pipeline de deploy
- documentar versão/release no changelog interno

## 7) Rollback (procedimento mínimo)

Se houver regressão:

1. Identificar commit problemático.
2. Abrir PR de reversão (`git revert <sha>`).
3. Aguardar checks verdes.
4. Merge da reversão na `main`.

## Observação

Este runbook é intencionalmente curto para reduzir tempo de resposta operacional.
