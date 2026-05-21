"use client";
import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ bio: "", interests: [], intent: "" });
  const router = useRouter();

  const interestsList = [
    "Music", "Travel", "Gaming", "Fitness", "Cooking", 
    "Art", "Movies", "Photography", "Tech", "Hiking", 
    "Reading", "Fashion", "Sports", "Volunteering"
  ];

  // Load existing data if it exists (for Profile Editing)
  useEffect(() => {
    const loadData = async () => {
      if (auth.currentUser) {
        const docSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (docSnap.exists()) setData(docSnap.data());
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const toggleInterest = (i) => {
    setData(prev => ({
      ...prev,
      interests: prev.interests.includes(i) 
        ? prev.interests.filter(x => x !== i) 
        : [...prev.interests, i]
    }));
  };

  const saveProfile = async () => {
    if (!auth.currentUser) return;
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), { ...data, profileComplete: true });
      
      // FIXED: Routed to capitalized /Dashboard folder to prevent the Vercel 404 crash
      router.push("/Dashboard");
    } catch (error) {
      console.error("Error saving profile:", error);
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-950 p-6 flex flex-col items-center justify-center text-white">
      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl p-8 rounded-3xl border border-slate-800 shadow-2xl">
        
        {/* Step 1: Bio */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-rose-500">About You</h2>
            <textarea 
              value={data.bio}
              onChange={(e) => setData({...data, bio: e.target.value})}
              className="w-full h-32 p-4 bg-slate-950 rounded-xl border border-slate-700 outline-none focus:border-rose-500 text-white"
            />
            <button onClick={() => setStep(2)} className="w-full py-3 bg-rose-600 rounded-xl font-black transition active:scale-[0.99]">Next</button>
          </div>
        )}

        {/* Step 2: Interests */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-rose-500">Hobbies</h2>
            <div className="grid grid-cols-2 gap-2 h-64 overflow-y-auto pr-2">
              {interestsList.map(i => (
                <button key={i} onClick={() => toggleInterest(i)} 
                  className={`p-3 rounded-xl text-xs font-bold border transition active:scale-[0.98] ${data.interests.includes(i) ? 'bg-rose-600 border-rose-600 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
                  {i}
                </button>
              ))}
            </div>
            <button onClick={() => setStep(3)} className="w-full py-3 bg-rose-600 rounded-xl font-black transition active:scale-[0.99]">Next</button>
          </div>
        )}

        {/* Step 3: Intent */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-rose-500">Looking For?</h2>
            <div className="space-y-2">
              {["Short-term Fun", "Long-term Relationship", "Just Friends", "Still figuring it out"].map(opt => (
                <button key={opt} onClick={() => setData({...data, intent: opt})}
                  className={`w-full py-4 rounded-xl border font-bold text-sm transition active:scale-[0.99] ${data.intent === opt ? 'bg-rose-600 border-rose-600 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
                  {opt}
                </button>
              ))}
            </div>
            <button onClick={saveProfile} className="w-full py-3 bg-white text-slate-900 rounded-xl font-black transition active:scale-[0.99] mt-4">Save Profile</button>
          </div>
        )}
      </div>
    </div>
  );
}