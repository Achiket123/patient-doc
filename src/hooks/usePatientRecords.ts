import { useEffect, useState } from 'react';
import { db } from '../services/firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export interface RecordItem {
    id: string;
    patientId: string;
    doctorId: string;
    type: 'prescription' | 'lab' | 'visit' | 'vital';
    title: string;
    details: string;
    date: string;
    createdAt: string;
}

export const usePatientRecords = (patientId: string | undefined) => {
    const [records, setRecords] = useState<RecordItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!patientId) {
            setLoading(false);
            return;
        }

        // Since hybrid collections are used, we fetch from prescriptions, labs, etc
        // For MVP scope and unified "Activity Feed", we can fetch prescriptions 
        const unsubscibes: (() => void)[] = [];
        let _recordsMap: Record<string, RecordItem> = {};

        const collectionsToFetch = ['prescriptions', 'labs', 'visits'];

        collectionsToFetch.forEach(colName => {
            const q = query(collection(db, colName), where('patientId', '==', patientId));
            const sub = onSnapshot(q, (snapshot) => {
                let changed = false;
                snapshot.docs.forEach(doc => {
                    _recordsMap[doc.id] = { id: doc.id, ...doc.data(), type: colName.replace(/s$/, '') } as any;
                    changed = true;
                });

                // Remove deleted
                snapshot.docChanges().forEach(change => {
                    if (change.type === 'removed') {
                        delete _recordsMap[change.doc.id];
                        changed = true;
                    }
                });

                if (changed) {
                    setRecords(Object.values(_recordsMap).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
                }
            });
            unsubscibes.push(sub);
        });

        setLoading(false);

        return () => {
            unsubscibes.forEach(unsub => unsub());
        };
    }, [patientId]);

    return { records, loading };
};
