"use client";
import { useState } from "react";
import { auth } from "../firebase"; // Reaches out to src/app/firebase.js
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Once logged in, smoothly transition them into the workspace dashboard
      router.push("/dashboard");
    } catch (err) {
      // Humanizing raw Firebase Auth system errors
      switch (err.code) {
        case "auth/invalid-credential":
        case "auth/user-not-found":
        case "auth/wrong-password":
          setError("Invalid email or password combination.");
          break;
        case "auth/too-many-requests":
          setError("This account has been temporarily locked due to too many failed attempts. Try again later.");
          break;
        default:
          setError("Failed to sign in. Please verify your details and try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        
        {/* Branding/Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Sign in to Mingle</h2>
          <p className="mt-2 text-sm text-slate-500">Welcome back! Please enter your credentials.</p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md text-sm text-red-700 animate-fade-in">
            <p className="font-medium">Authentication Error</p>
            <p>{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                disabled={isLoading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition disabled:bg-slate-50 disabled:text-slate-400"
                placeholder="name@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                required
                disabled={isLoading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition disabled:bg-slate-50 disabled:text-slate-400"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Action Trigger Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:bg-blue-400 disabled:cursor-not-allowed items-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Authenticating...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </div>
        </form>

        {/* Footer Navigation Switch */}
        <p className="text-center text-sm text-slate-600">
          Don't have an account yet?{" "}
          <Link href="/" className="font-semibold text-blue-600 hover:text-blue-500 transition">
            Register here
          </Link>
        </p>

      </div>
    </div>
  );
}