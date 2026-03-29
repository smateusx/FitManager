-- Garantir que o aluno recém-cadastrado pode inserir/atualizar o próprio perfil
-- (necessário para o cadastro via link de convite funcionar)

-- Política para o aluno poder inserir o próprio perfil (caso trigger falhe)
CREATE POLICY IF NOT EXISTS "Usuário insere próprio perfil"
ON public.perfis FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());

-- Política de UPDATE já deve existir, mas garantimos que cobre nome_completo e telefone
DROP POLICY IF EXISTS "Usuário atualiza o próprio perfil" ON public.perfis;

CREATE POLICY "Usuário atualiza o próprio perfil"
ON public.perfis FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());
