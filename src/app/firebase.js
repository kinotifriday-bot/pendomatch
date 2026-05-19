"use client"

import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: "AIzaSyAdc9iLS4oeubdeDfnccCiUN5gzzzLxeg",
  authDomain: "mingle-bff25.firebaseapp.com",
  projectId: "mingle-bff25",
  storageBucket: "mingle-bff25.appspot.com",
  messagingSenderId: "837882207909",
  appId: "1:837882207909:web:3841ee712f9a0da4cd774c"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)