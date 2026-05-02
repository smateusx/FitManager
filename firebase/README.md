# Firebase (Firestore)

Os índices compostos usados pela app estão em `firestore.indexes.json`. As rules em `firestore.rules`.

## Criar todos os índices de uma vez

Na **raiz do repositório** (pasta que contém `firebase.json`):

1. Instalar a [Firebase CLI](https://firebase.google.com/docs/cli).
2. `firebase login`
3. Associar o projeto (substitui pelo ID do teu projeto, ex.: `fitmanager-prod`):
   ```bash
   firebase use fitmanager-prod
   ```
4. Publicar só os índices:
   ```bash
   firebase deploy --only firestore:indexes
   ```

## Autenticação (Firebase Console)

- **Verificação de e-mail**: em Authentication → **Settings** → ative **Prevent user enumeration** se desejar (recomendado em produção).
- **Google**: Authentication → **Sign-in method** → ative **Google** e configure o suporte a e-mail (consent screen no Google Cloud se necessário).
- Domínios autorizados: em Authentication → **Settings** → **Authorized domains**, inclua o domínio Vercel (ex.: `fitmanager-web.vercel.app`).

## Firestore — CPF único

A app usa a coleção `cpf_claims` com ID = 11 dígitos do CPF (um documento por CPF). Novos deploys de índice não são obrigatórios para isso.


```bash
firebase deploy --only firestore:rules
```

## Índices + rules

```bash
firebase deploy --only firestore
```

Nota: índices que já existem com os mesmos campos são ignorados ou mantidos; não duplicas dados.
