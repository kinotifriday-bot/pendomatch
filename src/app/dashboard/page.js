"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Home");

  // The navigation logic
  const handleNav = (tab) => {
    setActiveTab(tab);
    if (tab === "Home") router.push("/dashboard");
    if (tab === "Messages") router.push("/messages");
    // Add logic for others...
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      {/* 4. Outstanding Logo & Header */}
      <header className="p-6 flex items-center justify-between border-b border-slate-800/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {/* 3D Realistic Flaming Heart */}
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-red-700 rounded-full shadow-[0_0_20px_rgba(225,29,72,0.6)] flex items-center justify-center">
              <span className="text-xl">🔥</span>
            </div>
          </div>
          <h1 className="text-2xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">PendoMatch</h1>
        </div>
      </header>

      {/* 1. Swipeable Card Area */}
      <main className="p-6 flex flex-col items-center">
        <div className="w-full max-w-sm h-[500px] bg-slate-900 rounded-3xl border border-slate-800 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544005313-94ddf0286df2')] bg-cover bg-center" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent p-8 flex flex-col justify-end">
            <h2 className="text-4xl font-black drop-shadow-lg">Angel, 24</h2>
            <p className="text-rose-400 font-bold text-lg mb-8 tracking-wide">📍 Nairobi, Kenya</p>
            <div className="flex gap-4">
              <button className="flex-1 py-4 bg-slate-800/80 backdrop-blur-md rounded-2xl font-black hover:bg-slate-700 transition">NOPE</button>
              <button className="flex-1 py-4 bg-rose-600 backdrop-blur-md rounded-2xl font-black hover:bg-rose-500 transition shadow-[0_0_20px_rgba(225,29,72,0.4)]">LIKE</button>
            </div>
          </div>
        </div>
      </main>

      {/* 4. Functional Bottom Nav */}
      <nav className="fixed bottom-0 w-full bg-slate-950/80 backdrop-blur-2xl border-t border-slate-800 p-4 flex justify-around">
        <NavBtn icon="🏠" label="Home" active={activeTab === "Home"} onClick={() => handleNav("Home")} />
        <NavBtn icon="🔥" label="Matches" active={activeTab === "Matches"} onClick={() => handleNav("Matches")} />
        <NavBtn icon="💬" label="Messages" active={activeTab === "Messages"} onClick={() => handleNav("Messages")} />
        <NavBtn icon="👤" label="Profile" active={activeTab === "Profile"} onClick={() => handleNav("Profile")} />
      </nav>
    </div>
  );
}

function NavBtn({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 transition ${active ? "text-rose-500 scale-110" : "text-slate-600"}`}>
      <span className="text-2xl drop-shadow-md">{icon}</span>
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}