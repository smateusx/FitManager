# FitManager - Smoke Tests (Staging)

Execute os testes com 3 contas de staging:
- `admin@staging...`
- `recepcao@staging...`
- `aluno@staging...`

## A) Auth e roteamento por role

1. Login como ADMIN
   - Esperado: acesso ao `/dashboard`.
2. Login como RECEPCIONISTA
   - Esperado: acesso ao `/dashboard`, com restrições financeiras.
3. Login como ALUNO
   - Esperado: redirecionamento para `/meu-treino`.

## B) Convite e cadastro de aluno

1. No ADMIN, ir em `/alunos`.
2. Abrir modal de convite e copiar link `/register/aluno?academia_id=...`.
3. Em aba anônima, finalizar cadastro de aluno.
   - Esperado: cadastro concluído sem erro.
4. Voltar ao ADMIN e confirmar aluno na listagem.

## C) Treinos

1. ADMIN cria ficha em `/treinos` para aluno de staging.
2. Verificar ficha em `/alunos/[id]` aba Treinos.
3. Login como ALUNO e validar exibição da ficha em `/meu-treino`.
4. ALUNO registra carga.
   - Esperado: sem erro no insert e gráfico de evolução renderizando.

## D) Planos, matrículas e cobranças

1. ADMIN cria plano em `/planos`.
2. ADMIN cria matrícula para aluno.
3. Verificar status e vencimento na tabela de matrículas.
4. Ir em `/cobrancas` e validar itens da view `vencimentos_proximos`.
5. Testar botão "Cobrar" (WhatsApp link abre corretamente).

## E) Perfil e avatar

1. ADMIN atualiza telefone e avatar em `/perfil`.
2. ALUNO atualiza perfil em `/meu-perfil`.
3. Confirmar avatar no header e navegação lateral.

## F) Regressão visual e permissões

1. RECEPCIONISTA não deve:
   - criar/deletar fichas (apenas visualizar),
   - acessar relatórios financeiros completos.
2. ALUNO não deve acessar rotas administrativas.

## Critério de aprovação

- Nenhum erro 500 em console/network.
- Nenhuma violação de permissão (RLS/RBAC).
- Fluxos críticos (cadastro, matrícula, treino, evolução, cobrança) funcionando ponta a ponta.
