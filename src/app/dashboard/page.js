"use client";
import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("Home");
  const [user, setUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) return;
      // Get current user profile
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (userDoc.exists()) setUser(userDoc.data());

      // Get ALL users (Global view, no area restriction)
      const querySnapshot = await getDocs(collection(db, "users"));
      const usersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllUsers(usersList.filter(u => u.id !== auth.currentUser.uid));
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24">
      <main className="p-6">
        {activeTab === "Home" && (
          <div>
            <h2 className="text-2xl font-black mb-4">Discover</h2>
            {allUsers.length > 0 ? (
              allUsers.map(u => (
                <div key={u.id} className="bg-slate-900 p-4 rounded-xl mb-4 border border-slate-800">
                  <h3 className="font-bold">{u.displayName || "Anonymous"}</h3>
                  <p className="text-sm text-slate-400">{u.bio}</p>
                </div>
              ))
            ) : <p>No profiles available.</p>}
          </div>
        )}
        {activeTab === "Matches" && <div className="text-center mt-20">No matches yet.</div>}
        {activeTab === "Messages" && <div className="text-center mt-20">No conversations.</div>}
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

function ProfileView({ userData }) {
  if (!userData) return <div className="p-6">Loading profile data...</div>;
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-black">My Profile</h2>
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
        <p><strong>Name:</strong> {userData.displayName || "Not set"}</p>
        <p><strong>Country:</strong> {userData.country}</p>
        <p><strong>Bio:</strong> {userData.bio || "No bio yet"}</p>
      </div>
      <button onClick={() => window.location.href='/onboarding'} className="w-full py-3 bg-rose-600 rounded-xl font-bold">Edit Profile</button>
    </div>
  );
}