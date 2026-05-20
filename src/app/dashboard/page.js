"use client";
import { useEffect, useState } from "react";
import { auth, db } from "../firebase"; // Verify this points cleanly to your centralized firebase configuration file
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, collection, addDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ tier: "free", displayName: "PendoMatch Member" });
  const [loading, setLoading] = useState(true);
  const [transactionCode, setTransactionCode] = useState("");
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);
  const router = useRouter();

  const MY_PENDOMATCH_TILL = "9432101"; // Personal Buy Goods Till Number 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        try {
          // Attempt a safe read loop from your Firestore database setup
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap && docSnap.exists()) {
            setProfile(docSnap.data());
          } else {
            console.log("No profile document found yet. Applying default free account fallback structure.");
            setProfile({
              uid: currentUser.uid,
              email: currentUser.email || "",
              tier: "free",
              displayName: "PendoMatch Member"
            });
          }
        } catch (dbError) {
          console.error("Firestore loading block trace failure:", dbError);
          // Defensive fallback so database read lock errors never freeze your layout screen
          setProfile({ tier: "free", displayName: "PendoMatch Member" });
        } finally {
          // Absolute fail-safe execution: always shut off the loading hang screen
          setLoading(false);
        }
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleManualPaymentSubmit = async (e) => {
    e.preventDefault();
    if (!transactionCode || !selectedTier || !user) return;
    
    setIsSubmittingCode(true);
    
    try {
      await addDoc(collection(db, "payment_submissions"), {
        userId: user.uid,
        userEmail: user.email || "unknown",
        requestedTier: selectedTier.id,
        amountPaid: selectedTier.price,
        mpesaCode: transactionCode.trim().toUpperCase(),
        status: "pending_verification",
        submittedAt: new Date()
      });

      alert(`💌 Code ${transactionCode.toUpperCase()} submitted successfully! Our matchmakers are verifying your payment.`);
      setTransactionCode("");
      setSelectedTier(null);
    } catch (err) {
      console.error("Error logging payment submission path:", err);
      alert("Submission error. Please verify your internet connection connection.");
    } finally {
      setIsSubmittingCode(false);
    }
  };

  const tiers = [
    { id: "free", name: "Tier 1: Free", price: "KES 0", features: ["1 Photo Upload", "Limited Profile Browsing", "1 Match Limit", "1 Active Conversation"], color: "border-slate-200 bg-white text-slate-800" },
    { id: "basic", name: "Tier 2: Basic", price: "KES 299", features: ["Up to 4 Photos", "Expanded Profile Views", "More Messaging Actions", "Increased Match Limits"], color: "border-pink-300 bg-gradient-to-b from-pink-50/30 to-white" },
    { id: "plus", name: "Tier 3: Plus", price: "KES 499", features: ["Up to 8 Photos", "100 Profile Views / day", "10 Active Chat Threads", "2 Hours Weekly Profile Boost"], color: "border-rose-400 bg-gradient-to-b from-rose-50/40 to-white ring-2 ring-rose-400/50" },
    { id: "premium", name: "Tier 4: Premium", price: "KES 799", features: ["Unlimited HD Photos & Video", "Unlimited Browsing + Rewinds", "Priority Instant DM Delivery", "Global Passport Access"], color: "border-amber-400 bg-gradient-to-b from-amber-50/30 to-white" }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
        <div className="animate-bounce text-4xl mb-4">💝</div>
        <p className="text-sm font-bold text-rose-600 tracking-wide">Syncing account setup...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800">
      <nav className="bg-white border-b border-rose-100 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔥</span>
          <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-orange-500">
            PendoMatch Workspace
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold bg-rose-500 text-white px-3 py-1.5 rounded-full capitalize">
            Plan: {profile?.tier || "free"}
          </span>
          <button 
            onClick={() => signOut(auth).then(() => router.push("/login"))} 
            className="text-xs font-bold text-slate-400 hover:text-rose-600 transition"
          >
            Log Out
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-8 space-y-10">
        
        {/* Dynamic Verification Collection Box Popup Overlay */}
        {selectedTier && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white max-w-sm w-full p-6 rounded-3xl shadow-2xl border border-slate-100">
              <h3 className="text-lg font-black text-slate-900">Unlock {selectedTier.name}</h3>
              <p className="text-xs text-slate-500 mb-4">Price: <span className="font-bold text-rose-600">{selectedTier.price}</span></p>
              
              <div className="bg-rose-50/80 p-4 rounded-2xl mb-4 border border-rose-100 text-xs space-y-1.5">
                <p className="font-bold text-rose-700">📲 Lipa Na M-Pesa Instructions:</p>
                <ol className="list-decimal list-inside text-slate-600 space-y-1">
                  <li>Go to M-Pesa Menu $\rightarrow$ Lipa na M-Pesa</li>
                  <li>Select <span className="font-bold">Buy Goods and Services</span></li>
                  <li>Enter Till Number: <span className="font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded border">{MY_PENDOMATCH_TILL}</span></li>
                  <li>Enter Amount: <span className="font-bold text-slate-900">{selectedTier.price}</span></li>
                </ol>
              </div>

              <form onSubmit={handleManualPaymentSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    Paste M-Pesa Transaction Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    placeholder="e.g. QE76XYZ890"
                    value={transactionCode}
                    onChange={(e) => setTransactionCode(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl uppercase font-bold tracking-widest text-center text-sm outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setSelectedTier(null)} className="w-1/2 py-2 text-xs font-bold text-slate-400 bg-slate-50 rounded-xl">Cancel</button>
                  <button type="submit" disabled={isSubmittingCode} className="w-1/2 py-2 text-xs font-bold text-white bg-rose-500 rounded-xl disabled:bg-rose-300">
                    {isSubmittingCode ? "Submitting..." : "VERIFY PAYMENT 💌"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <section className="bg-white border border-rose-100 p-6 md:p-8 rounded-3xl shadow-sm">
          <h2 className="text-2xl font-black text-slate-900">Welcome to PendoMatch, {profile?.displayName || "Member"}! 💞</h2>
          <p className="text-slate-500 text-sm mt-1 max-w-xl">
            Your workspace is active. Choose an upgraded account tier below to begin expanding your profile views and connecting with matches instantly.
          </p>
        </section>

        {/* Pricing Layout Cards System GRID */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {tiers.map((t) => {
            const isCurrent = (profile?.tier || "free") === t.id;
            return (
              <div key={t.id} className={`border p-6 rounded-3xl shadow-sm flex flex-col justify-between ${t.color}`}>
                <div>
                  <h4 className="text-sm font-black text-slate-900">{t.name}</h4>
                  <p className="text-2xl font-black text-slate-900 my-2">{t.price}</p>
                  <ul className="space-y-2 border-t border-slate-100 pt-4 mb-6">
                    {t.features.map((feat, i) => <li key={i} className="text-xs text-slate-600">✔ {feat}</li>)}
                  </ul>
                </div>
                {isCurrent ? (
                  <div className="text-center py-2 bg-slate-100 text-slate-400 rounded-xl text-xs font-bold">ACTIVE PLAN</div>
                ) : t.id === "free" ? (
                  <div className="text-center py-2 text-slate-300 text-xs">Standard Default</div>
                ) : (
                  <button onClick={() => setSelectedTier(t)} className="w-full py-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-black rounded-xl text-xs uppercase tracking-wider">
                    Select {t.id}
                  </button>
                )}
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
}