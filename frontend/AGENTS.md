<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## FitManager backend (mandatory)

- Use **Firebase** only for client auth and cloud data in this app: `firebase/auth` and `firebase/firestore` via `@/lib/firebase` and `@/lib/firestore`.
- **Do not** add or reintroduce Supabase (or other BaaS) in the frontend.
