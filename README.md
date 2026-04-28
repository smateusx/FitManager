# FitManager

[![CI](https://github.com/smateusx/FitManager/actions/workflows/ci.yml/badge.svg)](https://github.com/smateusx/FitManager/actions/workflows/ci.yml)

SaaS voltado para academias de pequeno e médio porte, com foco no mercado brasileiro.

## Stack Técnica (estado atual)
* **Frontend:** Next.js (React) + Tailwind CSS + Shadcn/UI
* **Backend:** Node.js (Express + TypeScript)
* **Banco/Auth/Storage:** Firebase (Firestore + Firebase Auth + Firebase Storage)
* **Outros:** IA (Claude/OpenAI), Integração WhatsApp.

> Atualização: Supabase foi encerrado do projeto. O repositório está em migração de código legado para Firebase.

## Estrutura do Projeto (Monorepo)
* `/frontend`: Aplicação web Next.js para a interface.
* `/backend`: API e serviços em Node.js.
* `/supabase`: scripts SQL legados (apenas referência histórica durante a migração).

## Qualidade e CI
* Workflow: `.github/workflows/ci.yml`
* Deploy manual + smoke check: `.github/workflows/deploy-manual.yml`
* Branch protection recomendada: `docs/BRANCH_PROTECTION.md`
* Runbook pós-merge/release: `docs/POST_MERGE_RUNBOOK.md`
* Guia de deploy manual: `docs/DEPLOY_MANUAL.md`
