-- PERMISSÕES PARA: ACADEMIAS
-- Permitir que qualquer usuário autenticado crie uma academia (necessário no momento do cadastro)
CREATE POLICY "Permitir criação de academias no cadastro" 
ON public.academias FOR INSERT TO authenticated WITH CHECK (true);

-- Permitir que membros leiam os dados da sua própria academia
CREATE POLICY "Membros veem sua própria academia" 
ON public.academias FOR SELECT TO authenticated USING (
    id = (SELECT academia_id FROM public.perfis WHERE id = auth.uid())
);

-- PERMISSÕES PARA: PERFIS
-- Permitir que o usuário atualize seu próprio perfil (necessário para ele se definir como ADMIN logo após o cadastro)
CREATE POLICY "Usuário atualiza o próprio perfil" 
ON public.perfis FOR UPDATE TO authenticated USING (id = auth.uid());
