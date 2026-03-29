-- Tabela de Fichas de Treino
CREATE TABLE public.fichas_treino (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    academia_id UUID REFERENCES public.academias(id) ON DELETE CASCADE NOT NULL,
    aluno_id UUID REFERENCES public.perfis(id) ON DELETE CASCADE NOT NULL,
    nome TEXT NOT NULL,
    objetivo TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.fichas_treino ENABLE ROW LEVEL SECURITY;

-- Admin só vê fichas da própria academia
CREATE POLICY "Admin vê fichas da academia" ON public.fichas_treino
    FOR ALL USING (
        academia_id = (SELECT academia_id FROM public.perfis WHERE id = auth.uid())
    );

-- Tabela de Exercícios dentro de cada Ficha
CREATE TABLE public.exercicios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ficha_id UUID REFERENCES public.fichas_treino(id) ON DELETE CASCADE NOT NULL,
    nome TEXT NOT NULL,
    series INTEGER NOT NULL DEFAULT 3,
    repeticoes TEXT NOT NULL DEFAULT '10-12',
    carga TEXT,
    descanso TEXT DEFAULT '60s',
    ordem INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.exercicios ENABLE ROW LEVEL SECURITY;

-- Exercícios acessíveis para quem pode acessar a ficha
CREATE POLICY "Acesso exercícios via ficha" ON public.exercicios
    FOR ALL USING (
        ficha_id IN (
            SELECT id FROM public.fichas_treino WHERE academia_id = (
                SELECT academia_id FROM public.perfis WHERE id = auth.uid()
            )
        )
    );
