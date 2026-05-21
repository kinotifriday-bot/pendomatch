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
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
        
        {activeTab === "Messages" && <MessagesView user={user} />}
        
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

function MessagesView({ user }) {
  // Paywall Logic: Only premium users can chat
  const isPremium = user?.tier === "premium";

  if (!isPremium) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center mt-10">
        <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mb-4 text-2xl">🔒</div>
        <h2 className="text-xl font-black">Upgrade to Chat</h2>
        <p className="text-slate-400 mt-2 text-sm max-w-xs">Match for free, but upgrade to start conversations.</p>
        <button onClick={() => alert("Redirecting to payment gateway...")} className="mt-6 w-full py-3 bg-rose-600 rounded-xl font-black">UPGRADE NOW</button>
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