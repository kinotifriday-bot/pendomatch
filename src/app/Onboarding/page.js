"use client";
import { useState, useEffect } from "react";
import { auth, db } from "../firebase"; // Adjust directory traversal based on your path
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const [user, setUser] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [gender, setGender] = useState("");
  const [interestedIn, setInterestedIn] = useState("");
  const [bio, setBio] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setIsVerifying(false);
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    setIsLoading(true);

    try {
      // Reference user document inside 'users' collection using their unique Auth UID
      const userProfileRef = doc(db, "users", user.uid);
      
      await setDoc(userProfileRef, {
        uid: user.uid,
        email: user.email,
        displayName: displayName,
        gender: gender,
        interestedIn: interestedIn,
        bio: bio,
        tier: "free", // Every single user starts on the Tier One free plan by default
        photosCount: 0,
        matchesCount: 0,
        conversationsCount: 0,
        createdAt: new Date()
      });

      // Redirect directly to the dashboard workspace once documentation finishes
      router.push("/dashboard");
    } catch (error) {
      console.error("Error saving profile initialization data:", error);
      alert("Failed to save profile details. Please check your internet connection.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
        <div className="animate-bounce text-4xl mb-4">💝</div>
        <p className="text-sm font-bold text-rose-600 tracking-wide">Syncing heartbeats...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-rose-600 via-pink-500 to-orange-400 px-4 py-12 relative overflow-hidden">
      <div className="w-full max-w-md space-y-6 bg-white/95 backdrop-blur-lg p-8 rounded-3xl shadow-2xl border border-white/40 relative z-10">
        
        <div className="text-center">
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-pink-500 to-orange-500">
            Create Your Profile
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-500">Tell us about yourself to find your perfect match</p>
        </div>

        <form className="space-y-4" onSubmit={handleProfileSubmit}>
          <div>
            <label className="block text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">
              Dating Profile Name
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:ring-2 focus:ring-rose-400 outline-none transition bg-white"
              placeholder="e.g. Friday"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">
                Your Gender
              </label>
              <select
                required
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:ring-2 focus:ring-rose-400 outline-none transition bg-white text-slate-700"
              >
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">
                Looking For
              </label>
              <select
                required
                value={interestedIn}
                onChange={(e) => setInterestedIn(e.target.value)}
                className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:ring-2 focus:ring-rose-400 outline-none transition bg-white text-slate-700"
              >
                <option value="">Looking for...</option>
                <option value="female">Women</option>
                <option value="male">Men</option>
                <option value="everyone">Everyone</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">
              Short Bio
            </label>
            <textarea
              required
              rows="3"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:ring-2 focus:ring-rose-400 outline-none transition bg-white resize-none"
              placeholder="What makes you a great catch?..."
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-rose-500 via-pink-500 to-orange-500 hover:opacity-95 text-white font-extrabold py-3.5 px-4 rounded-xl shadow-lg transform active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm tracking-wide"
          >
            {isLoading ? "Saving Profile..." : "LET'S DISCOVER MATCHES 🚀"}
          </button>
        </form>
      </div>
    </div>
  );
}