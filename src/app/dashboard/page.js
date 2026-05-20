"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("Home");
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      if (!auth.currentUser) return router.push("/");
      const docSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (docSnap.exists()) setUser(docSnap.data());
    };
    fetchUser();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24">
      <header className="p-6 border-b border-slate-900 flex justify-between items-center">
        <h1 className="text-xl font-black text-rose-500">PendoMatch</h1>
      </header>

      <main>
        {activeTab === "Home" && <SwipeView />}
        {activeTab === "Matches" && <MatchesView />}
        {activeTab === "Messages" && <MessagesView />}
        {activeTab === "Profile" && <ProfileView userData={user} />}
      </main>

      <nav className="fixed bottom-0 w-full bg-slate-950 border-t border-slate-900 p-4 flex justify-around">
        {["Home", "Matches", "Messages", "Profile"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={activeTab === tab ? "text-rose-500" : "text-slate-500"}>
            {tab}
          </button>
        ))}
      </nav>
    </div>
  );
}

// Empty State View Components
function SwipeView() {
  return <div className="p-6 text-center mt-20 text-slate-500">No more profiles in your area.</div>;
}

function MatchesView() {
  return (
    <div className="p-6 text-center mt-20 text-slate-500">
      <p>No matches yet.</p>
      <p className="text-xs">Keep swiping to find your spark!</p>
    </div>
  );
}

function MessagesView() {
  return (
    <div className="p-6 text-center mt-20 text-slate-500">
      <p>No active conversations.</p>
    </div>
  );
}

function ProfileView({ userData }) {
  if (!userData) return <p className="p-6">Loading...</p>;
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-black">My Profile</h2>
      <div className="bg-slate-900 p-4 rounded-xl">
        <p className="text-slate-400 text-sm">Name: {userData.displayName || "Not set"}</p>
        <p className="text-slate-400 text-sm">Location: {userData.city}, {userData.country}</p>
        <p className="text-slate-400 text-sm">Intent: {userData.intent}</p>
      </div>
      <button onClick={() => window.location.href='/onboarding'} className="w-full py-3 bg-rose-600 rounded-xl font-bold">Edit Profile</button>
    </div>
  );
}