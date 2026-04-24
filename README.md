# FitManager

SaaS voltado para academias de pequeno e médio porte, com foco no mercado brasileiro.

## Stack Técnica (MVP)
* **Frontend:** Next.js (React) + Tailwind CSS + Shadcn/UI
* **Backend:** Node.js
* **Banco de Dados:** Supabase (PostgreSQL)
* **Outros:** Autenticação Supabase, IA (Claude/OpenAI), Integração WhatsApp.

## Estrutura do Projeto (Monorepo)
* `/frontend`: Aplicação web Next.js para a interface.
* `/backend`: API e serviços em Node.js (se necessário desacoplar do Next.js/Supabase).

## Setup de Ambiente

### Frontend
```bash
cd frontend
cp .env.example .env.local
# preencha NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run dev
```

### Backend
```bash
cd backend
cp .env.example .env
# preencha SUPABASE_URL e SUPABASE_ANON_KEY
npm install
npm run dev
```

## Validação de Qualidade (frontend)
```bash
cd frontend
npm run lint
npm run build
```
