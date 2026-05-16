"use client"

import { useEffect, useState } from "react"
import { initializeApp } from "firebase/app"
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "firebase/auth"

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  setDoc,
  getDoc
} from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyADc9iLS4oeubdeDfnccCiUN5gzzzLxeg",
  authDomain: "mingle-bff25.firebaseapp.com",
  projectId: "mingle-bff25",
  storageBucket: "mingle-bff25.firebasestorage.app",
  messagingSenderId: "837882207909",
  appId: "1:837882207909:web:3841ee712f9a0da4cd774c"
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

export default function Page() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const [user, setUser] = useState(null)

  const [profiles, setProfiles] = useState([])
  const [index, setIndex] = useState(0)

  const [swipes, setSwipes] = useState(0)
  const [limit] = useState(5)

  const [isPremium, setIsPremium] = useState(false)
  const [status, setStatus] = useState("")

  useEffect(() => {
    loadProfiles()
  }, [])

  async function loadProfiles() {
    try {
      const snap = await getDocs(collection(db, "profiles"))
      setProfiles(snap.docs.map(d => d.data()))
    } catch (err) {
      setStatus("Failed to load profiles")
    }
  }

  async function signup() {
    try {
      if (!email || !password) {
        setStatus("Enter email and password")
        return
      }

      const res = await createUserWithEmailAndPassword(auth, email, password)
      setUser(res.user)

      await setDoc(doc(db, "subscriptions", res.user.uid), {
        premium: false
      })

      setIsPremium(false)
      setStatus("Account created")
    } catch (err) {
      setStatus(err.message)
    }
  }

  async function login() {
    try {
      const res = await signInWithEmailAndPassword(auth, email, password)
      setUser(res.user)

      const subRef = await getDoc(doc(db, "subscriptions", res.user.uid))

      if (subRef.exists()) {
        setIsPremium(subRef.data().premium === true)
      } else {
        setIsPremium(false)
      }

      setStatus("Logged in")
    } catch (err) {
      setStatus(err.message)
    }
  }

  function canSwipe() {
    return isPremium || swipes < limit
  }

  function nextProfile() {
    setIndex(i => i + 1)
  }

  async function likeProfile() {
    if (!canSwipe()) {
      setStatus("🚫 Upgrade required to continue")
      return
    }

    const target = profiles[index]
    if (!target || !user) return

    await addDoc(collection(db, "likes"), {
      from: user.uid,
      to: target.uid
    })

    const likesSnap = await getDocs(collection(db, "likes"))
    const likes = likesSnap.docs.map(d => d.data())

    const match = likes.find(
      l => l.from === target.uid && l.to === user.uid
    )

    if (match) {
      setStatus("🔥 It's a MATCH!")
    }

    setSwipes(s => s + 1)
    nextProfile()
  }

  function passProfile() {
    if (!canSwipe()) {
      setStatus("🚫 Upgrade required to continue")
      return
    }

    setSwipes(s => s + 1)
    nextProfile()
  }

  async function upgradeToPremium() {
    const url = "https://pay.pesapal.com/iframe/PesapalIframe3.aspx"

    const params = new URLSearchParams({
      amount: "100",
      description: "PendoMatch Premium",
      type: "MERCHANT",
      reference: user.uid,
      email: user.email,
      currency: "KES"
    })

    window.location.href = `${url}?${params.toString()}`
  }

  const current = profiles.length > 0 ? profiles[index] : null

  return (
    <main style={{
      minHeight: "100vh",
      padding: "40px",
      fontFamily: "system-ui",
      background: "linear-gradient(135deg,#ff2d75,#7b2ff7,#00c6ff)",
      color: "white"
    }}>

      <h1>PendoMatch</h1>

      {!user ? (
        <div>
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button onClick={signup}>Sign Up</button>
          <button onClick={login}>Login</button>
        </div>
      ) : (
        <div>

          <p>Swipes: {swipes} / {limit}</p>
          <p>{isPremium ? "🔥 Premium Active" : "Free Plan"}</p>

          {current ? (
            <div style={{
              background: "white",
              color: "black",
              padding: "20px",
              borderRadius: "12px",
              maxWidth: "300px"
            }}>
              <h2>{current.name}</h2>
              <p>{current.age}</p>
              <p>{current.gender}</p>
              <p>{current.bio}</p>

              <button onClick={likeProfile}>Like</button>
              <button onClick={passProfile}>Pass</button>
            </div>
          ) : (
            <h2>No more profiles</h2>
          )}

          {!isPremium && swipes >= limit && (
            <button
              onClick={upgradeToPremium}
              style={{
                marginTop: "20px",
                padding: "12px",
                background: "gold",
                border: "none",
                fontWeight: "bold",
                cursor: "pointer"
              }}
            >
              Upgrade to Premium
            </button>
          )}

          <p>{status}</p>

        </div>
      )}

    </main>
  )
}