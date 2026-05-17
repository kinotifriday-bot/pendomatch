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
    const snap = await getDocs(collection(db, "profiles"))
    setProfiles(snap.docs.map(d => d.data()))
  }

  async function signup() {
    try {
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

  function next() {
    setIndex(i => i + 1)
  }

  async function likeProfile() {
    if (!canSwipe()) {
      setStatus("🚫 Upgrade required")
      return
    }

    const target = profiles[index]
    if (!target || !user) return

    await addDoc(collection(db, "likes"), {
      from: user.uid,
      to: target.uid
    })

    setSwipes(s => s + 1)
    next()
  }

  function passProfile() {
    if (!canSwipe()) {
      setStatus("🚫 Upgrade required")
      return
    }

    setSwipes(s => s + 1)
    next()
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
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "system-ui",
      background: "linear-gradient(135deg,#ff4d6d,#7b2ff7,#00c6ff)"
    }}>

      <div style={{
        width: "100%",
        maxWidth: "420px",
        background: "white",
        borderRadius: "20px",
        padding: "25px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.25)"
      }}>

        <h1 style={{
          textAlign: "center",
          color: "#7b2ff7",
          marginBottom: "5px"
        }}>
          PendoMatch 💘
        </h1>

        <p style={{
          textAlign: "center",
          fontSize: "13px",
          color: "#666",
          marginBottom: "20px"
        }}>
          Swipe. Match. Connect.
        </p>

        {!user ? (
          <>
            <input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />

            <input
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
            />

            <button onClick={login} style={primaryBtn}>
              Login
            </button>

            <button onClick={signup} style={secondaryBtn}>
              Sign Up
            </button>
          </>
        ) : (
          <>
            <p style={{ textAlign: "center", fontSize: "13px" }}>
              {isPremium ? "🔥 Premium Active" : "Free Plan"}
            </p>

            <p style={{ textAlign: "center", fontSize: "12px", color: "#888" }}>
              Swipes {swipes} / {limit}
            </p>

            {current ? (
              <div style={{
                marginTop: "15px",
                padding: "15px",
                borderRadius: "15px",
                border: "1px solid #eee"
              }}>
                <h3>{current.name}</h3>
                <p>{current.age} • {current.gender}</p>
                <p style={{ color: "#666" }}>{current.bio}</p>

                <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                  <button onClick={likeProfile} style={primaryBtn}>
                    Like
                  </button>

                  <button onClick={passProfile} style={secondaryBtn}>
                    Pass
                  </button>
                </div>
              </div>
            ) : (
              <p style={{ textAlign: "center" }}>No more profiles</p>
            )}

            {!isPremium && swipes >= limit && (
              <button onClick={upgradeToPremium} style={{
                marginTop: "20px",
                width: "100%",
                padding: "12px",
                borderRadius: "10px",
                border: "none",
                background: "#ffb703",
                fontWeight: "bold"
              }}>
                Upgrade to Premium
              </button>
            )}

            <p style={{
              textAlign: "center",
              fontSize: "12px",
              color: "#999"
            }}>
              {status}
            </p>
          </>
        )}

      </div>
    </main>
  )
}

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginBottom: "10px",
  borderRadius: "10px",
  border: "1px solid #ddd"
}

const primaryBtn = {
  width: "100%",
  padding: "10px",
  background: "#7b2ff7",
  color: "white",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer"
}

const secondaryBtn = {
  width: "100%",
  padding: "10px",
  background: "#eee",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer"
}