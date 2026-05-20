"use client";
import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Home");
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          setProfile(docSnap.exists() ? docSnap.data() : { name: "Member" });
        } catch (e) { console.error(e); }
      } else {
        router.push("/");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-rose-500 font-black">SYNCING...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24">
      <header className="p-6 flex items-center justify-between border-b border-slate-900">
        <div className="flex items-center gap-2">
          <svg width="25" height="25" viewBox="0 0 200 200"><path d="M100,60 C80,20 20,25 20,75 C20,120 75,155 100,175 C125,155 180,120 180,75 C180,25 120,20 100,60 Z" fill="#e11d48" /></svg>
          <h1 className="text-lg font-black tracking-tighter">PendoMatch</h1>
        </div>
        <button onClick={() => signOut(auth)} className="text-[10px] font-bold text-slate-500">LOGOUT</button>
      </header>

      <main className="p-6 flex flex-col items-center">
        <div className="w-full max-w-sm h-[450px] bg-slate-900 rounded-3xl border border-slate-800 p-6 flex flex-col justify-end shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="relative z-10">
            <h2 className="text-3xl font-black">Angel, 24</h2>
            <p className="text-rose-400 font-bold mb-6">Architectural Designer • Nairobi</p>
            <div className="flex gap-4">
              <button className="flex-1 py-3 bg-slate-800 rounded-xl font-bold hover:bg-slate-700 transition">NOPE</button>
              <button className="flex-1 py-3 bg-rose-600 rounded-xl font-black hover:bg-rose-500 transition">LIKE</button>
            </div>
          </div>
        </div>
      </main>

      <nav className="fixed bottom-0 w-full bg-slate-950 border-t border-slate-900 p-4 flex justify-around items-center">
        <NavBtn icon="🏠" label="Home" active={activeTab === "Home"} onClick={() => setActiveTab("Home")} />
        <NavBtn icon="🔥" label="Matches" active={activeTab === "Matches"} onClick={() => setActiveTab("Matches")} />
        <NavBtn icon="💬" label="Messages" active={activeTab === "Messages"} onClick={() => setActiveTab("Messages")} />
        <NavBtn icon="👤" label="Profile" active={activeTab === "Profile"} onClick={() => setActiveTab("Profile")} />
      </nav>
    </div>
  );
}

function NavBtn({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 ${active ? "text-rose-500" : "text-slate-500"}`}>
      <span className="text-xl">{icon}</span>
      <span className="text-[9px] font-black uppercase">{label}</span>
    </button>
  );
}