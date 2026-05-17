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

import { useSwipeable } from "react-swipeable"
import { motion, useMotionValue, useTransform } from "framer-motion"

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

  const [matchPopup, setMatchPopup] = useState(null)

  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-10, 10])
  const likeOpacity = useTransform(x, [0, 120], [0, 1])
  const passOpacity = useTransform(x, [-120, 0], [1, 0])

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

  function nextProfile() {
    setIndex(i => i + 1)
    x.set(0)
  }

  async function likeProfile(target) {
    if (!canSwipe()) {
      setStatus("Upgrade required")
      return
    }

    if (!target || !user) return

    await addDoc(collection(db, "likes"), {
      from: user.uid,
      to: target.uid
    })

    const snap = await getDocs(collection(db, "likes"))

    const matchFound = snap.docs.some(d =>
      d.data().from === target.uid &&
      d.data().to === user.uid
    )

    if (matchFound) {
      await addDoc(collection(db, "matches"), {
        users: [user.uid, target.uid],
        createdAt: Date.now()
      })

      setMatchPopup(target.name || "Someone")
    }

    setSwipes(s => s + 1)
    nextProfile()
  }

  function passProfile() {
    setSwipes(s => s + 1)
    nextProfile()
  }

  const handlers = useSwipeable({
    onSwipedLeft: () => passProfile(),
    onSwipedRight: () => likeProfile(current),
    trackMouse: true
  })

  const current = profiles[index]
  const next = profiles[index + 1]

  async function upgradeToPremium() {
    window.location.href = "https://pay.pesapal.com"
  }

  return (
    <main style={styles.bg}>

      {matchPopup && (
        <div style={styles.overlay}>
          <div style={styles.popup}>
            <h2>💘 It's a Match!</h2>
            <p>You matched with {matchPopup}</p>
            <button onClick={() => setMatchPopup(null)} style={btn}>
              Continue
            </button>
          </div>
        </div>
      )}

      <div style={styles.card}>

        <h1 style={{ textAlign: "center", color: "#7b2ff7" }}>
          PendoMatch 💘
        </h1>

        {!user ? (
          <>
            <input placeholder="Email" value={email}
              onChange={e => setEmail(e.target.value)} style={input} />

            <input placeholder="Password" type="password"
              value={password} onChange={e => setPassword(e.target.value)} style={input} />

            <button onClick={login} style={btn}>Login</button>
            <button onClick={signup} style={btn2}>Sign Up</button>
          </>
        ) : (
          <>
            <p style={{ textAlign: "center" }}>
              {isPremium ? "Premium" : "Free"} • Swipes {swipes}/{limit}
            </p>

            {/* CARD STACK */}
            <div style={{ position: "relative", height: "420px" }}>

              {next && (
                <div style={{
                  ...profileCard,
                  position: "absolute",
                  top: 10,
                  left: 0,
                  right: 0,
                  transform: "scale(0.95)",
                  opacity: 0.4,
                  zIndex: 0
                }}>
                  {next.photo && <img src={next.photo} style={img} />}
                  <h3>{next.name}</h3>
                </div>
              )}

              {current && (
                <motion.div
                  {...handlers}
                  style={{
                    ...profileCard,
                    position: "relative",
                    zIndex: 2,
                    x,
                    rotate
                  }}
                  whileDrag={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >

                  {/* Swipe indicators */}
                  <motion.div style={{
                    position: "absolute",
                    left: 20,
                    top: 20,
                    color: "green",
                    fontWeight: "bold",
                    opacity: likeOpacity
                  }}>
                    LIKE
                  </motion.div>

                  <motion.div style={{
                    position: "absolute",
                    right: 20,
                    top: 20,
                    color: "red",
                    fontWeight: "bold",
                    opacity: passOpacity
                  }}>
                    PASS
                  </motion.div>

                  {current.photo && (
                    <img src={current.photo} style={img} />
                  )}

                  <h3>{current.name}</h3>
                  <p>{current.age} • {current.gender}</p>
                  <p>{current.bio}</p>

                </motion.div>
              )}

            </div>

            {!isPremium && swipes >= limit && (
              <button onClick={upgradeToPremium} style={upgradeBtn}>
                Upgrade to Premium
              </button>
            )}

            <p style={{ textAlign: "center", fontSize: "12px", color: "#999" }}>
              {status}
            </p>
          </>
        )}

      </div>
    </main>
  )
}

const styles = {
  bg: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg,#ff4d6d,#7b2ff7,#00c6ff)",
    fontFamily: "system-ui"
  },
  card: {
    width: "100%",
    maxWidth: "420px",
    background: "white",
    borderRadius: "20px",
    padding: "20px"
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  popup: {
    background: "white",
    padding: "20px",
    borderRadius: "15px",
    textAlign: "center"
  }
}

const input = {
  width: "100%",
  padding: "10px",
  marginBottom: "10px",
  borderRadius: "10px",
  border: "1px solid #ddd"
}

const btn = {
  width: "100%",
  padding: "10px",
  background: "#7b2ff7",
  color: "white",
  border: "none",
  borderRadius: "10px"
}

const btn2 = {
  width: "100%",
  padding: "10px",
  background: "#eee",
  border: "none",
  borderRadius: "10px",
  marginTop: "5px"
}

const profileCard = {
  padding: "15px",
  border: "1px solid #eee",
  borderRadius: "15px",
  marginTop: "10px",
  background: "white"
}

const img = {
  width: "100%",
  borderRadius: "12px",
  marginBottom: "10px"
}

const upgradeBtn = {
  width: "100%",
  padding: "12px",
  background: "#ffb703",
  border: "none",
  borderRadius: "10px",
  fontWeight: "bold",
  marginTop: "15px"
}