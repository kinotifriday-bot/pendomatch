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
  const router = useRouter();

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      
      // Store complete profile in Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        email: formData.email,
        location: formData.location,
        gender: formData.gender,
        dob: formData.dob,
        tier: "free",
        profileComplete: false,
        createdAt: new Date()
      });
      router.push("/onboarding");
    } catch (err) { 
      alert("Registration error: " + err.message); 
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
      <div className="w-full max-w-sm bg-slate-900/60 backdrop-blur-2xl p-8 rounded-3xl border border-slate-800 shadow-2xl">
        <h1 className="text-2xl font-black text-white mb-6 text-center">Create PendoMatch</h1>
        
        <form onSubmit={handleSignup} className="space-y-4">
          <input type="email" required placeholder="Email" onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white outline-none focus:border-rose-500" />
          <input type="password" required placeholder="Password" onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white outline-none focus:border-rose-500" />
          
          <input type="text" required placeholder="City/Location (e.g. Nairobi)" onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white outline-none focus:border-rose-500" />
          
          {/* Gender Selection */}
          <div className="grid grid-cols-2 gap-4">
            <button type="button" onClick={() => setFormData({...formData, gender: 'Male'})} className={`py-3 rounded-xl font-bold transition ${formData.gender === 'Male' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'}`}>Male</button>
            <button type="button" onClick={() => setFormData({...formData, gender: 'Female'})} className={`py-3 rounded-xl font-bold transition ${formData.gender === 'Female' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'}`}>Female</button>
          </div>

          {/* Date of Birth Picker */}
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 uppercase font-bold ml-2">Date of Birth</label>
            <input type="date" required onChange={(e) => setFormData({...formData, dob: e.target.value})} className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white" />
          </div>

          {/* Mandatory Legal Checkbox */}
          <label className="flex items-start gap-3 mt-4 text-[10px] text-slate-500 cursor-pointer">
            <input type="checkbox" required className="mt-0.5 accent-rose-500" />
            <span>
              I agree to the <Link href="/terms" target="_blank" className="text-rose-500 underline">Terms and Conditions</Link> and consent to the sharing of my data with third-party partners.
            </span>
          </label>

          <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-rose-500 to-pink-600 py-3 rounded-xl font-black text-white mt-4 transition hover:opacity-90">
            {isLoading ? "CREATING..." : "START MATCHING"}
          </button>
        </form>
        <p className="text-center text-xs text-slate-500 mt-6">Already a member? <Link href="/login" className="text-rose-400 font-bold">Sign In</Link></p>
      </div>
    </div>
  );
}