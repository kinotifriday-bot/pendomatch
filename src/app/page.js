"use client"

import { useEffect, useState } from "react"
import { getApps, initializeApp } from "firebase/app"

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
  setDoc,
  getDoc,
  doc,
  onSnapshot
} from "firebase/firestore"
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "firebase/storage"

import { useSwipeable } from "react-swipeable"
import { motion, useMotionValue, useTransform } from "framer-motion"

/* ---------------- FIREBASE ---------------- */

const firebaseConfig = {
  apiKey: "AIzaSyD4SGww_8LpAq_0fHYz2zifvOlndh7m90Y",
  authDomain: "mingle-bff25.firebaseapp.com",
  projectId: "mingle-bff25",
  storageBucket: "mingle-bff25.firebasestorage.app",
  messagingSenderId: "837882207909",
  appId: "1:837882207909:web:d36f6ea39fe66f8dcd774c"
};
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)

const auth = getAuth(app)
const db = getFirestore(app)
const storage = getStorage(app)

/* ---------------- PAGE ---------------- */

export default function Page() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [user, setUser] = useState(null)

  const [step, setStep] = useState("auth")

  const [profiles, setProfiles] = useState([])
  const [index, setIndex] = useState(0)

  const [matches, setMatches] = useState([])
  const [activeChat, setActiveChat] = useState(null)

  const [messages, setMessages] = useState([])
  const [message, setMessage] = useState("")

  const [isSubscribed, setIsSubscribed] = useState(false)

  const [matchPopup, setMatchPopup] = useState("")

  const [profileData, setProfileData] = useState({
    name: "",
    age: "",
    gender: "",
    bio: "",
    lookingFor: ""
  })

  const [photoFile, setPhotoFile] = useState(null)

  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-12, 12])

  /* ---------------- AUTH ---------------- */

  async function signup() {
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password)

      setUser(res.user)

      await setDoc(doc(db, "subscriptions", res.user.uid), {
        premium: false
      })

      setStep("profile")
    } catch (err) {
      console.log(err)
      alert(err.message)
    }
  }

  async function login() {
    if (!email || !password) {
      alert("Email and password required")
      return
    }

    try {
      const res = await signInWithEmailAndPassword(auth, email, password)

      setUser(res.user)

      await checkSubscription(res.user.uid)

      setStep("app")

      loadProfiles()
      loadMatches()
    } catch (err) {
      console.log("LOGIN ERROR:", err.code, err.message)
      alert(err.message)
    }
  }

  async function checkSubscription(uid) {
    try {
      const snap = await getDoc(doc(db, "subscriptions", uid))

      if (snap.exists()) {
        setIsSubscribed(snap.data().premium)
      }
    } catch (e) {
      console.log("subscription error", e)
    }
  }

  /* ---------------- PROFILE ---------------- */

  async function uploadPhoto(file) {
    const storageRef = ref(storage, "profiles/" + user.uid)
    await uploadBytes(storageRef, file)
    return await getDownloadURL(storageRef)
  }

  async function saveProfile() {
    try {
      let photoURL = ""

      if (photoFile) {
        photoURL = await uploadPhoto(photoFile)
      }

      await setDoc(doc(db, "profiles", user.uid), {
        uid: user.uid,
        ...profileData,
        photo: photoURL
      })

      loadProfiles()
      setStep("app")
    } catch (err) {
      console.log(err)
      alert(err.message)
    }
  }

  /* ---------------- LOADERS ---------------- */

  async function loadProfiles() {
    try {
      const snap = await getDocs(collection(db, "profiles"))
      const data = snap.docs.map((d) => d.data())
      setProfiles(data.filter((p) => p.uid !== user?.uid))
    } catch (e) {
      console.log(e)
    }
  }

  async function loadMatches() {
    try {
      const snap = await getDocs(collection(db, "matches"))
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data()
      }))

      setMatches(
        data.filter((m) => m.users.includes(user?.uid))
      )
    } catch (e) {
      console.log(e)
    }
  }

  /* ---------------- CHAT ---------------- */

  useEffect(() => {
    if (!activeChat) return

    const unsub = onSnapshot(
      doc(db, "chats", activeChat),
      (snap) => {
        if (snap.exists()) {
          setMessages(snap.data().messages || [])
        }
      }
    )

    return () => unsub()
  }, [activeChat])

  async function sendMessage() {
    if (!message.trim() || !activeChat) return

    const chatRef = doc(db, "chats", activeChat)
    const snap = await getDoc(chatRef)

    const oldMessages = snap.data()?.messages || []

    await setDoc(chatRef, {
      ...snap.data(),
      messages: [
        ...oldMessages,
        {
          text: message,
          sender: user.uid,
          createdAt: Date.now()
        }
      ]
    })

    setMessage("")
  }

  /* ---------------- MATCHING ---------------- */

  const current = profiles[index]

  function nextProfile() {
    setIndex((prev) => prev + 1)
    x.set(0)
  }

  async function likeProfile(target) {
    await addDoc(collection(db, "likes"), {
      from: user.uid,
      to: target.uid
    })

    const snap = await getDocs(collection(db, "likes"))

    const matchExists = snap.docs.some(
      (d) =>
        d.data().from === target.uid &&
        d.data().to === user.uid
    )

    if (matchExists) {
      const chatRef = await addDoc(collection(db, "chats"), {
        users: [user.uid, target.uid],
        messages: []
      })

      await addDoc(collection(db, "matches"), {
        users: [user.uid, target.uid],
        chatId: chatRef.id
      })

      setMatchPopup(`You matched with ${target.name}`)
      loadMatches()
    }

    nextProfile()
  }

  const handlers = useSwipeable({
    onSwipedLeft: () => nextProfile(),
    onSwipedRight: () => current && likeProfile(current),
    trackMouse: true
  })

  /* ---------------- UI ---------------- */

  return (
    <div style={styles.app}>
      <div style={styles.container}>
        <h1 style={styles.logo}>PendoMatch</h1>

        {step === "auth" && (
          <div style={styles.card}>
            <input
              type="email"
              placeholder="Enter Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
            />

            <input
              type="password"
              placeholder="Create Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
            />

            <button onClick={signup} style={styles.signupBtn}>
              SIGN UP
            </button>

            <button onClick={login} style={styles.loginBtn}>
              Login
            </button>
          </div>
        )}

        {step === "profile" && (
          <div style={styles.card}>
            <h2>Create Profile</h2>

            <input
              placeholder="Name"
              style={styles.input}
              onChange={(e) =>
                setProfileData({ ...profileData, name: e.target.value })
              }
            />

            <input
              placeholder="Age"
              style={styles.input}
              onChange={(e) =>
                setProfileData({ ...profileData, age: e.target.value })
              }
            />

            <input
              placeholder="Gender"
              style={styles.input}
              onChange={(e) =>
                setProfileData({ ...profileData, gender: e.target.value })
              }
            />

            <input
              placeholder="Looking For"
              style={styles.input}
              onChange={(e) =>
                setProfileData({ ...profileData, lookingFor: e.target.value })
              }
            />

            <textarea
              placeholder="Bio"
              style={styles.textarea}
              onChange={(e) =>
                setProfileData({ ...profileData, bio: e.target.value })
              }
            />

            <input type="file" onChange={(e) => setPhotoFile(e.target.files[0])} />

            <button style={styles.signupBtn} onClick={saveProfile}>
              Save Profile
            </button>
          </div>
        )}

        {step === "app" && (
          <>
            {!isSubscribed && (
              <div style={styles.paywall}>
                <h2>Subscription Required</h2>
              </div>
            )}

            {isSubscribed && current && (
              <motion.div {...handlers} style={{ ...styles.swipeCard, x, rotate }}>
                <img src={current.photo} style={styles.image} />
                <h2>{current.name}</h2>
                <p>{current.bio}</p>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

/* ---------------- STYLES ---------------- */

const styles = {
  app: { minHeight: "100vh", background: "#f3f4f6", padding: 20, fontFamily: "Arial" },
  container: { maxWidth: 450, margin: "0 auto" },
  logo: { textAlign: "center", marginBottom: 20, color: "#111827" },
  card: { background: "#fff", padding: 20, borderRadius: 14 },
  input: { width: "100%", padding: 14, marginBottom: 12 },
  signupBtn: { width: "100%", padding: 16, background: "#ff2d55", color: "#fff" },
  loginBtn: { width: "100%", padding: 14, background: "#4f46e5", color: "#fff" },
  swipeCard: { background: "#fff", padding: 14, marginTop: 20 },
  image: { width: "100%" },
  paywall: { background: "#fff", padding: 20, marginTop: 20 }
}