# Branch Protection recomendada (GitHub)

Este documento descreve a configuração recomendada para proteger a branch `main` no repositório FitManager.

## Regra de proteção para `main`

No GitHub, acesse:

- `Settings` → `Branches` → `Add branch protection rule`
- Padrão da branch: `main`

Ative as opções abaixo:

1. **Require a pull request before merging**
   - ✅ Require approvals: `1`
   - ✅ Dismiss stale pull request approvals when new commits are pushed
   - ✅ Require review from code owners *(se vocês forem usar CODEOWNERS)*

2. **Require status checks to pass before merging**
   - ✅ Require branches to be up to date before merging
   - Status checks obrigatórios:
     - `Frontend (lint + build)`
     - `Backend (check)`

3. **Require conversation resolution before merging**
   - ✅ Habilitado

4. **Restrict who can push to matching branches**
   - ✅ Recomendado habilitar (somente mantenedores)

5. **Do not allow bypassing the above settings**
   - ✅ Recomendado para ambientes de produção

6. **Allow force pushes / Allow deletions**
   - ❌ Desabilitado

## Observações

- O workflow de CI está em `.github/workflows/ci.yml`.
- Se o nome de algum check mudar no workflow, atualize também os checks obrigatórios na proteção da branch.
