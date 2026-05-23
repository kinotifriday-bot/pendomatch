"use client";
import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc, collection, getDocs, updateDoc, arrayUnion } from "firebase/firestore";
import { motion, useMotionValue, useTransform, useAnimation } from "framer-motion";

// Helper helper function to return gender-specific silhouette shadows dynamically
const getGenderAvatar = (gender) => {
  switch (gender) {
    case "Male":
      return "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=500&auto=format&fit=crop&q=80"; // Male Shadow Avatar
    case "Female":
      return "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=80"; // Female Shadow Avatar
    default:
      return "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80"; // General Shadow Avatar
  }
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("Home");
  const [user, setUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0); // Tracks current profile card index
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) return;
      
      try {
        const userRef = doc(db, "users", auth.currentUser.uid);
        const userDoc = await getDoc(userRef);
        let currentUserData = null;
        
        if (userDoc.exists()) {
          currentUserData = userDoc.data();
          setUser(currentUserData);
        } else {
          currentUserData = {
            uid: auth.currentUser.uid,
            displayName: auth.currentUser.displayName || "New Matcher",
            email: auth.currentUser.email,
            tier: "free",
            country: "Kenya",
            bio: "No bio yet.",
            profilePic: "",
            gender: "",
            interests: [],
            likedUsers: [],
            passedUsers: []
          };
          await setDoc(userRef, currentUserData);
          setUser(currentUserData);
        }

        // Fetch other users for browsing pipeline
        const querySnapshot = await getDocs(collection(db, "users"));
        
        // Track already swiped items to keep feed pristine
        const swipedUserIds = [
          ...(currentUserData.likedUsers || []),
          ...(currentUserData.passedUsers || [])
        ];

        const usersList = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(u => {
            const isNotMe = u.id !== auth.currentUser?.uid;
            const hasRealName = u.displayName && u.displayName !== "New User" && u.displayName !== "New Matcher" && u.displayName !== "Anonymous";
            const notSwipedYet = !swipedUserIds.includes(u.id);
            
            return isNotMe && hasRealName && notSwipedYet;
          });
        
        setAllUsers(usersList);
        setCurrentIndex(usersList.length - 1); // Point stack tracker index to top card
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab]);

  // Handle Swipe Engine Interactions 
  const handleSwipeAction = async (targetUserId, actionType) => {
    if (!auth.currentUser) return;
    
    const myUid = auth.currentUser.uid;
    const userRef = doc(db, "users", myUid);

    try {
      if (actionType === "like") {
        await updateDoc(userRef, { likedUsers: arrayUnion(targetUserId) });
        console.log(`Liked profile: ${targetUserId}`);
        
        // Check for immediate mutual match condition
        const targetUserDoc = await getDoc(doc(db, "users", targetUserId));
        if (targetUserDoc.exists() && targetUserDoc.data().likedUsers?.includes(myUid)) {
          alert(`🎉 Match Alert! You and ${targetUserDoc.data().displayName} matched!`);
        }
      } else {
        await updateDoc(userRef, { passedUsers: arrayUnion(targetUserId) });
        console.log(`Passed profile: ${targetUserId}`);
      }
    } catch (err) {
      console.error("Error logging swipe action:", err);
    }

    // Decrement top stack index to transition to underlying card
    setCurrentIndex((prevIndex) => prevIndex - 1);
  };

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
    <div className="min-h-screen bg-slate-950 text-white pb-24 overflow-x-hidden">
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
          <div className="space-y-6">
            <h2 className="text-xl font-black tracking-tight text-left">Discover Everyone</h2>
            
            {loading ? (
              <div className="text-center mt-20 text-slate-500 text-sm animate-pulse">Loading feed...</div>
            ) : currentIndex < 0 || allUsers.length === 0 ? (
              <div className="text-center mt-20 text-slate-500 text-sm animate-pulse px-4">
                👋 You've caught up with everyone around you! Check back later for new match recommendations.
              </div>
            ) : (
              <div className="relative w-full h-[510px] flex items-center justify-center">
                {allUsers.map((u, index) => {
                  // Render only the top card and the underlying preview card for rendering efficiency
                  if (index < currentIndex - 1 || index > currentIndex) return null;
                  const isTopCard = index === currentIndex;

                  return (
                    <SwipeCard 
                      key={u.id}
                      userProfile={u}
                      isTop={isTopCard}
                      onSwipe={(direction) => handleSwipeAction(u.id, direction)}
                    />
                  );
                })}
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

// Dedicated Drag-and-Swipe Interactive Card Component
function SwipeCard({ userProfile, isTop, onSwipe }) {
  const controls = useAnimation();
  const x = useMotionValue(0);
  
  // Maps horizontal displacement values into explicit angular tilt rotations
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  
  // Creates matching dynamically changing text opacity flags for UI feedback labels
  const opacityLike = useTransform(x, [0, 100], [0, 1]);
  const opacityNope = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = async (event, info) => {
    const swipeThreshold = 140; // Pixels required to trigger swipe event
    
    if (info.offset.x > swipeThreshold) {
      // Swipe Right Dynamic Flyaway Action
      await controls.start({ x: 500, opacity: 0, transition: { duration: 0.2 } });
      onSwipe("like");
    } else if (info.offset.x < -swipeThreshold) {
      // Swipe Left Dynamic Flyaway Action
      await controls.start({ x: -500, opacity: 0, transition: { duration: 0.2 } });
      onSwipe("nope");
    } else {
      // Snap card back to dead center if threshold wasn't cleared
      controls.start({ x: 0, y: 0, transition: { type: "spring", stiffness: 300, damping: 20 } });
    }
  };

  const forceButtonSwipe = async (direction) => {
    if (!isTop) return;
    if (direction === "right") {
      await controls.start({ x: 500, opacity: 0, transition: { duration: 0.3 } });
      onSwipe("like");
    } else {
      await controls.start({ x: -500, opacity: 0, transition: { duration: 0.3 } });
      onSwipe("nope");
    }
  };

  return (
    <motion.div
      className="absolute w-full h-full flex flex-col justify-between"
      style={{ x, rotate, zIndex: isTop ? 10 : 1, pointerEvents: isTop ? "auto" : "none" }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      animate={controls}
    >
      <div className="relative w-full h-[440px] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 select-none">
        {/* Dynamic UI Overlay Status Badges */}
        {isTop && (
          <>
            <motion.div style={{ opacity: opacityLike }} className="absolute top-8 left-8 border-4 border-emerald-500 text-emerald-500 font-black text-2xl uppercase tracking-widest px-4 py-1.5 rounded-xl z-20 transform -rotate-12">
              LIKE
            </motion.div>
            <motion.div style={{ opacity: opacityNope }} className="absolute top-8 right-8 border-4 border-rose-500 text-rose-500 font-black text-2xl uppercase tracking-widest px-4 py-1.5 rounded-xl z-20 transform rotate-12">
              NOPE
            </motion.div>
          </>
        )}

        <img 
          src={userProfile.profilePic || getGenderAvatar(userProfile.gender)} 
          alt={userProfile.displayName}
          className="w-full h-full object-cover pointer-events-none"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none"></div>

        <div className="absolute bottom-0 left-0 right-0 p-6 text-left space-y-2 pointer-events-none">
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-black text-white tracking-tight">{userProfile.displayName || "Anonymous"}</h3>
            {userProfile.age && <span className="text-xl text-slate-300 font-medium">{userProfile.age}</span>}
          </div>
          <p className="text-xs text-rose-400 font-bold tracking-wide">📍 {userProfile.country || "Kenya"}</p>
          <p className="text-sm text-slate-200 font-normal line-clamp-2 leading-relaxed">{userProfile.bio || "No bio added yet."}</p>
          
          {userProfile.interests && userProfile.interests.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {userProfile.interests.slice(0, 3).map((interest) => (
                <span key={interest} className="text-[10px] font-extrabold bg-white/10 backdrop-blur-md text-white px-2.5 py-1 rounded-full border border-white/10">
                  {interest}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Manual Hardware Click Action Utility Buttons */}
      {isTop && (
        <div className="flex items-center justify-center gap-6 pt-2 z-30">
          <button 
            type="button"
            onClick={() => forceButtonSwipe("left")}
            className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center text-rose-500 text-lg shadow-xl hover:scale-105 active:scale-95 transition"
          >
            ✕
          </button>
          <button 
            type="button"
            onClick={() => forceButtonSwipe("right")}
            className="w-12 h-12 bg-gradient-to-r from-rose-500 to-pink-600 rounded-full flex items-center justify-center text-white text-lg shadow-xl hover:scale-105 active:scale-95 transition"
          >
            ❤️
          </button>
        </div>
      )}
    </motion.div>
  );
}

function MessagesView({ user, onUpgrade }) {
  const userTier = user?.tier?.toLowerCase() || "free";
  const isPremium = userTier === "premium" || userTier === "plus" || userTier === "basic";

  if (!isPremium) {
    return (
      <div className="p-0 max-w-md mx-auto text-white rounded-2xl mt-2">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-3 text-xl border border-rose-500/20">🔒</div>
          <h2 className="text-2xl font-black text-white tracking-tight">Upgrade to Chat</h2>
          <p className="text-slate-400 mt-1 text-xs leading-relaxed max-w-xs mx-auto">Match for free, but unlock a tier layout to start conversation threads.</p>
        </div>
        
        <div className="space-y-4">
          <div className="border border-slate-800 bg-slate-900/40 p-5 rounded-2xl flex flex-col justify-between">
            <div>
              <h3 className="text-md font-black tracking-tight">Tier 2: Basic</h3>
              <p className="text-lg font-black mt-0.5 text-rose-400">KES 299</p>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">Up to 4 Photos, Expanded Profile Views, More Messaging Actions.</p>
            </div>
            <button onClick={() => onUpgrade('basic')} className="mt-4 w-full py-2.5 bg-rose-600 rounded-xl font-black hover:bg-rose-700 transition active:scale-[0.99] text-xs tracking-wider uppercase">Upgrade Basic</button>
          </div>

          <div className="border border-slate-800 bg-slate-900/40 p-5 rounded-2xl flex flex-col justify-between">
            <div>
              <h3 className="text-md font-black tracking-tight text-yellow-500">Tier 3: Plus</h3>
              <p className="text-lg font-black mt-0.5 text-yellow-500">KES 499</p>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">Up to 8 Photos, 100 Profile Views per day, 10 Active Chat Threads.</p>
            </div>
            <button onClick={() => onUpgrade('plus')} className="mt-4 w-full py-2.5 bg-yellow-600 text-slate-950 rounded-xl font-black hover:bg-yellow-500 transition active:scale-[0.99] text-xs tracking-wider uppercase">Upgrade Plus</button>
          </div>

          <div className="border border-rose-500/40 p-5 rounded-2xl flex flex-col justify-between relative bg-gradient-to-b from-slate-900 to-rose-950/20 shadow-xl shadow-rose-950/10">
            <span className="absolute -top-2.5 right-4 bg-rose-500 text-white text-[9px] px-2 py-0.5 rounded-full uppercase font-black tracking-widest">Best Value</span>
            <div>
              <h3 className="text-md font-black tracking-tight text-rose-400">Tier 4: Premium</h3>
              <p className="text-lg font-black mt-0.5 text-rose-400">KES 799</p>
              <p className="text-xs text-slate-200 mt-2 leading-relaxed">Unlimited HD Photos & Video, Unlimited Browsing + Rewinds, Priority Instant DM Delivery.</p>
            </div>
            <button onClick={() => onUpgrade('premium')} className="mt-4 w-full py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 rounded-xl font-black hover:opacity-90 transition active:scale-[0.99] text-xs tracking-wider uppercase shadow-lg shadow-rose-500/20">Upgrade Premium</button>
          </div>
        </div>
      </div>
    );
  }
  return <div className="text-center mt-20 text-slate-500 text-sm">Your inbox is empty. No new threads found.</div>;
}

// Unified User Profile Setup Component
function ProfileView({ userData, loading }) {
  if (loading) return <div className="text-center mt-10 text-slate-500 text-sm animate-pulse">Syncing user layout profile...</div>;
  
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black tracking-tight">My Profile</h2>
      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4 text-sm">
        <div className="flex justify-center mb-2">
          <img 
            src={userData?.profilePic || getGenderAvatar(userData?.gender)} 
            alt="My Avatar" 
            className="w-24 h-24 rounded-full object-cover border-2 border-rose-500/20 p-1"
          />
        </div>
        <p className="border-b border-slate-800 pb-2 text-slate-300"><strong className="text-white font-bold mr-1">Name:</strong> {userData?.displayName || "Not set"}</p>
        <p className="border-b border-slate-800 pb-2 text-slate-300"><strong className="text-white font-bold mr-1">Location:</strong> {userData?.country || "Kenya"}</p>
        <p className="text-slate-300 leading-relaxed"><strong className="text-white font-bold block mb-1">Bio:</strong> {userData?.bio || "No bio yet"}</p>
      </div>
      
      <button 
        onClick={() => window.location.href='/onboarding'} 
        className="w-full py-3 bg-slate-900 border border-slate-800 text-white rounded-xl font-black hover:bg-slate-850 transition active:scale-[0.99] tracking-wide text-sm"
      >
        Edit Profile Setup
      </button>
    </div>
  );
}