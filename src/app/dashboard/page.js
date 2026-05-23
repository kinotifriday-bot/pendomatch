"use client";
import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("Home");
  const [user, setUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) return;
      
      try {
        const userRef = doc(db, "users", auth.currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          setUser(userDoc.data());
        } else {
          // SAFEGUARD FOR NEW REGISTRATIONS
          const newUserData = {
            uid: auth.currentUser.uid,
            displayName: auth.currentUser.displayName || "New Matcher",
            email: auth.currentUser.email,
            tier: "free",
            country: "Kenya",
            bio: "No bio yet.",
            profilePic: "",
            interests: []
          };
          await setDoc(userRef, newUserData);
          setUser(newUserData);
        }

        // Fetch other users for browsing pipeline
        const querySnapshot = await getDocs(collection(db, "users"));
        const usersList = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(u => {
            // 1. Filter out yourself from showing up in your own feed
            const isNotMe = u.id !== auth.currentUser?.uid;
            
            // 2. Strict Filter: Wipe out raw anonymous/incomplete test profiles from the screen
            const hasRealName = u.displayName && u.displayName !== "New User" && u.displayName !== "New Matcher" && u.displayName !== "Anonymous";
            
            return isNotMe && hasRealName;
          });
        
        setAllUsers(usersList);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab]);

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
        alert(data.error || "Payment gateway connection error. Please try again.");
      }
    } catch (err) {
      console.error("Payment initiation error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24">
      <header className="p-6 border-b border-slate-900 flex justify-between items-center bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <h1 className="text-xl font-black text-rose-500 tracking-wider">PendoMatch</h1>
        {user?.tier && (
          <span className="text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">
            {user.tier} Tier
          </span>
        )}
      </header>

      <main className="p-6 max-w-md mx-auto">
        {activeTab === "Home" && (
          <div className="space-y-6 text-center">
            <h2 className="text-xl font-black tracking-tight text-left">Discover Everyone</h2>
            {allUsers.length === 0 ? (
              <div className="text-center mt-20 text-slate-500 text-sm animate-pulse">
                Looking for new profiles... Active matches will reveal themselves shortly!
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-6">
                {allUsers.map(u => (
                  <div key={u.id} className="relative w-full h-[480px] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 transition transform hover:scale-[1.01]">
                    
                    {/* 1. Main Profile Photo Layout */}
                    <img 
                      src={u.profilePic || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=60"} 
                      alt={u.displayName}
                      className="w-full h-full object-cover"
                    />

                    {/* 2. Sleek Deep Gradient Overlay for UI Text Readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>

                    {/* 3. Card Information Details Layout */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-left space-y-2">
                      <div className="flex items-baseline gap-2">
                        <h3 className="text-2xl font-black text-white tracking-tight">{u.displayName || "Anonymous"}</h3>
                        {u.age && <span className="text-xl text-slate-300 font-medium">{u.age}</span>}
                      </div>
                      
                      <p className="text-xs text-rose-400 font-bold tracking-wide">📍 {u.country || "Chuka"}</p>
                      
                      <p className="text-sm text-slate-200 font-normal line-clamp-3 leading-relaxed">
                        {u.bio || "No bio added yet."}
                      </p>
                      
                      {/* Interactive Selection Hobbies Tags */}
                      {u.interests && u.interests.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {u.interests.slice(0, 3).map((interest) => (
                            <span key={interest} className="text-[10px] font-extrabold bg-white/10 backdrop-blur-md text-white px-2.5 py-1 rounded-full border border-white/10">
                              {interest}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === "Matches" && <div className="text-center mt-20 text-slate-500 text-sm">No mutual matches yet. Keep discovering!</div>}
        
        {activeTab === "Messages" && <MessagesView user={user} onUpgrade={handleUpgrade} />}
        
        {activeTab === "Profile" && <ProfileView userData={user} loading={loading} />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-slate-950/90 backdrop-blur-lg border-t border-slate-900 p-4 flex justify-around items-center z-50 max-w-md mx-auto">
        {["Home", "Matches", "Messages", "Profile"].map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)} 
            className={`text-xs font-black transition tracking-wider ${activeTab === tab ? "text-rose-500 scale-105" : "text-slate-500 hover:text-slate-400"}`}
          >
            {tab}
          </button>
        ))}
      </nav>
    </div>
  );
}

function MessagesView({ user, onUpgrade }) {
  const userTier = user?.tier?.toLowerCase() || "free";
  const isPremium = userTier === "premium" || userTier === "plus" || userTier === "basic";

  if (!