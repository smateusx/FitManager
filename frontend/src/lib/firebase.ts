import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

function hasConfig() {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId
  )
}

let app: FirebaseApp | null = null

export function getFirebaseApp(): FirebaseApp {
  if (!hasConfig()) {
    throw new Error(
      'Firebase não configurado. Defina NEXT_PUBLIC_FIREBASE_* no .env / Vercel (veja README ou firebase/README.md).'
    )
  }
  if (!app) {
    app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig)
  }
  return app
}

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp())
}

export function getDb(): Firestore {
  return getFirestore(getFirebaseApp())
}

export { hasConfig }
