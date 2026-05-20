"use client";
import { useState } from "react";
import { auth } from "../firebase";
import { 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail, 
  setPersistence, 
  browserLocalPersistence, 
  browserSessionPersistence 
} from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true); // Defaults to checked for smooth mobile entry
  const [message, setMessage] = useState({ text: "", type: "" });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: "", type: "" });

    try {
      // Configure Firebase session retention type based on user checkbox choice
      const persistenceType = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistenceType);
      
      // Complete secure sign-in process
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (err) {
      console.error("Authentication check block break:", err);
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
        text: "Please type your email address first so we know where to send the recovery link!", 
        type: "error" 
      });
      return;
    }
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage({ 
        text: "💌 Reset link dispatched! Check your inbox to update your password.", 
        type: "success" 
      });
    } catch (err) {
      setMessage({ text: "Failed to send password reset link. Please try again.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-slate-950 via-slate-900 to-rose-950 px-4 relative overflow-hidden">
      {/* High-end ambient glow circles */}
      <div className="absolute w-[500px] h-[500px] bg-rose-500/10 rounded-full blur-[120px] -top-40 -right-20 pointer-events-none" />
      <div className="absolute w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] -bottom-40 -left-20 pointer-events-none" />
      
      <div className="w-full max-w-md space-y-6 bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] border border-slate-800 relative z-10">
        
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 filter drop-shadow-[0_4px_12px_rgba(244,63,94,0.3)]">
            <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <defs>
                <radialGradient id="loginHeart" cx="40%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#ff758c" />
                  <stop offset="100%" stopColor="#e11d48" />
                </radialGradient>
              </defs>
              <path d="M 100,60 C 80,20 20,25 20,75 C 20,120 75,155 100,175 C 125,155 180,120 180,75 C 180,25 120,20 100,60 Z" fill="url(#loginHeart)" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-white mt-3 tracking-tight">Welcome Back</h2>
          <p className="text-xs font-bold text-rose-500 tracking-widest uppercase mt-0.5">PendoMatch.com</p>
        </div>

        {message.text && (
          <div className={`p-4 rounded-xl text-xs font-semibold border-l-4 ${
            message.type === "success" 
              ? "bg-emerald-950/40 border-emerald-500 text-emerald-400" 
              : "bg-rose-950/40 border-rose-500 text-rose-400"
          }`}>
            <p>{message.text}</p>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              disabled={isLoading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition text-sm font-medium"
              placeholder="you@lovemail.com"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Password
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={isLoading}
                className="text-[10px] font-bold text-rose-400 hover:text-rose-300 transition outline-none"
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
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition text-sm font-medium"
              placeholder="••••••••"
            />
          </div>

          {/* Premium Branded Remember Me Toggle Link System */}
          <div className="flex items-center justify-between pt-1 select-none">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                disabled={isLoading}
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-rose-500 focus:ring-0 focus:ring-offset-0 outline-none accent-rose-500 cursor-pointer"
              />
              <span className="text-xs font-medium text-slate-400 group-hover:text-slate-300 transition">
                Keep me logged in
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:opacity-95 text-white font-black py-3.5 px-4 rounded-xl shadow-lg transition text-sm tracking-wide transform active:scale-[0.99] mt-2"
          >
            {isLoading ? "Verifying..." : "ENTER PENDOMATCH 💖"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400">
          New here?{" "}
          <Link href="/" className="font-bold text-rose-400 hover:text-rose-300 transition">
            Create an Account
          </Link>
        </p>
      </div>
    </div>
  );
}