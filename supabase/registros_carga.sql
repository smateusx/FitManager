-- Tabela para registro de evolução de carga e força
CREATE TABLE public.registros_carga (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    aluno_id UUID REFERENCES public.perfis(id) ON DELETE CASCADE NOT NULL,
    exercicio_id UUID REFERENCES public.exercicios(id) ON DELETE CASCADE NOT NULL,
    carga NUMERIC(10,2) NOT NULL, -- Peso em kg ou lbs
    repeticoes INTEGER NOT NULL,
    data_registro TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    observacoes TEXT
);

-- Habilitar RLS
ALTER TABLE public.registros_carga ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança
CREATE POLICY "Alunos inserem seus próprios registros" ON public.registros_carga
    FOR INSERT WITH CHECK (aluno_id = auth.uid());

CREATE POLICY "Alunos veem seus próprios registros" ON public.registros_carga
    FOR SELECT USING (aluno_id = auth.uid());

CREATE POLICY "Admins veem todos os registros da academia" ON public.registros_carga
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.perfis p
            WHERE p.id = auth.uid() 
            AND p.role IN ('ADMIN', 'RECEPCIONISTA')
            AND p.academia_id = (SELECT academia_id FROM public.perfis WHERE id = registros_carga.aluno_id)
        )
    );

-- Índice para performance de busca por aluno e exercício (gráficos)
CREATE INDEX idx_registros_carga_aluno_exercicio ON public.registros_carga(aluno_id, exercicio_id);
