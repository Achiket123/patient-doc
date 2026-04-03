"use client";

import { useAppStore } from "@/store";
import { logoutUser } from "@/services/firebase/auth";
import { useRouter } from "next/navigation";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function PatientLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();

    const handleLogout = async () => {
        await logoutUser();
        router.push("/");
    };

    return (
        <div className="relative flex h-auto min-h-screen w-full flex-col bg-background group/design-root overflow-x-hidden font-body">
            <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-outline-variant/20 px-6 py-4 md:px-10 lg:px-40 bg-surface">
                <div className="flex items-center gap-4 text-primary">
                    <div className="w-6 h-6">
                        <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                            <path clipRule="evenodd" d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z" fillRule="evenodd"></path>
                        </svg>
                    </div>
                    <h2 className="text-on-background text-xl font-headline font-extrabold leading-tight tracking-[-0.015em]">HealthSync</h2>
                </div>
                <div className="flex gap-3">
                    <button className="flex w-10 h-10 items-center justify-center rounded-xl bg-surface-container-low text-on-surface hover:bg-surface-container-high transition-colors">
                        <span className="material-symbols-outlined">notifications</span>
                    </button>
                    <button onClick={handleLogout} title="Sign Out" className="flex w-10 h-10 items-center justify-center rounded-xl bg-surface-container-low text-on-surface hover:bg-surface-container-high transition-colors">
                        <span className="material-symbols-outlined">logout</span>
                    </button>
                </div>
            </header>

            <main className="flex-1 px-6 py-8 md:px-10 lg:px-40 max-w-[1440px] mx-auto w-full">
                <ErrorBoundary>{children}</ErrorBoundary>
            </main>

            <footer className="mt-12 bg-surface-container-low border-t border-outline-variant/10 py-10 px-6 md:px-10 lg:px-40">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2 text-primary/60">
                        <span className="material-symbols-outlined">verified_user</span>
                        <span className="text-xs font-medium">HIPAA Compliant & Encrypted Data</span>
                    </div>
                    <div className="flex gap-8 text-xs font-bold text-on-surface-variant">
                        <a className="hover:text-primary transition-colors" href="#">Privacy Policy</a>
                        <a className="hover:text-primary transition-colors" href="#">Terms of Service</a>
                        <a className="hover:text-primary transition-colors" href="#">Help Center</a>
                    </div>
                    <p className="text-[10px] text-on-surface-variant/60 font-medium">© 2023 HealthSync Medical Group. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
