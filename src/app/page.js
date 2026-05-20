"use client";
import { useState } from "react";
import { auth } from "./firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

 const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // Sweeps them directly into the profile customization screen
      router.push("/onboarding");
    } catch (err) {
      switch (err.code) {
        case "auth/email-already-in-use":
          setError("This email is already on our love radar! Try logging in.");
          break;
        case "auth/weak-password":
          setError("Make your password a bit stronger (at least 6 characters).");
          break;
        default:
          setError("The sparks missed this time. Please check your inputs and try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (err) {
      switch (err.code) {
        case "auth/email-already-in-use":
          setError("This email is already on our love radar! Try logging in.");
          break;
        case "auth/weak-password":
          setError("Make your password a bit stronger (at least 6 characters).");
          break;
        default:
          setError("The sparks missed this time. Please check your inputs and try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-rose-600 via-pink-500 to-orange-400 px-4 relative overflow-hidden">
      
      {/* Decorative blurred backdrops for luxury aesthetic */}
      <div className="absolute w-96 h-96 bg-purple-400 rounded-full blur-3xl opacity-30 -top-20 -left-20" />
      <div className="absolute w-96 h-96 bg-amber-300 rounded-full blur-3xl opacity-30 -bottom-20 -right-20" />

      <div className="w-full max-w-md space-y-6 bg-white/95 backdrop-blur-lg p-8 rounded-3xl shadow-2xl border border-white/40 relative z-10">
        
        {/* Dynamic 3D Flaming Arrow Heart Logo Component */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="relative w-28 h-28 filter drop-shadow-[0_10px_15px_rgba(244,63,94,0.4)] animate-pulse">
            <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <defs>
                {/* 3D Heart Metallic Gradient */}
                <radialGradient id="3dHeart" cx="40%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#ff758c" />
                  <stop offset="50%" stopColor="#ff7eb3" />
                  <stop offset="85%" stopColor="#e11d48" />
                  <stop offset="100%" stopColor="#9f1239" />
                </radialGradient>
                {/* Arrow Flame Gradient */}
                <linearGradient id="flameGrad" x1="0%" y1="50%" x2="100%" y2="50%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0" />
                  <stop offset="40%" stopColor="#ef4444" />
                  <stop offset="80%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#facc15" />
                </linearGradient>
                {/* Shadow for depth overlay */}
                <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
                  <feDropShadow dx="2" dy="5" stdDeviation="4" floodColor="#4c0519" floodOpacity="0.4"/>
                </filter>
              </defs>

              {/* Behind-Heart Flame Trail */}
              <path d="M 10,130 C 40,115 70,110 95,105" stroke="url(#flameGrad)" strokeWidth="12" strokeLinecap="round" />
              <path d="M 5,125 C 35,120 65,112 90,108" stroke="#facc15" strokeWidth="4" strokeLinecap="round" opacity="0.8" />

              {/* The 3D Master Heart Body */}
              <path d="M 100,60 C 80,20 20,25 20,75 C 20,120 75,155 100,175 C 125,155 180,120 180,75 C 180,25 120,20 100,60 Z" fill="url(#3dHeart)" filter="url(#shadow)" />

              {/* Glowing Arrow Shaft Piercing Outward */}
              <path d="M 90,105 L 175,70" stroke="#f8fafc" strokeWidth="8" strokeLinecap="round" filter="url(#shadow)" />
              <path d="M 105,100 L 165,75" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />

              {/* Arrow Golden Tip */}
              <path d="M 170,65 L 185,65 L 180,80 Z" fill="#fbbf24" stroke="#f59e0b" strokeWidth="2" strokeJoin="round" />

              {/* Foreground Flaming Aura/Sparkle on impact */}
              <circle cx="95" cy="103" r="7" fill="#ffff00" className="animate-ping" />
              <circle cx="95" cy="103" r="4" fill="#ffffff" />
            </svg>
          </div>

          <h2 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-pink-500 to-orange-500 mt-2">
            PendoMatch
          </h2>
          <p className="text-xs font-semibold uppercase tracking-widest text-orange-500 mt-0.5">
            PendoMatch.com
          </p>
          <p className="mt-1 text-sm font-medium text-slate-500">Ignite your true connection</p>
        </div>

        {/* Messaging Box */}
        {error && (
          <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-xl text-xs font-medium text-rose-700 animate-bounce">
            <p className="font-bold">Matchmaker Note 💌</p>
            <p>{error}</p>
          </div>
        )}

        {/* Input Form Fields */}
        <form className="space-y-4" onSubmit={handleSignup}>
          <div>
            <label className="block text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              disabled={isLoading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:ring-2 focus:ring-rose-400 outline-none transition bg-white"
              placeholder="you@lovemail.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">
              Choose Password
            </label>
            <input
              type="password"
              required
              disabled={isLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:ring-2 focus:ring-rose-400 outline-none transition bg-white"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-rose-500 via-pink-500 to-orange-500 hover:opacity-95 text-white font-extrabold py-3.5 px-4 rounded-xl shadow-lg transform active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm tracking-wide"
          >
            {isLoading ? "Styling your profile..." : "FIND YOUR MATCH 🔥"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          Already a member?{" "}
          <Link href="/login" className="font-bold text-rose-500 hover:text-orange-500 transition">
            Sign In & Reconnect
          </Link>
        </p>
      </div>
    </div>
  );
}