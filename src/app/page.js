"use client";
import { useState } from "react";
import { auth } from "./firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (err) {
      setError("Registration failed: " + err.message);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 relative overflow-hidden">
      <div className="absolute w-[500px] h-[500px] bg-rose-500/10 rounded-full blur-[120px] -top-40 -right-20" />
      <div className="w-full max-w-sm bg-slate-900/60 backdrop-blur-2xl p-8 rounded-3xl border border-slate-800 shadow-2xl z-10">
        <div className="flex flex-col items-center mb-8">
          <svg width="80" height="80" viewBox="0 0 200 200" className="drop-shadow-[0_0_20px_rgba(244,63,94,0.6)]">
            <path d="M100,60 C80,20 20,25 20,75 C20,120 75,155 100,175 C125,155 180,120 180,75 C180,25 120,20 100,60 Z" fill="#e11d48" />
            <path d="M90,105 L175,70" stroke="#fff" strokeWidth="8" strokeLinecap="round" />
            <path d="M170,65 L185,65 L180,80 Z" fill="#fbbf24" />
          </svg>
          <h1 className="text-2xl font-black text-white mt-4 tracking-tighter">PendoMatch</h1>
        </div>
        
        {error && <p className="text-rose-400 text-xs mb-4 text-center">{error}</p>}
        
        <form onSubmit={handleSignup} className="space-y-4">
          <input type="email" required placeholder="Email Address" onChange={(e) => setEmail(e.target.value)} 
                 className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 outline-none focus:border-rose-500" />
          <input type="password" required placeholder="Choose Password" onChange={(e) => setPassword(e.target.value)} 
                 className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 outline-none focus:border-rose-500" />
          <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-rose-500 to-pink-600 py-3 rounded-xl font-black text-white shadow-lg shadow-rose-900/50 hover:opacity-90 transition">
            {isLoading ? "CREATING ACCOUNT..." : "START MATCHING"}
          </button>
        </form>
        <p className="text-center text-xs text-slate-500 mt-6">Already a member? <Link href="/login" className="text-rose-400 font-bold">Sign In</Link></p>
      </div>
    </div>
  );
}