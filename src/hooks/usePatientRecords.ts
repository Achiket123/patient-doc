import { useEffect, useState } from 'react';
import { db } from '../services/firebase/config';
import { collection, query, where, onSnapshot, limit } from 'firebase/firestore';

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

const PAGE_SIZE = 10;

export const usePatientRecords = (patientId: string | undefined) => {
    const [records, setRecords] = useState<RecordItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!patientId) {
            setLoading(false);
            return;
        }

        let _recordsMap: Record<string, RecordItem> = {};
        const unsubscribes: (() => void)[] = [];
        const collectionsToFetch = ['prescriptions', 'labs', 'visits'];

        collectionsToFetch.forEach(colName => {
            const q = query(
                collection(db, colName),
                where('patientId', '==', patientId),
                limit(PAGE_SIZE)
            );

            const sub = onSnapshot(q, (snapshot) => {
                snapshot.docChanges().forEach(change => {
                    if (change.type === 'removed') {
                        delete _recordsMap[change.doc.id];
                    } else {
                        _recordsMap[change.doc.id] = {
                            id: change.doc.id,
                            ...change.doc.data(),
                            type: colName.replace(/s$/, '') as any
                        } as RecordItem;
                    }
                });

                const sorted = Object.values(_recordsMap).sort(
                    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
                setRecords(sorted);
            }, (err) => {
                console.error(`[usePatientRecords] ${colName}:`, err);
            });

            unsubscribes.push(sub);
        });

        setLoading(false);
        return () => unsubscribes.forEach(u => u());
    }, [patientId]);

    return { records, loading };
};
