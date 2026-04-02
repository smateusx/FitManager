-- Adiciona coluna para a URL da foto de perfil
ALTER TABLE public.perfis ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Observação: Para que o upload funcione, o usuário deve criar um bucket chamado 'avatars' 
-- no Supabase Dashboard e defini-lo como 'Público'.
-- Caso queira fazer via SQL (depende das permissões do usuário):
/*
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;
*/
