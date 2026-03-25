DROP POLICY IF EXISTS "Membros veem sua própria academia" ON public.academias;

CREATE POLICY "Usuários autenticados podem ver academias" 
ON public.academias FOR SELECT TO authenticated USING (true);
