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

Os índices podem ficar vários minutos em **Building** na consola até **Enabled**.

## Rules

```bash
firebase deploy --only firestore:rules
```

## Índices + rules

```bash
firebase deploy --only firestore
```

Nota: índices que já existem com os mesmos campos são ignorados ou mantidos; não duplicas dados.
