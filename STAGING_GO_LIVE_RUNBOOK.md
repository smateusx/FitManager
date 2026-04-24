# FitManager - Runbook de Go-Live em Staging

Este documento define a ordem operacional para preparar e validar o staging antes do deploy em producao.

## 0) Pre-requisitos

- A branch atual deve estar sincronizada com o remote.
- Ambiente com Node/NPM instalado.
- Credenciais de staging do Supabase disponiveis.
- Acesso ao SQL Editor do Supabase (ou psql) do projeto de staging.

## 1) Passo a passo resumido

1. Executar preflight de codigo e ambiente.
2. Aplicar SQLs em staging na ordem recomendada.
3. Validar smoke tests funcionais por modulo.
4. Registrar evidencias e aprovar para deploy.
5. Caso falhe, executar rollback operacional.

---

## 2) Preflight local

No root do repo:

```bash
chmod +x scripts/staging-preflight.sh scripts/staging-apply-sql.sh
./scripts/staging-preflight.sh
```

O preflight valida:
- arquivos essenciais
- env vars minimas
- lint/build do frontend
- typecheck do backend
- audit runtime frontend/backend

---

## 3) Ordem de aplicacao SQL em staging

> Use o script de apoio para imprimir a ordem:

```bash
./scripts/staging-apply-sql.sh
```

### Ordem recomendada (idempotente onde possivel)

1. `supabase/schema.sql`  
   Base inicial (academias, perfis, trigger inicial)
2. `supabase/fichas_treino.sql`  
   Fichas/exercicios
3. `supabase/planos_matriculas.sql`  
   Planos/matriculas
4. `supabase/update_perfis_avatar.sql`  
   Coluna avatar
5. `supabase/update_rls.sql`  
   Ajustes iniciais de RLS
6. `supabase/fix_rls.sql`  
   Ajustes academia SELECT
7. `supabase/fix_aluno_rls.sql`  
   Fix de cadastro/edicao do proprio perfil
8. `supabase/rbac_policies.sql`  
   RBAC consolidado ADMIN/RECEPCIONISTA/ALUNO
9. `supabase/vencimentos_proximos.sql`  
   View para cobrancas
10. `supabase/evolucao_carga.sql`  
   Tabela/politicas atuais de evolucao de carga (alinhada com frontend)

### Observacao importante

- O repositorio contem legado de `registros_carga.sql` (modelo antigo por `exercicio_id`).
- O frontend atual usa `evolucao_carga` (modelo por `exercicio_nome`).
- **Nao executar `registros_carga.sql` em ambientes novos**.
- Em staging legado, manter somente o objeto usado pelo app atual.

---

## 4) Smoke tests de staging (funcional)

Use o checklist detalhado em:

- `scripts/staging-smoke-tests.md`

Resumo minimo:
- auth e redirecionamentos por role
- dashboard/admin
- alunos (convite + detalhe)
- treinos
- planos/matriculas
- cobrancas
- portal do aluno (treino + evolucao + perfil/avatar)

---

## 5) Critérios de aprovacao para producao

- Preflight verde (sem erros bloqueantes).
- SQL aplicado sem erros.
- Smoke tests core aprovados.
- Sem regressao de autorizacao (RLS/RBAC).
- Evidencias registradas (prints/logs/checklist marcado).

---

## 6) Rollback operacional

### 6.1 Rollback de aplicacao (frontend/backend)

1. Reverter para commit/tag estavel anterior.
2. Rebuild/deploy no ambiente staging.
3. Reexecutar smoke tests basicos de autenticação e navegação.

### 6.2 Rollback de banco (Supabase)

Como boa pratica, use snapshot/backup antes de migracoes.

1. Criar snapshot antes de aplicar SQLs.
2. Se migracao quebrar:
   - restaurar snapshot completo, ou
   - aplicar script reverso especifico (quando existir), ou
   - dropar apenas objetos novos da migracao recente e reaplicar estado estavel.

### 6.3 Rollback tatico de `evolucao_carga`

Se houver incidente isolado na evolucao:

```sql
-- somente se necessario e com impacto avaliado
DROP VIEW IF EXISTS public.vw_evolucao_carga;
DROP TABLE IF EXISTS public.evolucao_carga;
```

Depois, restaurar snapshot ou reaplicar migracao estavel.

---

## 7) Evidencias e handoff

Ao fim da execucao em staging, registrar:

- commit/hash implantado
- horario da execucao
- SQLs aplicados
- resultado do preflight
- resultado dos smoke tests (pass/fail por item)
- decisao final: aprovado para producao / bloqueado

