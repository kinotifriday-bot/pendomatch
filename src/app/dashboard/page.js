"use client";
import { useEffect, useState } from "react";
import { auth } from "../firebase"; // Reaches out to src/app/firebase.js
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setLoading(false);
      } else {
        // Bounces unauthorized traffic to the login page
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
      console.error("Error signing out:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <svg className="animate-spin h-10 w-10 text-blue-600 mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-sm font-medium text-slate-600">Verifying session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Mingle Workspace</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600 font-medium">{user?.email}</span>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
          >
            Sign out
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-8">
        <div className="bg-white border border-slate-100 p-8 rounded-2xl shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome Back!</h2>
          <p className="text-slate-600 text-sm max-w-xl">
            Your environment is completely set up and securely connected to Firebase. This workspace layout is protected from unauthenticated access.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="border border-slate-100 p-6 rounded-xl bg-slate-50/50">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Database State</span>
              <span className="text-sm font-semibold text-emerald-600 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" /> Firestore Ready
              </span>
            </div>
            <div className="border border-slate-100 p-6 rounded-xl bg-slate-50/50">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Storage Hub</span>
              <span className="text-sm font-semibold text-emerald-600 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" /> Cloud Buckets Bound
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}