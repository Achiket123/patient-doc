import { useEffect, useState } from 'react';
import { db } from '../services/firebase/config';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';

export interface Appointment {
    id: string;
    patientId: string;
    doctorId: string;
    slot: { time: string }; // ISO string format
    reason: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    notes: string;
}

export const useAppointments = (userId: string | undefined, role: 'patient' | 'doctor' | undefined) => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userId || !role) {
            setLoading(false);
            return;
        }

        const appointmentsRef = collection(db, 'appointments');
        const fieldMatch = role === 'patient' ? 'patientId' : 'doctorId';

        // We filter by role and order by slot time. Note: requires composite index.
        const q = query(
            appointmentsRef,
            where(fieldMatch, '==', userId),
            where('status', 'in', ['pending', 'confirmed'])
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const results: Appointment[] = [];
            snapshot.forEach(doc => {
                results.push({ id: doc.id, ...doc.data() } as Appointment);
            });
            // Sort by time in client to avoid immediate index requirement blocking execution
            results.sort((a, b) => new Date(a.slot.time).getTime() - new Date(b.slot.time).getTime());

            setAppointments(results);
            setLoading(false);
        }, (err) => {
            console.error(err);
            setError(err.message);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId, role]);

    return { appointments, loading, error };
};
