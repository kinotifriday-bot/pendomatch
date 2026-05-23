"use client";
import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  sendPasswordResetEmail, 
  setPersistence, 
  browserLocalPersistence, 
  browserSessionPersistence 
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [loginMethod, setLoginMethod] = useState("email"); // "email" or "phone"
  const [isNewUser, setIsNewUser] = useState(false); // Controls the mode toggle
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Phone Authentication States
  const [countryCode, setCountryCode] = useState("+254"); 
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);

  const [rememberMe, setRememberMe] = useState(true); 
  const [message, setMessage] = useState({ text: "", type: "" });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined" && !window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {}
        });
      } catch (err) {
        console.error("reCAPTCHA failure:", err);
      }
    }
  }, []);

  // Evaluates user state and routes them safely to prevent 404 loops
  const handleUserRouting = async (user) => {
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists() && userDoc.data()?.profileComplete) {
      router.push("/dashboard");
    } else {
      router.push("/onboarding");
    }
  };

  const provisionUserInFirestore = async (user) => {
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        displayName: user.displayName || "New Matcher",
        email: user.email || `${user.phoneNumber}@pendomatch.com`,
        tier: "free",
        country: "Not set",
        bio: "No bio yet.",
        profileComplete: false
      });
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: "", type: "" });

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setMessage({ text: "❌ Please fill in both email and password fields.", type: "error" });
      setIsLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setMessage({ text: "❌ Please enter a valid email address structure (e.g. name@example.com).", type: "error" });
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setMessage({ text: "❌ Security requirement: Password must be at least 6 characters.", type: "error" });
      setIsLoading(false);
      return;
    }

    try {
      const persistenceType = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistenceType);
      
      if (isNewUser) {
        try {
          const newCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
          await provisionUserInFirestore(newCredential.user);
          await handleUserRouting(newCredential.user);
        } catch (registerError) {
          // INTERCEPT KNOWN USER REGISTRATION ATTEMPTS
          if (registerError.code === "auth/email-already-in-use") {
            console.log("Existing user tried to register. Redirecting to clean sign-in cascade...");
            
            // Log them in automatically with the password provided instead of blocking them!
            const loginCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
            setMessage({ 
              text: "💌 Welcome back! You already have an account setup with us. Signing you in smoothly...", 
              type: "success" 
            });
            
            setTimeout(async () => {
              await handleUserRouting(loginCredential.user);
            }, 1500);
          } else {
            throw registerError;
          }
        }
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
        await provisionUserInFirestore(userCredential.user);
        await handleUserRouting(userCredential.user);
      }
    } catch (err) {
      console.error("Firebase Auth Error: ", err.code, err.message);
      let errorText = "Authentication failed. Please check your details.";
      
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        errorText = "❌ We couldn't find a match for that email or password. Please verify your details.";
      } else if (err.code === "auth/invalid-email") {
        errorText = "❌ The email format is invalid. Please double check.";
      }
      
      setMessage({ text: errorText, type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setMessage({ text: "", type: "" });
    const provider = new GoogleAuthProvider();
    
    try {
      const persistenceType = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistenceType);
      
      const result = await signInWithPopup(auth, provider);
      await provisionUserInFirestore(result.user);
      await handleUserRouting(result.user);
    } catch (err) {
      console.error(err);
      setMessage({ text: "Google Sign-In was cancelled or rejected.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phoneNumber) return;
    setIsLoading(true);
    setMessage({ text: "", type: "" });

    const fullNumber = `${countryCode}${phoneNumber.trim().replace(/^0+/, '')}`;

    try {
      const appVerifier = window.recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(auth, fullNumber, appVerifier);
      setConfirmationResult(confirmation);
      setMessage({ text: "📲 Verification code SMS sent! Check your phone.", type: "success" });
    } catch (err) {
      console.error(err);
      setMessage({ text: "Failed to send SMS pin. Verify your number layout format.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!verificationCode || !confirmationResult) return;
    setIsLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const result = await confirmationResult.confirm(verificationCode);
      await provisionUserInFirestore(result.user);
      await handleUserRouting(result.user);
    } catch (err) {
      console.error(err);
      setMessage({ text: "Incorrect or expired SMS verification code.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setMessage({ text: "Please type your email address first so we know where to send the recovery link!", type: "error" });
      return;
    }
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setMessage({ text: "💌 Reset link dispatched! Check your inbox.", type: "success" });
    } catch (err) {
      setMessage({ text: "Failed to send password reset link. Please try again.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-slate-950 via-slate-900 to-rose-950 px-4 relative overflow-hidden">
      <div id="recaptcha-container"></div>
      <div className="absolute w-[500px] h-[500px] bg-rose-500/10 rounded-full blur-[120px] -top-40 -right-20 pointer-events-none" />
      <div className="absolute w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] -bottom-40 -left-20 pointer-events-none" />
      
      <div className="w-full max-w-md space-y-5 bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] border border-slate-800 relative z-10">
        
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 filter drop-shadow-[0_4px_12px_rgba(244,63,94,0.3)]">
            <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <radialGradient id="loginHeart" cx="40%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#ff758c" />
                <stop offset="100%" stopColor="#e11d48" />
              </radialGradient>
              <path d="M 100,60 C 80,20 20,25 20,75 C 20,120 75,155 100,175 C 125,155 180,120 180,75 C 180,25 120,20 100,60 Z" fill="url(#loginHeart)" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-white mt-2 tracking-tight">
            {isNewUser ? "Create Account" : "Welcome Back"}
          </h2>
          <p className="text-[10px] font-bold text-rose-500 tracking-widest uppercase mt-0.5">PendoMatch.com</p>
        </div>

        {/* Tab switch between email and phone */}
        <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800/60">
          <button 
            type="button"
            onClick={() => { setLoginMethod("email"); setMessage({text:"", type:""}); }}
            className={`py-2 text-xs font-bold rounded-lg transition ${loginMethod === "email" ? "bg-rose-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
          >
            Email Address
          </button>
          <button 
            type="button"
            onClick={() => { setLoginMethod("phone"); setMessage({text:"", type:""}); }}
            className={`py-2 text-xs font-bold rounded-lg transition ${loginMethod === "phone" ? "bg-rose-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
          >
            Phone Number
          </button>
        </div>

        {message.text && (
          <div className={`p-3.5 rounded-xl text-xs font-semibold border-l-4 ${
            message.type === "success" ? "bg-emerald-950/40 border-emerald-500 text-emerald-400" : "bg-rose-950/40 border-rose-500 text-rose-400"
          }`}>
            <p>{message.text}</p>
          </div>
        )}

        {/* Email Login/Register Module */}
        {loginMethod === "email" && (
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
              <input
                type="email" required disabled={isLoading} value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:border-rose-500 outline-none transition text-sm"
                placeholder="you@lovemail.com"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
                {!isNewUser && (
                  <button type="button" onClick={handleForgotPassword} disabled={isLoading} className="text-[10px] font-bold text-rose-400 outline-none">Forgot Password?</button>
                )}
              </div>
              <input
                type="password" required disabled={isLoading} value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:border-rose-500 outline-none transition text-sm"
                placeholder="••••••••"
              />
            </div>

            <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-rose-500 to-pink-600 text-white font-black py-3 px-4 rounded-xl text-sm tracking-wide transform active:scale-[0.99] mt-2">
              {isLoading ? "Processing..." : isNewUser ? "CREATE ACCOUNT 💖" : "ENTER PENDOMATCH 💖"}
            </button>

            {/* Dynamic context link to switch modes */}
            <p className="text-center text-xs text-slate-400 pt-1">
              {isNewUser ? "Already have an account?" : "New to PendoMatch?"}{" "}
              <button 
                type="button" 
                onClick={() => { setIsNewUser(!isNewUser); setMessage({text:"", type:""}); }}
                className="font-bold text-rose-400 hover:text-rose-300 transition underline bg-transparent border-none p-0 cursor-pointer"
              >
                {isNewUser ? "Sign In Instead" : "Register Here"}
              </button>
            </p>
          </form>
        )}

        {/* Phone Login Module */}
        {loginMethod === "phone" && (
          <div className="space-y-4">
            {!confirmationResult ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Mobile Contact Info</label>
                  <div className="flex gap-2">
                    <select 
                      value={countryCode} 
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="px-3 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm outline-none focus:border-rose-500"
                    >
                      <option value="+254">KE (+254)</option>
                      <option value="+256">UG (+256)</option>
                      <option value="+255">TZ (+255)</option>
                      <option value="+1">US (+1)</option>
                      <option value="+44">UK (+44)</option>
                    </select>
                    <input
                      type="tel" required disabled={isLoading} value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
                      className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:border-rose-500 outline-none text-sm"
                      placeholder="712345678"
                    />
                  </div>
                </div>
                <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-rose-500 to-pink-600 text-white font-black py-3 px-4 rounded-xl text-sm tracking-wide">
                  {isLoading ? "Sending text..." : "DISPATCH ENTRY PIN 📲"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">6-Digit Verification Code</label>
                  <input
                    type="text" required maxLength={6} disabled={isLoading} value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-center font-black tracking-widest text-slate-100 focus:border-rose-500 outline-none text-base"
                    placeholder="000000"
                  />
                </div>
                <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black py-3 px-4 rounded-xl text-sm tracking-wide">
                  {isLoading ? "Validating..." : "VERIFY CODE & OPEN PROFILE 🔓"}
                </button>
                <button type="button" onClick={() => setConfirmationResult(null)} className="w-full text-center text-xs text-slate-500 font-bold hover:text-slate-400 transition">Change Phone Number</button>
              </form>
            )}
          </div>
        )}

        <div className="relative my-3 flex items-center justify-center">
          <div className="absolute w-full h-[1px] bg-slate-800" />
          <span className="relative px-3 bg-slate-900 text-[10px] font-black text-slate-500 uppercase tracking-widest z-10">or</span>
        </div>

        {/* Google Authentication */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-slate-950 border border-slate-800 hover:bg-slate-900/60 text-slate-200 font-bold py-3 px-4 rounded-xl text-xs transition"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center justify-between pt-1 select-none">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox" disabled={isLoading} checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-rose-500 focus:ring-0 accent-rose-500 cursor-pointer"
            />
            <span className="text-xs font-medium text-slate-400 group-hover:text-slate-300 transition">Keep me logged in</span>
          </label>
        </div>

      </div>
    </div>
  );
}