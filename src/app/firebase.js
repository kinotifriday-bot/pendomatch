import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: "AIzaSyD4SGww_8LpAq_0fHYz2zifvOlndh7m90Y",
  authDomain: "mingle-bff25.firebaseapp.com",
  projectId: "mingle-bff25",
  storageBucket: "mingle-bff25.appspot.com",
  messagingSenderId: "837882207909",
  appId: "1:837882207909:web:d36f6ea39fe66f8dcd774c"
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)