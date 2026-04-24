import { getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage, type FirebaseStorage } from 'firebase/storage'

const rawFirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const requiredFirebaseConfig = {
  apiKey: rawFirebaseConfig.apiKey,
  authDomain: rawFirebaseConfig.authDomain,
  projectId: rawFirebaseConfig.projectId,
  messagingSenderId: rawFirebaseConfig.messagingSenderId,
  appId: rawFirebaseConfig.appId,
}

const missingVars = Object.entries(requiredFirebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key)

if (missingVars.length > 0 && typeof window !== 'undefined') {
  console.warn(`Firebase não configurado. Variáveis ausentes: ${missingVars.join(', ')}`)
}

export const isFirebaseConfigured = missingVars.length === 0
export const isFirebaseStorageEnabled =
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_ENABLED !== 'false' &&
  Boolean(rawFirebaseConfig.storageBucket)
export const isStorageEnabled = isFirebaseStorageEnabled

const firebaseConfig = {
  apiKey: rawFirebaseConfig.apiKey ?? 'demo-api-key',
  authDomain: rawFirebaseConfig.authDomain ?? 'demo-project.firebaseapp.com',
  projectId: rawFirebaseConfig.projectId ?? 'demo-project',
  storageBucket: rawFirebaseConfig.storageBucket,
  messagingSenderId: rawFirebaseConfig.messagingSenderId ?? '000000000000',
  appId: rawFirebaseConfig.appId ?? '1:000000000000:web:demo',
}

const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage: FirebaseStorage | null = isFirebaseStorageEnabled
  ? getStorage(app)
  : null
