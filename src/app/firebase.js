import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// 1. PASTE THE DIAGNOSTIC CODE HERE IN VS CODE:
if (typeof window !== 'undefined') {
  console.log("Checking API Key availability:", {
    hasKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    keyLength: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.length || 0,
    startsWithAIza: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.startsWith("AIza")
  });
}

// 2. Your initialization line follows right after:
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);