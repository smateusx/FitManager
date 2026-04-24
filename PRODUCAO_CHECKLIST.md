# FitManager - Checklist de Producao

## 1) Aplicacao Frontend (Next.js)

- [x] `npm run lint` sem erros bloqueantes
- [x] `npm run build` sem falhas
- [x] Dark mode fixo em `html.dark`
- [x] Renderizacao de imagens migrada para `next/image` nas superfices principais de avatar
- [x] Tratamento de ausencia de env do Supabase sem quebrar build
- [ ] Padrão unico de notificacao (toasts) em vez de `alert()` nas telas
- [ ] Suite de testes automatizados (unit/integration/e2e)

## 2) Backend (Node/Express)

- [x] Healthcheck `/health`
- [x] CORS parametrizado por env (`CORS_ORIGIN`)
- [x] Hardening basico de headers (`x-powered-by` desabilitado)
- [x] Logs de request HTTP
- [x] Falha explicita se env critica do Supabase nao estiver configurada
- [ ] Limite de taxa (`rate limit`)
- [ ] Validacao de payload para rotas futuras (ex: zod/joi)
- [ ] Observabilidade estruturada (logger centralizado + traces)

## 3) Banco / Supabase / Seguranca

- [x] RLS ativa nas tabelas centrais
- [x] Politicas RBAC para ADMIN/RECEPCIONISTA/ALUNO presentes em scripts
- [x] Trigger de criacao de perfil em `auth.users`
- [x] View `vencimentos_proximos` criada
- [ ] Consolidar migracoes SQL em ordem unica (evitar duplicidade entre scripts antigos e novos)
- [ ] Revisao final de politicas para tabelas novas/renomeadas (`evolucao_carga` vs `registros_carga`)
- [ ] Validar bucket `avatars` e politicas do Storage no ambiente real

## 4) Dependencias e vulnerabilidades

- [x] Frontend atualizado para `next@16.2.4` e `eslint-config-next@16.2.4`
- [x] Backend sem vulnerabilidades reportadas por `npm audit --omit=dev`
- [ ] Frontend possui 1 vulnerabilidade **high** em `xlsx` sem fix upstream
  - Mitigacao recomendada: restringir origem/formato de dados importados e avaliar migracao para biblioteca alternativa quando viavel.

## 5) Ambiente e operacao

- [x] `.env.example` no frontend
- [x] `.env.example` no backend
- [ ] Segredos reais armazenados apenas no provedor (Vercel/Cloud/CI), nunca no repo
- [ ] Configurar monitoramento de erro (ex: Sentry) frontend + backend
- [ ] Configurar backup/restores e politicas de retencao no Supabase
- [ ] Definir runbook de incidentes (acesso, rollback, contato)

## 6) Go-live recomendado (ordem)

1. Aplicar migracoes SQL finais em staging e validar fluxo completo.
2. Validar cadastro/login, convite de aluno, treinos, planos, cobrancas e perfil.
3. Rodar lint/build e smoke test em staging.
4. Configurar monitoramento e alertas.
5. Liberar producao com rollback pronto.
