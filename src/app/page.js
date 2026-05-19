```jsx
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
  apiKey: "AIzaSyADc9iLS4oeubdeDfnccCiUN5gzzzLxeg",
  authDomain: "mingle-bff25.firebaseapp.com",
  projectId: "mingle-bff25",
 storageBucket: "mingle-bff25.appspot.com",
  messagingSenderId: "837882207909",
  appId: "1:837882207909:web:3841ee712f9a0da4cd774c"
}

const app = initializeApp(firebaseConfig)

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
      const res = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      )

      setUser(res.user)

      await setDoc(doc(db, "subscriptions", res.user.uid), {
        premium: false
      })

      setStep("profile")
    } catch (err) {
      alert(err.message)
    }
  }

  async function login() {
  if (!email || !password) {
  alert("Email and password required")
  return
}
    try {
      const res = await signInWithEmailAndPassword(
        auth,
        email,
        password
      )

      setUser(res.user)

      await checkSubscription(res.user.uid)

      setStep("app")

      loadProfiles()
      loadMatches()
   catch (err) {
  console.log("LOGIN ERROR:", err.code, err.message)
  alert(err.message)
}
  }

  async function checkSubscription(uid) {
    const snap = await getDoc(doc(db, "subscriptions", uid))

    if (snap.exists()) {
      setIsSubscribed(snap.data().premium)
    }
  }

  /* ---------------- PROFILE ---------------- */

  async function uploadPhoto(file) {
    const storageRef = ref(storage, `profiles/${user.uid}`)

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
      alert(err.message)
    }
  }

  /* ---------------- LOADERS ---------------- */

  async function loadProfiles() {
    const snap = await getDocs(collection(db, "profiles"))

    const data = snap.docs.map((d) => d.data())

    setProfiles(data.filter((p) => p.uid !== user?.uid))
  }

  async function loadMatches() {
    const snap = await getDocs(collection(db, "matches"))

    const data = snap.docs.map((d) => ({
      id: d.id,
      ...d.data()
    }))

    setMatches(
      data.filter((m) => m.users.includes(user?.uid))
    )
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
    if (!message.trim()) return

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
    onSwipedRight: () => likeProfile(current),
    trackMouse: true
  })

  /* ---------------- UI ---------------- */

  return (
    <div style={styles.app}>
      <div style={styles.container}>
        <h1 style={styles.logo}>PendoMatch</h1>

        {/* AUTH */}

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

            <button
              onClick={signup}
              style={styles.signupBtn}
            >
              SIGN UP
            </button>

            <button
              onClick={login}
              style={styles.loginBtn}
            >
              Login
            </button>
          </div>
        )}

        {/* PROFILE */}

        {step === "profile" && (
          <div style={styles.card}>
            <h2>Create Profile</h2>

            <input
              placeholder="Name"
              style={styles.input}
              onChange={(e) =>
                setProfileData({
                  ...profileData,
                  name: e.target.value
                })
              }
            />

            <input
              placeholder="Age"
              style={styles.input}
              onChange={(e) =>
                setProfileData({
                  ...profileData,
                  age: e.target.value
                })
              }
            />

            <input
              placeholder="Gender"
              style={styles.input}
              onChange={(e) =>
                setProfileData({
                  ...profileData,
                  gender: e.target.value
                })
              }
            />

            <input
              placeholder="Looking For"
              style={styles.input}
              onChange={(e) =>
                setProfileData({
                  ...profileData,
                  lookingFor: e.target.value
                })
              }
            />

            <textarea
              placeholder="Bio"
              style={styles.textarea}
              onChange={(e) =>
                setProfileData({
                  ...profileData,
                  bio: e.target.value
                })
              }
            />

            <input
              type="file"
              onChange={(e) =>
                setPhotoFile(e.target.files[0])
              }
            />

            <button
              style={styles.signupBtn}
              onClick={saveProfile}
            >
              Save Profile
            </button>
          </div>
        )}

        {/* APP */}

        {step === "app" && (
          <>
            {!isSubscribed && (
              <div style={styles.paywall}>
                <h2>Subscription Required</h2>

                <p>
                  Subscribe to unlock messaging and
                  premium features.
                </p>

                <button style={styles.signupBtn}>
                  Subscribe
                </button>
              </div>
            )}

            {isSubscribed && current && (
              <motion.div
                {...handlers}
                style={{
                  ...styles.swipeCard,
                  x,
                  rotate
                }}
              >
                <img
                  src={current.photo}
                  alt=""
                  style={styles.image}
                />

                <h2>{current.name}</h2>

                <p>{current.bio}</p>
              </motion.div>
            )}

            {/* MATCHES */}

            <div style={styles.matchesBox}>
              <h3>Matches</h3>

              {matches.map((m) => (
                <button
                  key={m.id}
                  style={styles.matchBtn}
                  onClick={() =>
                    setActiveChat(m.chatId)
                  }
                >
                  Open Chat
                </button>
              ))}
            </div>

            {/* CHAT */}

            {activeChat && (
              <div style={styles.chatBox}>
                <h3>Chat</h3>

                <div style={styles.messages}>
                  {messages.map((m, i) => (
                    <div key={i} style={styles.msg}>
                      {m.text}
                    </div>
                  ))}
                </div>

                <input
                  placeholder="Type message"
                  value={message}
                  onChange={(e) =>
                    setMessage(e.target.value)
                  }
                  style={styles.input}
                />

                <button
                  onClick={sendMessage}
                  style={styles.signupBtn}
                >
                  Send
                </button>
              </div>
            )}
          </>
        )}

        {/* MATCH POPUP */}

        {matchPopup && (
          <div style={styles.popupOverlay}>
            <div style={styles.popup}>
              <h2>{matchPopup}</h2>

              <button
                style={styles.signupBtn}
                onClick={() =>
                  setMatchPopup("")
                }
              >
                Continue
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ---------------- STYLES ---------------- */

const styles = {
  app: {
    minHeight: "100vh",
    background: "#f3f4f6",
    padding: 20,
    fontFamily: "Arial"
  },

  container: {
    maxWidth: 450,
    margin: "0 auto"
  },

  logo: {
    textAlign: "center",
    marginBottom: 20,
    color: "#111827"
  },

  card: {
    background: "#ffffff",
    padding: 20,
    borderRadius: 14,
    boxShadow: "0 0 10px rgba(0,0,0,0.1)"
  },

  input: {
    width: "100%",
    padding: 14,
    marginBottom: 12,
    borderRadius: 10,
    border: "1px solid #ccc",
    background: "#ffffff",
    color: "#000000",
    fontSize: 16,
    outline: "none"
  },

  textarea: {
    width: "100%",
    minHeight: 100,
    padding: 14,
    marginBottom: 12,
    borderRadius: 10,
    border: "1px solid #ccc",
    background: "#ffffff",
    color: "#000000",
    fontSize: 16
  },

  signupBtn: {
    width: "100%",
    padding: 16,
    background: "#ff2d55",
    color: "#ffffff",
    border: "none",
    borderRadius: 10,
    fontSize: 18,
    fontWeight: "bold",
    cursor: "pointer",
    marginBottom: 12
  },

  loginBtn: {
    width: "100%",
    padding: 14,
    background: "#4f46e5",
    color: "#ffffff",
    border: "none",
    borderRadius: 10,
    fontSize: 16,
    fontWeight: "bold",
    cursor: "pointer"
  },

  swipeCard: {
    background: "#ffffff",
    borderRadius: 16,
    padding: 14,
    marginTop: 20
  },

  image: {
    width: "100%",
    borderRadius: 14,
    marginBottom: 10
  },

  paywall: {
    background: "#ffffff",
    padding: 20,
    borderRadius: 14,
    marginTop: 20
  },

  matchesBox: {
    background: "#ffffff",
    padding: 20,
    borderRadius: 14,
    marginTop: 20
  },

  matchBtn: {
    width: "100%",
    padding: 12,
    marginBottom: 10
  },

  chatBox: {
    background: "#ffffff",
    padding: 20,
    borderRadius: 14,
    marginTop: 20
  },

  messages: {
    maxHeight: 250,
    overflowY: "auto",
    marginBottom: 12
  },

  msg: {
    background: "#f3f4f6",
    padding: 10,
    borderRadius: 8,
    marginBottom: 8
  },

  popupOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  popup: {
    background: "#ffffff",
    padding: 30,
    borderRadius: 16
  }
}
```
