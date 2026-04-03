import { auth, db } from "./config";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import type { Role } from "@/store";

export const registerUser = async (email: string, password: string, name: string, role: Role) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await updateProfile(user, { displayName: name });

    // Store the user document
    const userDocRef = doc(db, "users", user.uid);
    await setDoc(userDocRef, {
        uid: user.uid,
        name,
        email,
        role,
        createdAt: new Date().toISOString(),
        photoURL: user.photoURL || null
    });

    // Also create base profiles for the chosen role
    if (role === 'patient') {
        await setDoc(doc(db, "patients", user.uid), {
            dob: null,
            bloodGroup: null,
            allergies: [],
            height: null,
            weight: null,
            insurance: {},
            emergencyContact: {}
        });
    } else if (role === 'doctor') {
        await setDoc(doc(db, "doctors", user.uid), {
            specialty: 'General Practice',
            qualifications: [],
            clinicName: 'Patient-Doc Clinic',
            rating: 5.0
        });
    }

    return { uid: user.uid, email, name, role };
};

export const loginUser = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userDocRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userDocRef);

    if (!userSnap.exists()) {
        throw new Error("User record not found in Firestore.");
    }

    const userData = userSnap.data();
    return {
        uid: user.uid,
        email: user.email,
        name: userData.name,
        role: userData.role as Role,
        photoURL: userData.photoURL
    };
};

export const logoutUser = async () => {
    return signOut(auth);
};
