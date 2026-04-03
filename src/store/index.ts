import { create } from 'zustand';

export type Role = 'patient' | 'doctor';

interface UserData {
    uid: string;
    email: string | null;
    name: string;
    role: Role | null;
    photoURL?: string;
}

interface AppState {
    user: UserData | null;
    isLoadingAuth: boolean;
    setUser: (user: UserData | null) => void;
    setAuthLoading: (loading: boolean) => void;
    clearAuth: () => void;

    // Minimal cache to avoid redundant reads
    doctorsCache: any[];
    setDoctorsCache: (doctors: any[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
    user: null,
    isLoadingAuth: true,
    setUser: (user) => set({ user, isLoadingAuth: false }),
    setAuthLoading: (loading) => set({ isLoadingAuth: loading }),
    clearAuth: () => set({ user: null, isLoadingAuth: false }),

    doctorsCache: [],
    setDoctorsCache: (doctors) => set({ doctorsCache: doctors }),
}));
