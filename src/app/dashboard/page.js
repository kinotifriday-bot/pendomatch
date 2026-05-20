"use client";
import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, collection, addDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ tier: "free", displayName: "Member" });
  const [loading, setLoading] = useState(true);
  
  // Paywall & Checkout controllers
  const [showPaywall, setShowPaywall] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);
  const [transactionCode, setTransactionCode] = useState("");
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);

  const router = useRouter();
  const MY_PENDOMATCH_POCHI = "07XXXXXXXX (Pochi La Biashara)"; // Update with your phone/pochi info later

  // Mock Discovery Feed Database Profiles for browsing enjoyability
  const mockDatingFeed = [
    { id: 1, name: "Angel, 24", location: "Nairobi", bio: "Architectural designer who loves fine dining, slow jazz, and intentional conversations. Looking for someone genuine. ✨", image: "💃" },
    { id: 2, name: "Brian, 27", location: "Mombasa", bio: "Software engineer & coastal adventurer. Let's explore weekend nature trails or chat about tech and deep life goals.", image: "🕺" },
    { id: 3, name: "Chloe, 25", location: "Kisumu", bio: "Lover of travel, commercial photography, and culinary arts. Let's connect over coffee and see where the sparks go! ☕", image: "✨" }
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap && docSnap.exists()) {
            setProfile(docSnap.data());
          } else {
            setProfile({ uid: currentUser.uid, email: currentUser.email || "", tier: "free", displayName: "PendoMatch Member" });
          }
        } catch (err) {
          setProfile({ tier: "free", displayName: "PendoMatch Member" });
        } finally {
          setLoading(false);
        }
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const triggerPremiumAction = () => {
    // If user is on the free tier, trigger the paywall block smoothly
    if (profile.tier === "free") {
      setShowPaywall(true);
    } else {
      alert("🔒 Premium Feature Active! Connection channel unlocked.");
    }
  };

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
      alert(`💌 Code ${transactionCode.toUpperCase()} submitted! Your premium access will unlock shortly after verification.`);
      setTransactionCode("");
      setSelectedTier(null);
      setShowPaywall(false);
    } catch (err) {
      alert("Network error. Please try again.");
    } finally {
      setIsSubmittingCode(false);
    }
  };

  const tiers = [
    { id: "basic", name: "Tier 2: Basic", price: "KES 299", features: ["Up to 4 Photos", "Expanded Profile Views", "More Messaging Actions"], color: "bg-slate-900 border-slate-800 text-white" },
    { id: "plus", name: "Tier 3: Plus", price: "KES 499", features: ["Up to 8 Photos", "100 Profile Views/day", "10 Active Chat Threads"], color: "bg-gradient-to-b from-rose-950 to-slate-950 border-rose-900 text-white ring-1 ring-rose-500/30" },
    { id: "premium", name: "Tier 4: Premium", price: "KES 799", features: ["Unlimited HD Photos", "Unlimited Rewinds", "Priority Instant DM Delivery"], color: "bg-gradient-to-b from-amber-950 to-slate-950 border-amber-900 text-white ring-1 ring-amber-500/30" }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950">
        <div className="animate-pulse text-3xl mb-2">💖</div>
        <p className="text-xs font-bold text-rose-500 tracking-widest uppercase">Syncing PendoMatch...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-rose-500 selection:text-white">
      {/* Top Header Navigation Panel */}
      <nav className="bg-slate-900/40 backdrop-blur-md border-b border-slate-900 px-6 py-4 flex justify-between items-center fixed top-0 w-full z-40">
        <div className="flex items-center gap-2">
          <span className="text-xl filter drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]">✨</span>
          <h1 className="text-lg font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-rose-400">
            PendoMatch
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black bg-gradient-to-r from-rose-500 to-pink-600 text-white px-3 py-1 rounded-full uppercase tracking-wider shadow-[0_0_15px_rgba(244,63,94,0.3)]">
            Plan: {profile?.tier || "free"}
          </span>
          <button onClick={() => signOut(auth)} className="text-xs font-bold text-slate-500 hover:text-slate-300 transition">Log Out</button>
        </div>
      </nav>

      {/* Main Browse Feed Section */}
      <main className="max-w-md mx-auto pt-24 pb-12 px-4 space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-extrabold text-white">Discover Daily Sparks</h2>
          <p className="text-xs text-slate-400">Review intentional singles active near you right now.</p>
        </div>

        {/* Dynamic Card Browsing Stack */}
        <div className="space-y-4">
          {mockDatingFeed.map((member) => (
            <div key={member.id} className="bg-slate-900/60 border border-slate-900 rounded-3xl p-6 shadow-xl space-y-4 relative overflow-hidden group hover:border-slate-800 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-rose-500/20 to-pink-500/10 rounded-2xl flex items-center justify-center text-2xl border border-rose-500/20 shadow-inner">
                  {member.image}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    {member.name}
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  </h3>
                  <p className="text-xs text-rose-400 font-semibold tracking-wide">{member.location}</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">{member.bio}</p>
              
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button onClick={triggerPremiumAction} className="py-2.5 bg-slate-950 border border-slate-800 hover:bg-slate-900 rounded-xl text-xs font-bold transition text-slate-300">
                  View Private Photos
                </button>
                <button onClick={triggerPremiumAction} className="py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 hover:opacity-95 rounded-xl text-xs font-black text-white transition shadow-md shadow-rose-950/40">
                  Send Direct Message 💬
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Dynamic Soft Paywall Modal Overlay */}
        {showPaywall && !selectedTier && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-slate-900 border border-slate-800 max-w-sm w-full p-6 rounded-3xl shadow-2xl text-center space-y-6">
              <div className="space-y-2">
                <div className="text-3xl filter drop-shadow-[0_0_12px_rgba(244,63,94,0.4)]">🔒</div>
                <h3 className="text-lg font-black text-white">Unlock Full Connection</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  You discovered premium features! Upgrade your subscription tier to open messaging pipelines and access absolute visibility.
                </p>
              </div>

              {/* Tiers list inside the paywall popup */}
              <div className="space-y-3 text-left">
                {tiers.map((t) => (
                  <div key={t.id} className={`border p-4 rounded-2xl flex justify-between items-center ${t.color}`}>
                    <div className="space-y-1">
                      <p className="text-xs font-black tracking-wide">{t.name}</p>
                      <p className="text-[10px] text-slate-400">{t.features[0]} • Instant Activation</p>
                    </div>
                    <button onClick={() => setSelectedTier(t)} className="px-3 py-1.5 bg-white text-slate-950 font-black text-[11px] rounded-lg shadow uppercase hover:opacity-90 transition">
                      {t.price}
                    </button>
                  </div>
                ))}
              </div>

              <button onClick={() => setShowPaywall(false)} className="text-xs font-bold text-slate-500 hover:text-slate-400 transition pt-2">
                Continue Browsing Freely
              </button>
            </div>
          </div>
        )}

        {/* Checkout Modal Overlay Panel */}
        {selectedTier && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-800 max-w-sm w-full p-6 rounded-3xl shadow-2xl space-y-5">
              <h3 className="text-base font-black text-white">Confirm Tier Activation</h3>
              
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs space-y-2 text-slate-300">
                <p className="font-bold text-rose-400">📲 M-Pesa Instructions (Pochi La Biashara):</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-400">
                  <li>Dial <span className="font-bold text-white">*334#</span></li>
                  <li>Select Pochi La Biashara</li>
                  <li>Send Payment to: <span className="font-bold text-white bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">{MY_PENDOMATCH_POCHI}</span></li>
                  <li>Amount: <span className="font-bold text-white">{selectedTier.price}</span></li>
                </ol>
              </div>

              <form onSubmit={handleManualPaymentSubmit} className="space-y-4">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Paste M-Pesa Transaction Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    placeholder="e.g. QE76XYZ890"
                    value={transactionCode}
                    onChange={(e) => setTransactionCode(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl uppercase font-bold tracking-widest text-center text-sm text-white outline-none focus:border-rose-500 transition"
                  />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setSelectedTier(null)} className="w-1/2 py-2 text-xs font-bold text-slate-500 bg-slate-950 border border-slate-800 rounded-xl">Back</button>
                  <button type="submit" disabled={isSubmittingCode} className="w-1/2 py-2 text-xs font-black text-white bg-rose-500 rounded-xl transition disabled:opacity-50">
                    {isSubmittingCode ? "Verifying..." : "SUBMIT CODE"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}