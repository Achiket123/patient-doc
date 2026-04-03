"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginUser, registerUser } from "@/services/firebase/auth";
import { useAuthListener } from "@/hooks/useAuth";
import { useAppStore, type Role } from "@/store";

export default function AuthPage() {
  useAuthListener();
  const { user, isLoadingAuth } = useAppStore();
  const router = useRouter();

  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<Role>("patient");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.role === "patient") {
        router.push("/patient/home");
      } else if (user.role === "doctor") {
        router.push("/doctor/queue");
      }
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await loginUser(email, password);
      } else {
        await registerUser(email, password, name || "New User", role);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (isLoadingAuth || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="animate-pulse w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden bg-surface font-body text-on-surface">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/5 blur-3xl"></div>

      <div className="layout-container w-full max-w-[1100px] grid lg:grid-cols-2 bg-surface-container-lowest rounded-2xl overflow-hidden shadow-xl shadow-primary/5 relative z-10">
        <div className="hidden lg:flex flex-col justify-between p-12 bg-primary relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-container opacity-80"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 text-white mb-12">
              <div className="w-8 h-8">
                <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path clipRule="evenodd" d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z" fill="currentColor" fillRule="evenodd"></path>
                </svg>
              </div>
              <h1 className="font-headline text-2xl font-extrabold tracking-tight">HealthSync</h1>
            </div>
            <h2 className="font-headline text-4xl font-black text-white leading-tight mb-6">Advancing the future of clinical care.</h2>
            <p className="text-primary-fixed text-lg max-w-sm leading-relaxed">A unified digital ecosystem designed for seamless patient-provider collaboration and data-driven insights.</p>
          </div>
        </div>

        <div className="flex flex-col p-8 md:p-16 bg-surface-container-lowest">
          <div className="mb-8">
            <h3 className="font-headline text-3xl font-black text-on-surface mb-2">{isLogin ? "Welcome Back" : "Create Account"}</h3>
            <p className="text-on-surface-variant font-medium">{isLogin ? "Sign in to your clinical workspace" : "Register for a new account"}</p>
          </div>

          {!isLogin && (
            <div className="mb-8">
              <p className="text-xs font-bold text-outline mb-3 uppercase tracking-[0.1em]">Select Identity</p>
              <div className="flex bg-surface-container-low p-1.5 rounded-xl">
                <label className="flex-1 cursor-pointer">
                  <input type="radio" value="patient" checked={role === "patient"} onChange={() => setRole("patient")} className="sr-only peer" />
                  <div className="py-3 text-center rounded-lg font-semibold text-sm transition-all peer-checked:bg-surface-container-lowest peer-checked:text-primary peer-checked:shadow-sm text-outline">
                    Patient
                  </div>
                </label>
                <label className="flex-1 cursor-pointer">
                  <input type="radio" value="doctor" checked={role === "doctor"} onChange={() => setRole("doctor")} className="sr-only peer" />
                  <div className="py-3 text-center rounded-lg font-semibold text-sm transition-all peer-checked:bg-surface-container-lowest peer-checked:text-secondary peer-checked:shadow-sm text-outline">
                    Doctor
                  </div>
                </label>
              </div>
            </div>
          )}

          {error && <div className="mb-4 text-sm text-error font-medium p-3 rounded-lg bg-error-container">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-outline uppercase tracking-[0.1em] ml-1">Full Name</label>
                <input required value={name} onChange={e => setName(e.target.value)} type="text" placeholder="Dr. John Doe / Jane Doe" className="w-full bg-surface-container-low border-none rounded-xl py-4 px-5 text-on-surface placeholder:text-outline/60 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all outline-none" />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-outline uppercase tracking-[0.1em] ml-1">Email Address</label>
              <input required value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="e.g. name@clinic.com" className="w-full bg-surface-container-low border-none rounded-xl py-4 px-5 text-on-surface placeholder:text-outline/60 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all outline-none" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-bold text-outline uppercase tracking-[0.1em]">Password</label>
              </div>
              <input required value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="••••••••" className="w-full bg-surface-container-low border-none rounded-xl py-4 px-5 pr-12 text-on-surface placeholder:text-outline/60 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all outline-none" />
            </div>

            <div className="pt-4">
              <button disabled={loading} type="submit" className="w-full bg-gradient-to-br from-primary to-primary-container text-on-primary font-headline font-bold py-4 rounded-xl shadow-lg shadow-primary/20 hover:opacity-95 transition-all outline-none disabled:opacity-50">
                {loading ? "Processing..." : isLogin ? "Sign into Dashboard" : "Register"}
              </button>
            </div>
          </form>

          <div className="mt-8 pt-8 border-t border-surface-container-high text-center">
            <p className="text-on-surface-variant text-sm">
              {isLogin ? "New to HealthSync?" : "Already have an account?"}
              <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-primary font-bold hover:underline ml-1">
                {isLogin ? "Create an account" : "Sign in here"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
