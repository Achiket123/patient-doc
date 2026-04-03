"use client";

import { useAppStore } from "@/store";
import { logoutUser } from "@/services/firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { user } = useAppStore();

    const handleLogout = async () => {
        await logoutUser();
        router.push("/");
    };

    return (
        <div className="relative flex h-auto min-h-screen w-full flex-col bg-background group/design-root overflow-x-hidden font-body text-on-surface">
            <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-outline-variant/20 px-6 py-4 md:px-10 lg:px-40 bg-surface z-50 sticky top-0">
                <div className="flex items-center gap-6">
                    <Link href="/doctor/queue" className="flex items-center gap-4 text-secondary">
                        <div className="w-6 h-6">
                            <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                <path clipRule="evenodd" d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z" fillRule="evenodd"></path>
                            </svg>
                        </div>
                        <h2 className="text-on-background text-xl font-headline font-extrabold leading-tight tracking-[-0.015em] hidden sm:block">HealthSync <span className="text-sm text-outline font-medium">Provider</span></h2>
                    </Link>

                    <nav className="hidden md:flex items-center gap-6 text-sm font-bold ml-8">
                        <Link href="/doctor/queue" className="text-secondary hover:text-secondary-container transition-colors">Queue</Link>
                        <Link href="/doctor/messages" className="text-on-surface-variant hover:text-secondary transition-colors">Messages</Link>
                        <Link href="/doctor/schedule" className="text-on-surface-variant hover:text-secondary transition-colors">Schedule</Link>
                    </nav>
                </div>

                <div className="flex gap-3 items-center">
                    <div className="hidden sm:flex flex-col items-end mr-2">
                        <span className="text-sm font-bold">Dr. {user?.name}</span>
                        <span className="text-[10px] uppercase tracking-wider text-outline">Active</span>
                    </div>
                    <button className="flex w-10 h-10 items-center justify-center rounded-xl bg-surface-container-low text-on-surface hover:bg-surface-container-high transition-colors">
                        <span className="material-symbols-outlined">notifications</span>
                    </button>
                    <button onClick={handleLogout} title="Sign Out" className="flex w-10 h-10 items-center justify-center rounded-xl bg-surface-container-low text-on-surface hover:bg-surface-container-high transition-colors">
                        <span className="material-symbols-outlined">logout</span>
                    </button>
                </div>
            </header>

            <main className="flex-1 px-6 py-8 md:px-10 lg:px-40 max-w-[1440px] mx-auto w-full">
                {children}
            </main>
        </div>
    );
}
