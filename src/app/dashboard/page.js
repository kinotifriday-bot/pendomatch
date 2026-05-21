"use client";
import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("Home");
  const [user, setUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) return;
      
      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) setUser(userDoc.data());

        const querySnapshot = await getDocs(collection(db, "users"));
        const usersList = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(u => u.id !== auth.currentUser?.uid);
        
        setAllUsers(usersList);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        loading(false);
      }
    };
    fetchData();
  }, []);

  // Securely triggers payment api endpoint without exposing credentials
  const handleUpgrade = async (selectedTier) => {
    try {
      const response = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: selectedTier,
          userId: auth.currentUser?.uid || "guest",
          email: auth.currentUser?.email || "user@example.com"
        })
      });
      const data = await response.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        alert("Payment gateway connection error. Please try again.");
      }
    } catch (err) {
      console.error("Payment initiation error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24">
      <header className="p-6 border-b border-slate-900 flex justify-between items-center">
        <h1 className="text-xl font-black text-rose-500">PendoMatch</h1>
      </header>

      <main className="p-6">
        {activeTab === "Home" && (
          <div>
            <h2 className="text-2xl font-black mb-6">Discover Everyone</h2>
            {allUsers.map(u => (
              <div key={u.id} className="bg-slate-900 p-5 rounded-2xl mb-4 border border-slate-800">
                <h3 className="font-bold text-lg">{u.displayName || "Anonymous"}</h3>
                <p className="text-sm text-slate-400 mt-1">{u.bio || "No bio yet."}</p>
                <p className="text-[10px] uppercase font-bold text-rose-500 mt-2">{u.country}</p>
              </div>
            ))}
          </div>
        )}
        
        {activeTab === "Matches" && <div className="text-center mt-20 text-slate-500">No matches yet.</div>}
        
        {activeTab === "Messages" && <MessagesView user={user} onUpgrade={handleUpgrade} />}
        
        {activeTab === "Profile" && <ProfileView userData={user} loading={loading} />}
      </main>

      <nav className="fixed bottom-0 w-full bg-slate-950 border-t border-slate-900 p-4 flex justify-around">
        {["Home", "Matches", "Messages", "Profile"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={activeTab === tab ? "text-rose-500 font-bold" : "text-slate-500"}>
            {tab}
          </button>
        ))}
      </nav>
    </div>
  );
}

function MessagesView({ user, onUpgrade }) {
  // Paywall Logic: Only premium users can chat
  const isPremium = user?.tier === "premium";

  if (!isPremium) {
    return (
      <div className="p-4 max-w-4xl mx-auto text-white rounded-2xl mt-4">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-3 text-xl">🔒</div>
          <h2 className="text-2xl font-black text-rose-500">Upgrade to Chat</h2>
          <p className="text-slate-400 mt-1 text-sm">Match for free, but unlock a tier layout to start conversation threads.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tier 2: Basic */}
          <div className="border border-slate-800 bg-slate-900/50 p-5 rounded-2xl flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold">Tier 2: Basic</h3>
              <p className="text-xl font-black mt-1 text-rose-400">KES 299</p>
              <p className="text-xs text-slate-400 mt-3 leading-relaxed">Up to 4 Photos, Expanded Profile Views, More Messaging Actions.</p>
            </div>
            <button onClick={() => onUpgrade('basic')} className="mt-5 w-full py-2.5 bg-rose-600 rounded-xl font-bold hover:bg-rose-700 transition text-sm">Upgrade Basic</button>
          </div>

          {/* Tier 3: Plus */}
          <div className="border border-slate-800 bg-slate-900 p-5 rounded-2xl flex flex-col justify-between relative">
            <div>
              <h3 className="text-lg font-bold text-yellow-400">Tier 3: Plus</h3>
              <p className="text-xl font-black mt-1 text-yellow-400">KES 499</p>
              <p className="text-xs text-slate-300 mt-3 leading-relaxed">Up to 8 Photos, 100 Profile Views per day, 10 Active Chat Threads.</p>
            </div>
            <button onClick={() => onUpgrade('plus')} className="mt-5 w-full py-2.5 bg-yellow-500 text-slate-950 rounded-xl font-bold hover:bg-yellow-600 transition text-sm">Upgrade Plus</button>
          </div>

          {/* Tier 4: Premium */}
          <div className="border-2 border-rose-500 p-5 rounded-2xl flex flex-col justify-between relative bg-gradient-to-b from-slate-900 to-rose-950/40">
            <span className="absolute -top-3 right-4 bg-rose-500 text-white text-[10px] px-2.5 py-0.5 rounded-full uppercase font-black tracking-wider">Best Value</span>
            <div>
              <h3 className="text-lg font-bold text-rose-400">Tier 4: Premium</h3>
              <p className="text-xl font-black mt-1 text-rose-400">KES 799</p>
              <p className="text-xs text-slate-200 mt-3 leading-relaxed">Unlimited HD Photos & Video, Unlimited Browsing + Rewinds, Priority Instant DM Delivery.</p>
            </div>
            <button onClick={() => onUpgrade('premium')} className="mt-5 w-full py-2.5 bg-rose-500 rounded-xl font-bold hover:bg-rose-600 transition text-sm shadow-lg shadow-rose-500/20">Upgrade Premium</button>
          </div>
        </div>
      </div>
    );
  }
  return <div className="text-center mt-20 text-slate-500">Your inbox is empty.</div>;
}

function ProfileView({ userData, loading }) {
  if (loading) return <div className="text-center mt-10 text-slate-500 animate-pulse">Syncing profile...</div>;
  
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-black">My Profile</h2>
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
        <p><strong>Name:</strong> {userData?.displayName || "Not set"}</p>
        <p><strong>Country:</strong> {userData?.country || "Not set"}</p>
        <p><strong>Bio:</strong> {userData?.bio || "No bio yet"}</p>
      </div>
      <button onClick={() => window.location.href='/onboarding'} className="w-full py-3 bg-rose-600 rounded-xl font-bold">Edit Profile</button>
    </div>
  );
}