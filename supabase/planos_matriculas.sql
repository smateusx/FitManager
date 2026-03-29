-- Tabela de Planos da Academia
CREATE TABLE public.planos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    academia_id UUID REFERENCES public.academias(id) ON DELETE CASCADE NOT NULL,
    nome TEXT NOT NULL,
    descricao TEXT,
    valor NUMERIC(10,2) NOT NULL,
    duracao_dias INTEGER NOT NULL DEFAULT 30,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.planos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin gerencia planos da academia" ON public.planos
    FOR ALL USING (
        academia_id = public.get_my_academia_id()
    );

-- Tabela de Matrículas (vincula aluno ao plano com controle de vencimento)
CREATE TABLE public.matriculas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    academia_id UUID REFERENCES public.academias(id) ON DELETE CASCADE NOT NULL,
    aluno_id UUID REFERENCES public.perfis(id) ON DELETE CASCADE NOT NULL,
    plano_id UUID REFERENCES public.planos(id) ON DELETE SET NULL,
    status TEXT CHECK (status IN ('ATIVO', 'VENCIDO', 'CANCELADO')) NOT NULL DEFAULT 'ATIVO',
    data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    data_vencimento DATE NOT NULL,
    valor_pago NUMERIC(10,2),
    observacoes TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.matriculas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin gerencia matrículas da academia" ON public.matriculas
    FOR ALL USING (
        academia_id = public.get_my_academia_id()
    );

-- Aluno pode ver a própria matrícula
CREATE POLICY "Aluno vê própria matrícula" ON public.matriculas
    FOR SELECT TO authenticated
    USING (aluno_id = auth.uid());
