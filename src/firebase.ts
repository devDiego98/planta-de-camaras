import { initializeApp } from 'firebase/app'
import { getAnalytics, type Analytics } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: 'AIzaSyAhUNXsKnPJFBbmTD8WvtmliobRxltS-7s',
  authDomain: 'planta-de-camaras.firebaseapp.com',
  projectId: 'planta-de-camaras',
  storageBucket: 'planta-de-camaras.firebasestorage.app',
  messagingSenderId: '473992903563',
  appId: '1:473992903563:web:9cbf0c316d6cb8fdc1cd8e',
  measurementId: 'G-LKVF87SW2E',
} as const

export const app = initializeApp(firebaseConfig)

/** Only available in the browser bundle at runtime. */
export const analytics: Analytics | undefined =
  typeof window !== 'undefined' ? getAnalytics(app) : undefined
