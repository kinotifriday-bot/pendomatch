"use client";
import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mpesaNumber, setMpesaNumber] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        // Fetch the user's real-time custom profile record from Firestore
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setProfile(docSnap.data());
        } else {
          // Fallback if they bypassed onboarding manually
          setProfile({ tier: "free", photosCount: 0 });
        }
        setLoading(false);
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Signout error:", error);
    }
  };

  const handleMpesaPayment = async (e) => {
    e.preventDefault();
    if (!mpesaNumber || !selectedTier) return;
    
    setIsProcessingPayment(true);
    
    // Simulating the merchant gateway pipeline hook (Chapa/Pesapal/Flutterwave aggregator)
    setTimeout(async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          tier: selectedTier.id
        });
        
        // Update local screen state state instantly
        setProfile((prev) => ({ ...prev, tier: selectedTier.id }));
        alert(`STK Push Prompt sent to ${mpesaNumber}! Enter your M-Pesa PIN to unlock ${selectedTier.name}.`);
        setSelectedTier(null);
      } catch (err) {
        console.error("Payment registration failure:", err);
      } finally {
        setIsProcessingPayment(false);
      }
    }, 2000);
  };

  const tiers = [
    {
      id: "free",
      name: "Tier 1: Free",
      price: "KES 0",
      features: ["1 Photo Upload", "Limited Profile Browsing", "1 Match Limit", "1 Active Conversation"],
      color: "border-slate-200 bg-white text-slate-800"
    },
    {
      id: "basic",
      name: "Tier 2: Basic",
      price: "KES 299",
      features: ["Up to 4 Photos", "Expanded Profile Views", "More Messaging Actions", "Increased Match Limits"],
      color: "border-pink-300 bg-gradient-to-b from-pink-50/30 to-white"
    },
    {
      id: "plus",
      name: "Tier 3: Plus",
      price: "KES 499",
      features: ["Up to 8 Photos", "100 Profile Views / day", "10 Active Chat Threads", "2 Hours Weekly Profile Boost"],
      color: "border-rose-400 bg-gradient-to-b from-rose-50/40 to-white relative ring-2 ring-rose-400/50"
    },
    {
      id: "premium",
      name: "Tier 4: Premium",
      price: "KES 799",
      features: ["Unlimited HD Photos & Video", "Unlimited Browsing + Rewinds", "Priority Instant DM Delivery", "Global Passport Access"],
      color: "border-amber-400 bg-gradient-to-b from-amber-50/30 to-white"
    }
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
      {/* Top Application Navbar */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-rose-100 px-6 py-4 flex justify-between items-center sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔥</span>
          <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-orange-500 tracking-tight">
            PendoMatch Workspace
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold bg-gradient-to-r from-rose-500 to-pink-500 text-white px-3 py-1.5 rounded-full shadow-sm capitalize">
            Plan: {profile?.tier || "Free"}
          </span>
          <button onClick={handleLogout} className="text-xs font-bold text-slate-500 hover:text-rose-600 transition">
            Log Out
          </button>
        </div>
      </nav>

      {/* Main Container View dashboard */}
      <main className="max-w-7xl mx-auto p-6 md:p-8 space-y-10">
        
        {/* Dynamic Interactive Modal overlay for M-Pesa Number validation collection */}
        {selectedTier && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white max-w-sm w-full p-6 rounded-2xl shadow-2xl border border-slate-100 animate-fade-in">
              <h3 className="text-lg font-bold text-slate-900 mb-1">Unlock {selectedTier.name}</h3>
              <p className="text-xs text-slate-500 mb-4">Amount to process: <span className="font-bold text-rose-600">{selectedTier.price}</span></p>
              
              <form onSubmit={handleMpesaPayment} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    Safaricom M-Pesa Number
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 0712345678"
                    value={mpesaNumber}
                    onChange={(e) => setMpesaNumber(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 text-sm font-medium tracking-wide"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTier(null)}
                    className="w-1/2 py-2 text-xs font-bold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessingPayment}
                    className="w-1/2 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition disabled:bg-emerald-400"
                  >
                    {isProcessingPayment ? "Triggering STK..." : "PROMPT PIN 📲"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Introduction Panel banner */}
        <section className="bg-white border border-rose-100 p-6 md:p-8 rounded-3xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Welcome to PendoMatch! 💞</h2>
            <p className="text-slate-500 text-sm mt-1 max-w-xl">
              Your profile is verified and active. Ready to meet verified singles? Select a target subscription plan below to unlock premium messaging filters, features, and expanded media buckets.
            </p>
          </div>
        </section>

        {/* Subscription pricing matrix wrapper */}
        <section className="space-y-4">
          <div className="text-center md:text-left">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">Upgrade Your Connection Journey</h3>
            <p className="text-xs text-slate-500">Pick a package tailored to match your pace.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {tiers.map((t) => {
              const isCurrent = profile?.tier === t.id;
              return (
                <div key={t.id} className={`border p-6 rounded-3xl shadow-sm flex flex-col justify-between transition hover:shadow-md ${t.color}`}>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">{t.name}</h4>
                    <div className="my-3">
                      <span className="text-3xl font-black text-slate-900">{t.price}</span>
                      {t.id !== "free" && <span className="text-[10px] font-bold text-slate-400 block mt-0.5">/ Monthly billing</span>}
                    </div>
                    <ul className="space-y-2 border-t border-slate-100 pt-4 mb-6">
                      {t.features.map((feat, i) => (
                        <li key={i} className="text-xs text-slate-600 flex items-start gap-2 font-medium">
                          <span className="text-rose-500">✔</span> {feat}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {isCurrent ? (
                    <div className="w-full text-center py-2.5 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold uppercase tracking-wider border border-slate-200">
                      Your Current Plan
                    </div>
                  ) : t.id === "free" ? (
                    <button disabled className="w-full py-2.5 bg-slate-50 text-slate-300 rounded-xl text-xs font-bold uppercase border border-slate-100 cursor-not-allowed">
                      Base Tier Enabled
                    </button>
                  ) : (
                    <button
                      onClick={() => setSelectedTier(t)}
                      className="w-full py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 hover:opacity-95 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm active:scale-[0.99] transition"
                    >
                      Choose {t.id}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}