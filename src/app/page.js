"use client";
import { useState } from "react";
import { auth, db } from "./firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: "", password: "", location: "", gender: "", dob: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ text: "", type: "" });
  const router = useRouter();

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(false);
    setStatusMessage({ text: "", type: "" });

    // 1. STABILIZE EMAIL STRINGS (Trims mobile keyboard trailing spaces to fix the tester's crash)
    const cleanEmail = formData.email.trim();
    
    if (!cleanEmail || !formData.password) {
      setStatusMessage({ text: "❌ Please fill out your email and password completely.", type: "error" });
      return;
    }

    if (!formData.gender) {
      setStatusMessage({ text: "❌ Please select your gender to continue.", type: "error" });
      return;
    }

    setIsLoading(true);
    try {
      // 2. RUN ACCOUNTS ENGINE
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, formData.password);
      
      // 3. SECURE PROVISIONING (Guarantees no "Anonymous" user placeholders show up on dashboard)
      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        displayName: "New Matcher", 
        email: cleanEmail,
        location: formData.location,
        gender: formData.gender,
        dob: formData.dob,
        bio: "No bio yet.",
        country: formData.location || "Not specified",
        tier: "free",
        profileComplete: false,
        createdAt: new Date()
      });
      
      // 4. ROUTE CASE RECTIFICATION (Routes directly to capitalized folder /Onboarding to bypass 404)
      router.push("/Onboarding");
    } catch (err) { 
      console.error("Auth Engine Crash Trace: ", err.code, err.message);
      
      // 5. THE POLITE ALERT INSTANCE
      if (err.code === "auth/email-already-in-use") {
        setStatusMessage({ 
          text: "💌 It looks like you already have an account with us! Click 'Sign In' at the bottom to access your profile instantly.", 
          type: "error" 
        });
      } else if (err.code === "auth/weak-password") {
        setStatusMessage({ text: "❌ Security Notice: Password should be at least 6 characters.", type: "error" });
      } else if (err.code === "auth/invalid-email") {
        setStatusMessage({ text: "❌ The email address layout is malformed. Please verify.", type: "error" });
      } else {
        setStatusMessage({ text: `❌ Setup error: ${err.message}`, type: "error" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 relative overflow-hidden">
      <div className="absolute w-[500px] h-[500px] bg-rose-500/5 rounded-full blur-[120px] -top-40 -right-20 pointer-events-none" />
      
      <div className="w-full max-w-sm bg-slate-900/60 backdrop-blur-2xl p-8 rounded-3xl border border-slate-800 shadow-2xl relative z-10">
        <h1 className="text-2xl font-black text-white mb-2 text-center">Create PendoMatch</h1>
        <p className="text-center text-[10px] font-bold text-rose-500 tracking-widest uppercase mb-6">PendoMatch.com</p>
        
        {statusMessage.text && (
          <div className={`p-4 rounded-xl text-xs font-semibold mb-4 border-l-4 ${
            statusMessage.type === "success" ? "bg-emerald-950/40 border-emerald-500 text-emerald-400" : "bg-rose-950/40 border-rose-500 text-rose-400"
          }`}>
            {statusMessage.text}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <input 
            type="email" required placeholder="Email Address" 
            onChange={(e) => setFormData({...formData, email: e.target.value})} 
            className="w-full px-4 py-3 bg-slate-950 border border-slate-700 focus:border-rose-500 rounded-xl text-white outline-none transition text-sm" 
          />
          <input 
            type="password" required placeholder="Password" 
            onChange={(e) => setFormData({...formData, password: e.target.value})} 
            className="w-full px-4 py-3 bg-slate-950 border border-slate-700 focus:border-rose-500 rounded-xl text-white outline-none transition text-sm" 
          />
          
          <input 
            type="text" required placeholder="City/Location (e.g. Nairobi)" 
            onChange={(e) => setFormData({...formData, location: e.target.value})} 
            className="w-full px-4 py-3 bg-slate-950 border border-slate-700 focus:border-rose-500 rounded-xl text-white outline-none transition text-sm" 
          />
          
          {/* Gender Selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-500 uppercase font-bold ml-2">I identify as</label>
            <div className="grid grid-cols-2 gap-4">
              <button 
                type="button" 
                onClick={() => setFormData({...formData, gender: 'Male'})} 
                className={`py-3 rounded-xl font-bold transition text-xs ${formData.gender === 'Male' ? 'bg-rose-600 text-white' : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'}`}
              >
                Male
              </button>
              <button 
                type="button" 
                onClick={() => setFormData({...formData, gender: 'Female'})} 
                className={`py-3 rounded-xl font-bold transition text-xs ${formData.gender === 'Female' ? 'bg-rose-600 text-white' : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'}`}
              >
                Female
              </button>
            </div>
          </div>

          {/* Date of Birth Picker */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-500 uppercase font-bold ml-2">Date of Birth</label>
            <input 
              type="date" required 
              onChange={(e) => setFormData({...formData, dob: e.target.value})} 
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 focus:border-rose-500 rounded-xl text-white outline-none transition text-sm text-slate-300" 
            />
          </div>

          {/* Mandatory Legal Checkbox */}
          <label className="flex items-start gap-3 mt-4 text-[10px] text-slate-500 cursor-pointer select-none">
            <input type="checkbox" required className="mt-0.5 accent-rose-500 w-3.5 h-3.5 rounded" />
            <span className="leading-relaxed">
              I agree to the <Link href="/terms" target="_blank" className="text-rose-500 underline font-semibold">Terms and Conditions</Link> and consent to the sharing of my data with third-party partners.
            </span>
          </label>

          <button 
            type="submit" disabled={isLoading} 
            className="w-full bg-gradient-to-r from-rose-500 to-pink-600 py-3.5 rounded-xl font-black text-white text-xs tracking-wider uppercase mt-4 transition transform active:scale-[0.99] disabled:opacity-50"
          >
            {isLoading ? "CREATING PROFILE..." : "START MATCHING 💖"}
          </button>
        </form>
        
        <p className="text-center text-xs text-slate-400 mt-6 font-medium">
          Already a member? <Link href="/login" className="text-rose-400 font-bold hover:text-rose-300 underline transition ml-1">Sign In</Link>
        </p>
      </div>
    </div>
  );
}