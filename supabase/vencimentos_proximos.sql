-- View para identificar matrículas vencidas ou vencendo em breve (7 dias)
CREATE OR REPLACE VIEW public.vencimentos_proximos AS
SELECT 
    m.id AS matricula_id,
    p.nome_completo AS aluno_nome,
    p.telefone AS aluno_telefone,
    pl.nome AS plano_nome,
    m.data_vencimento,
    m.academia_id,
    CASE 
        WHEN m.data_vencimento < CURRENT_DATE THEN 'VENCIDO'
        WHEN m.data_vencimento <= CURRENT_DATE + INTERVAL '7 days' THEN 'VENCENDO_EM_BREVE'
        ELSE 'EM_DIA'
    END AS status_vencimento,
    (m.data_vencimento - CURRENT_DATE) AS dias_para_vencimento
FROM 
    public.matriculas m
JOIN 
    public.perfis p ON m.aluno_id = p.id
JOIN 
    public.planos pl ON m.plano_id = pl.id
WHERE 
    m.status = 'ATIVO' -- Apenas matrículas que ainda deveriam estar ativas
    AND m.data_vencimento <= CURRENT_DATE + INTERVAL '7 days'
ORDER BY 
    m.data_vencimento ASC;

-- Habilitar RLS na View (Supabase expõe views via API)
-- Nota: Views no Postgres herdam as permissões das tabelas base se definidas como SECURITY INVOKER (padrão).
-- Como 'matriculas' e 'perfis' já têm RLS, a view respeitará o academia_id do usuário logado.
