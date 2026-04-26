# Migração Supabase -> Firebase

Este documento registra o estado de transição do FitManager após a decisão de
encerrar o uso de Supabase.

## Estado atual

- O projeto ainda contém chamadas ao cliente Supabase no frontend.
- O backend não utiliza Supabase em runtime e a dependência foi removida.
- Foi adicionada a base de Firebase no frontend em `src/lib/firebase.ts`.

## O que já foi feito nesta etapa

1. Remoção de `@supabase/supabase-js` do backend.
2. Remoção do arquivo ocioso `backend/src/supabase.ts`.
3. Instalação de `firebase` no frontend.
4. Criação do cliente Firebase com:
   - Auth (`getFirebaseAuth`)
   - Firestore (`getFirebaseDb`)
   - Storage (`getFirebaseStorage`)
5. Inclusão de `frontend/.env.example` com variáveis de configuração Firebase.

## Próxima etapa recomendada (incremental)

Migrar por domínio de funcionalidade, na ordem:

1. **Auth e sessão**
   - `src/hooks/use-auth.ts`
   - `src/app/login/page.tsx`
   - `src/app/register/page.tsx`
   - `src/app/register/aluno/page.tsx`
   - `src/app/(admin)/layout.tsx` (logout e guardas)

2. **Cadastros e operações principais**
   - Alunos, Treinos, Planos/Matrículas e Dashboard.
   - Substituir `.from(...).select()/insert()/update()` por chamadas Firestore.

3. **Storage de avatar**
   - `src/components/avatar-upload.tsx`
   - `src/app/(admin)/perfil/page.tsx`
   - `src/app/meu-perfil/page.tsx`

4. **Cobranças e relatórios**
   - Refatorar consultas de `vencimentos_proximos` para agregações no Firestore
     (ou endpoint backend dedicado).

## Mapeamento inicial de coleções sugeridas no Firestore

- `academias`
- `perfis`
- `fichas_treino`
- `exercicios`
- `planos`
- `matriculas`
- `registros_carga`

## Observações importantes

- O diretório `supabase/` permanece temporariamente como referência histórica de
  modelo de dados e regras antigas.
- Durante a migração, evite manter dupla fonte de verdade (Supabase + Firebase)
  para a mesma funcionalidade em produção.
