"use client";
import { useState } from "react";
import { db, auth } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({ 
    bio: "", 
    interests: [], 
    intent: "",
    photoUrl: "" 
  });
  const router = useRouter();

  const interestsList = [
    "Music", "Travel", "Gaming", "Fitness", "Cooking", 
    "Art", "Movies", "Photography", "Tech", "Hiking", 
    "Reading", "Fashion", "Sports", "Volunteering"
  ];

  const toggleInterest = (interest) => {
    setData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest) 
        ? prev.interests.filter(i => i !== interest) 
        : [...prev.interests, interest]
    }));
  };

  const completeOnboarding = async () => {
    if (!auth.currentUser) return;
    const userRef = doc(db, "users", auth.currentUser.uid);
    await updateDoc(userRef, { 
      ...data, 
      profileComplete: true,
      updatedAt: new Date() 
    });
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 flex flex-col items-center justify-center text-white">
      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl p-8 rounded-3xl border border-slate-800 shadow-2xl">
        
        {/* Step 1: Bio */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-black text-rose-500">About You</h2>
            <p className="text-sm text-slate-400">Express your vibe. What should your potential matches know?</p>
            <textarea 
              placeholder="I love sunsets, spontaneous road trips, and deep conversations over coffee..." 
              className="w-full h-32 p-4 bg-slate-950 rounded-xl border border-slate-700 outline-none focus:border-rose-500"
              onChange={(e) => setData({...data, bio: e.target.value})}
            />
            <button onClick={() => setStep(2)} className="w-full py-3 bg-rose-600 rounded-xl font-black hover:bg-rose-500 transition">Next</button>
          </div>
        )}

        {/* Step 2: Interests Grid */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-black text-rose-500">Hobbies & Interests</h2>
            <div className="grid grid-cols-2 gap-2 h-64 overflow-y-auto pr-2">
              {interestsList.map(i => (
                <button key={i} onClick={() => toggleInterest(i)} 
                  className={`p-3 rounded-xl text-xs font-bold border transition ${
                    data.interests.includes(i) ? 'bg-rose-600 border-rose-600 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}>
                  {i}
                </button>
              ))}
            </div>
            <button onClick={() => setStep(3)} className="w-full py-3 bg-rose-600 rounded-xl font-black">Next</button>
          </div>
        )}

        {/* Step 3: Intent */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-black text-rose-500">Looking For?</h2>
            {["Short-term Fun", "Long-term Relationship", "Just Friends", "Still figuring it out"].map(opt => (
              <button key={opt} onClick={() => setData({...data, intent: opt})}
                className={`w-full py-4 rounded-xl border font-bold text-sm ${data.intent === opt ? 'bg-rose-600 border-rose-600' : 'bg-slate-800 border-slate-700'}`}>
                {opt}
              </button>
            ))}
            <button onClick={completeOnboarding} className="w-full py-3 bg-white text-slate-900 rounded-xl font-black hover:bg-slate-200 transition">Complete Profile</button>
          </div>
        )}
      </div>
    </div>
  );
}