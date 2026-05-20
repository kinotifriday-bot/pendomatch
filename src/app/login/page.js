"use client";
import { useState } from "react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" }); // Handles both errors and success alerts
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: "", type: "" });

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (err) {
      setMessage({ 
        text: "We couldn't find a match for that email or password. Please verify your details.", 
        type: "error" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setMessage({ 
        text: "Please type your email address into the input field first so we know where to send the recovery link!", 
        type: "error" 
      });
      return;
    }

    setIsLoading(true);
    setMessage({ text: "", type: "" });

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage({ 
        text: "💌 Reset link dispatched! Check your email inbox (and spam folder) to update your password.", 
        type: "success" 
      });
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        setMessage({ text: "This email address is not registered on PendoMatch.", type: "error" });
      } else {
        setMessage({ text: "Failed to send password reset link. Please try again.", type: "error" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-purple-700 via-pink-600 to-rose-500 px-4 relative overflow-hidden">
      <div className="absolute w-96 h-96 bg-rose-400 rounded-full blur-3xl opacity-20 -top-20 -right-20" />
      
      <div className="w-full max-w-md space-y-6 bg-white/95 backdrop-blur-lg p-8 rounded-3xl shadow-2xl border border-white/20 relative z-10">
        
        <div className="flex flex-col items-center justify-center text-center">
          {/* Linked 3D Logo Layout */}
          <div className="w-20 h-20 filter drop-shadow-[0_8px_10px_rgba(219,39,119,0.4)]">
            <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <defs>
                <radialGradient id="loginHeart" cx="40%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#f472b6" />
                  <stop offset="100%" stopColor="#be185d" />
                </radialGradient>
                <linearGradient id="flame" x1="0%" y1="50%" x2="100%" y2="50%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0" />
                  <stop offset="100%" stopColor="#d946ef" />
                </linearGradient>
              </defs>
              <path d="M 10,130 C 40,115 70,110 95,105" stroke="url(#flame)" strokeWidth="12" strokeLinecap="round" />
              <path d="M 100,60 C 80,20 20,25 20,75 C 20,120 75,155 100,175 C 125,155 180,120 180,75 C 180,25 120,20 100,60 Z" fill="url(#loginHeart)" />
              <path d="M 90,105 L 175,70" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" />
              <path d="M 170,65 L 185,65 L 180,80 Z" fill="#fbbf24" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-black text-slate-900 mt-2">Welcome Back</h2>
          <p className="text-xs font-semibold text-pink-600 tracking-wider uppercase">PendoMatch.com</p>
        </div>

        {/* Unified Status Message Banner */}
        {message.text && (
          <div className={`p-3 rounded-xl text-xs font-medium border-l-4 ${
            message.type === "success" 
              ? "bg-emerald-50 border-emerald-500 text-emerald-800" 
              : "bg-rose-50 border-rose-500 text-rose-700"
          }`}>
            <p>{message.text}</p>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              disabled={isLoading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none transition"
              placeholder="you@lovemail.com"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={isLoading}
                className="text-[11px] font-bold text-rose-500 hover:text-purple-600 transition outline-none"
              >
                Forgot Password?
              </button>
            </div>
            <input
              type="password"
              required
              disabled={isLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-95 text-white font-extrabold py-3.5 px-4 rounded-xl shadow-lg transition text-sm tracking-wide"
          >
            {isLoading ? "Processing..." : "ENTER PENDOMATCH 💖"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          New here?{" "}
          <Link href="/" className="font-bold text-pink-500 hover:text-purple-600 transition">
            Create an Account
          </Link>
        </p>
      </div>
    </div>
  );
}