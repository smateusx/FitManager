-- Criação da Tabela de Academias (Tenants)
CREATE TABLE public.academias (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS (Row Level Security) na tabela academias
ALTER TABLE public.academias ENABLE ROW LEVEL SECURITY;

-- Criação da Tabela de Perfis de Usuários
-- Esta tabela vai se ligar aos usuários da Autenticação padrão do Supabase (auth.users)
CREATE TABLE public.perfis (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    academia_id UUID REFERENCES public.academias(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('ADMIN', 'RECEPCIONISTA', 'ALUNO')) NOT NULL DEFAULT 'ALUNO',
    nome_completo TEXT,
    telefone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS na tabela de perfis
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS DE SEGURANÇA (RLS)
-- Um perfil só pode ver os dados da sua própria academia
CREATE POLICY "Usuários veem perfis da própria academia" ON public.perfis
    FOR SELECT USING (
        academia_id = (SELECT academia_id FROM public.perfis WHERE id = auth.uid())
    );

-- Trigger automatizado: criar um perfil em branco na tabela 'perfis' toda vez que alguém se cadastrar no sistema de Auth
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.perfis (id, role, nome_completo)
    VALUES (NEW.id, 'ALUNO', NEW.raw_user_meta_data->>'nome_completo');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
