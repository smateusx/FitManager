# FitManager

SaaS voltado para academias de pequeno e médio porte, com foco no mercado brasileiro.

## Stack Técnica (MVP)
* **Frontend:** Next.js (React) + Tailwind CSS + Shadcn/UI
* **Backend:** Node.js
* **Banco de Dados:** Firebase Firestore
* **Outros:** Firebase Authentication + Firebase Storage, IA (Claude/OpenAI), Integração WhatsApp.

## Estrutura do Projeto (Monorepo)
* `/frontend`: Aplicação web Next.js para a interface.
* `/backend`: API e serviços em Node.js (se necessário desacoplar do Next.js/Firebase).

## Setup de Ambiente

### Frontend
```bash
cd frontend
cp .env.example .env.local
# preencha as variáveis NEXT_PUBLIC_FIREBASE_*
npm install
npm run dev
```

### Backend
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```
