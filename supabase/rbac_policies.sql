-- RBAC POLICIES FOR FITMANAGER
-- This script consolidates permissions for ADMIN and RECEPCIONISTA

-- 1. Helper Function: Get current user role
CREATE OR REPLACE FUNCTION public.get_user_role() 
RETURNS TEXT AS $$
  SELECT role FROM public.perfis WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 2. Helper Function: Get current user academia_id
CREATE OR REPLACE FUNCTION public.get_my_academia_id() 
RETURNS UUID AS $$
  SELECT academia_id FROM public.perfis WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;


-- ==========================================
-- TABLE: perfis
-- ==========================================
DROP POLICY IF EXISTS "Usuários veem perfis da própria academia" ON public.perfis;
DROP POLICY IF EXISTS "Admin gerencia todos os perfis da academia" ON public.perfis;
DROP POLICY IF EXISTS "Recepcionista gerencia alunos da academia" ON public.perfis;
DROP POLICY IF EXISTS "Recepcionista vê todos os perfis" ON public.perfis;
DROP POLICY IF EXISTS "Recepcionista gerencia alunos" ON public.perfis;
DROP POLICY IF EXISTS "Recepcionista atualiza alunos" ON public.perfis;
DROP POLICY IF EXISTS "Aluno vê próprio perfil" ON public.perfis;

-- ADMIN: Full control over their academia's profiles
CREATE POLICY "Admin gerencia todos os perfis da academia" ON public.perfis
    FOR ALL USING (
        academia_id = public.get_my_academia_id() AND public.get_user_role() = 'ADMIN'
    );

-- RECEPCIONISTA: Can see all, but only insert/update ALUNOS. NO DELETE.
CREATE POLICY "Recepcionista vê todos os perfis" ON public.perfis
    FOR SELECT USING (
        academia_id = public.get_my_academia_id() AND public.get_user_role() = 'RECEPCIONISTA'
    );

CREATE POLICY "Recepcionista gerencia alunos" ON public.perfis
    FOR INSERT WITH CHECK (
        academia_id = public.get_my_academia_id() AND public.get_user_role() = 'RECEPCIONISTA' AND role = 'ALUNO'
    );

CREATE POLICY "Recepcionista atualiza alunos" ON public.perfis
    FOR UPDATE USING (
        academia_id = public.get_my_academia_id() AND public.get_user_role() = 'RECEPCIONISTA' AND role = 'ALUNO'
    );

-- ALUNO: Can see own profile
CREATE POLICY "Aluno vê próprio perfil" ON public.perfis
    FOR SELECT USING (id = auth.uid());


-- ==========================================
-- TABLE: planos
-- ==========================================
DROP POLICY IF EXISTS "Admin gerencia planos da academia" ON public.planos;
DROP POLICY IF EXISTS "Leitura de planos para funcionários e alunos" ON public.planos;

-- ADMIN: Full control
CREATE POLICY "Admin gerencia planos da academia" ON public.planos
    FOR ALL USING (
        academia_id = public.get_my_academia_id() AND public.get_user_role() = 'ADMIN'
    );

-- RECEPCIONISTA & ALUNO: Select only
CREATE POLICY "Leitura de planos para funcionários e alunos" ON public.planos
    FOR SELECT USING (
        academia_id = public.get_my_academia_id()
    );


-- ==========================================
-- TABLE: matriculas
-- ==========================================
DROP POLICY IF EXISTS "Admin gerencia matrículas da academia" ON public.matriculas;
DROP POLICY IF EXISTS "Aluno vê própria matrícula" ON public.matriculas;
DROP POLICY IF EXISTS "Recepcionista gerencia matrículas" ON public.matriculas;
DROP POLICY IF EXISTS "Recepcionista vê matrículas" ON public.matriculas;
DROP POLICY IF EXISTS "Recepcionista atualiza matrículas" ON public.matriculas;
DROP POLICY IF EXISTS "Aluno vê próprias matrículas" ON public.matriculas;

-- ADMIN: Full control
CREATE POLICY "Admin gerencia matrículas da academia" ON public.matriculas
    FOR ALL USING (
        academia_id = public.get_my_academia_id() AND public.get_user_role() = 'ADMIN'
    );

-- RECEPCIONISTA: Mantém matrículas (faturamento), mas não deleta
CREATE POLICY "Recepcionista gerencia matrículas" ON public.matriculas
    FOR INSERT WITH CHECK (
        academia_id = public.get_my_academia_id() AND public.get_user_role() = 'RECEPCIONISTA'
    );

CREATE POLICY "Recepcionista vê matrículas" ON public.matriculas
    FOR SELECT USING (
        academia_id = public.get_my_academia_id() AND public.get_user_role() = 'RECEPCIONISTA'
    );

CREATE POLICY "Recepcionista atualiza matrículas" ON public.matriculas
    FOR UPDATE USING (
        academia_id = public.get_my_academia_id() AND public.get_user_role() = 'RECEPCIONISTA'
    );

-- ALUNO: Only own
CREATE POLICY "Aluno vê próprias matrículas" ON public.matriculas
    FOR SELECT USING (aluno_id = auth.uid());


-- ==========================================
-- TABLE: fichas_treino
-- ==========================================
DROP POLICY IF EXISTS "Admin vê fichas da academia" ON public.fichas_treino;
DROP POLICY IF EXISTS "Admin gerencia fichas da academia" ON public.fichas_treino;
DROP POLICY IF EXISTS "Recepcionista visualiza fichas" ON public.fichas_treino;
DROP POLICY IF EXISTS "Aluno acessa próprias fichas" ON public.fichas_treino;

-- ADMIN: Full control
CREATE POLICY "Admin gerencia fichas da academia" ON public.fichas_treino
    FOR ALL USING (
        academia_id = public.get_my_academia_id() AND public.get_user_role() = 'ADMIN'
    );

-- RECEPCIONISTA: Select only
CREATE POLICY "Recepcionista visualiza fichas" ON public.fichas_treino
    FOR SELECT USING (
        academia_id = public.get_my_academia_id() AND public.get_user_role() = 'RECEPCIONISTA'
    );

-- ALUNO: Only own
CREATE POLICY "Aluno acessa próprias fichas" ON public.fichas_treino
    FOR SELECT USING (aluno_id = auth.uid());


-- ==========================================
-- TABLE: exercicios
-- ==========================================
DROP POLICY IF EXISTS "Acesso exercícios via ficha" ON public.exercicios;
DROP POLICY IF EXISTS "Acesso exercícios via ficha rbac" ON public.exercicios;
DROP POLICY IF EXISTS "Recepcionista visualiza exercícios" ON public.exercicios;
DROP POLICY IF EXISTS "Admin gerencia exercícios" ON public.exercicios;
DROP POLICY IF EXISTS "Leitura de exercícios para funcionários e alunos" ON public.exercicios;

-- ADMIN: Full control
CREATE POLICY "Admin gerencia exercícios" ON public.exercicios
    FOR ALL USING (
        ficha_id IN (
            SELECT id FROM public.fichas_treino WHERE academia_id = public.get_my_academia_id()
        ) AND public.get_user_role() = 'ADMIN'
    );

-- RECEPCIONISTA & ALUNO: Select only
CREATE POLICY "Leitura de exercícios para funcionários e alunos" ON public.exercicios
    FOR SELECT USING (
        ficha_id IN (
            SELECT id FROM public.fichas_treino WHERE academia_id = public.get_my_academia_id()
        )
    );


-- ==========================================
-- TABLE: registros_carga
-- ==========================================
DROP POLICY IF EXISTS "Alunos inserem seus próprios registros" ON public.registros_carga;
DROP POLICY IF EXISTS "Alunos veem seus próprios registros" ON public.registros_carga;
DROP POLICY IF EXISTS "Admins veem todos os registros da academia" ON public.registros_carga;
DROP POLICY IF EXISTS "Admin gerencia todos os registros de carga" ON public.registros_carga;
DROP POLICY IF EXISTS "Recepcionista visualiza registros de carga" ON public.registros_carga;
DROP POLICY IF EXISTS "Aluno gerencia próprios registros" ON public.registros_carga;

-- ADMIN: Full control
CREATE POLICY "Admin gerencia todos os registros de carga" ON public.registros_carga
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.perfis p
            WHERE p.id = auth.uid() AND p.role = 'ADMIN'
            AND p.academia_id = (SELECT academia_id FROM public.perfis WHERE id = registros_carga.aluno_id)
        )
    );

-- RECEPCIONISTA: Select only
CREATE POLICY "Recepcionista visualiza registros de carga" ON public.registros_carga
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.perfis p
            WHERE p.id = auth.uid() AND p.role = 'RECEPCIONISTA'
            AND p.academia_id = (SELECT academia_id FROM public.perfis WHERE id = registros_carga.aluno_id)
        )
    );

-- ALUNO: Own data
CREATE POLICY "Aluno gerencia próprios registros" ON public.registros_carga
    FOR ALL USING (aluno_id = auth.uid());
