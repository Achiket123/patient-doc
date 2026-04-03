import { useEffect } from 'react';
import { auth, db } from '../services/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useAppStore, type Role } from '@/store';

export const useAuthListener = () => {
    const { setUser, setAuthLoading } = useAppStore();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    const userDocRef = doc(db, "users", firebaseUser.uid);
                    const userSnap = await getDoc(userDocRef);

                    if (userSnap.exists()) {
                        const data = userSnap.data();
                        setUser({
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            name: data.name || firebaseUser.displayName || '',
                            role: data.role as Role,
                            photoURL: data.photoURL || undefined
                        });
                    } else {
                        setUser(null);
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                    setUser(null);
                }
            } else {
                setUser(null);
            }
            setAuthLoading(false);
        });

        return () => unsubscribe();
    }, [setUser, setAuthLoading]);
};
