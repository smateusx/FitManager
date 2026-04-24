-- Tabela canonical de evolucao de carga usada pelo frontend atual
CREATE TABLE IF NOT EXISTS public.evolucao_carga (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    aluno_id UUID REFERENCES public.perfis(id) ON DELETE CASCADE NOT NULL,
    exercicio_nome TEXT NOT NULL,
    carga NUMERIC(10,2) NOT NULL,
    registrado_em DATE NOT NULL DEFAULT CURRENT_DATE
);

ALTER TABLE public.evolucao_carga ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Aluno gerencia propria evolucao" ON public.evolucao_carga;
DROP POLICY IF EXISTS "Equipe ve evolucao da academia" ON public.evolucao_carga;

CREATE POLICY "Aluno gerencia propria evolucao" ON public.evolucao_carga
    FOR ALL USING (aluno_id = auth.uid())
    WITH CHECK (aluno_id = auth.uid());

CREATE POLICY "Equipe ve evolucao da academia" ON public.evolucao_carga
    FOR SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.perfis p
            WHERE p.id = auth.uid()
              AND p.role IN ('ADMIN', 'RECEPCIONISTA')
              AND p.academia_id = (
                  SELECT academia_id
                  FROM public.perfis
                  WHERE id = evolucao_carga.aluno_id
              )
        )
    );

CREATE INDEX IF NOT EXISTS idx_evolucao_carga_aluno_exercicio_data
    ON public.evolucao_carga (aluno_id, exercicio_nome, registrado_em DESC);
