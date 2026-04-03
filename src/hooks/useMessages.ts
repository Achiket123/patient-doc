import { useEffect, useState } from 'react';
import { db } from '../services/firebase/config';
import {
    collection, query, where, onSnapshot, orderBy,
    limit, limitToLast, endBefore, startAfter, doc, getDocs, addDoc, updateDoc
} from 'firebase/firestore';

export interface ChatThread {
    id: string;
    participants: string[];
    lastMessage: string;
    updatedAt: string;
}

export interface ChatMessage {
    id: string;
    senderId: string;
    content: string;
    timestamp: string;
}

const PAGE_SIZE = 20;

export const useChatThreads = (userId: string | undefined) => {
    const [threads, setThreads] = useState<ChatThread[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) { setLoading(false); return; }

        const q = query(
            collection(db, 'chats'),
            where('participants', 'array-contains', userId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const results: ChatThread[] = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ChatThread));
            results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
            setThreads(results);
            setLoading(false);
        }, (err) => {
            console.error('[useChatThreads]', err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    return { threads, loading };
};

export const useChatMessages = (chatId: string | null) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(false);
    const [oldestDoc, setOldestDoc] = useState<any>(null);

    useEffect(() => {
        if (!chatId) { setMessages([]); setLoading(false); return; }

        setLoading(true);
        setOldestDoc(null);

        // Real-time listener for the latest PAGE_SIZE messages
        const q = query(
            collection(db, `chats/${chatId}/messages`),
            orderBy('timestamp', 'asc'),
            limitToLast(PAGE_SIZE)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const results: ChatMessage[] = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage));
            setMessages(results);
            setHasMore(snapshot.docs.length === PAGE_SIZE);
            if (snapshot.docs.length > 0) setOldestDoc(snapshot.docs[0]);
            setLoading(false);
        }, (err) => {
            console.error('[useChatMessages]', err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [chatId]);

    // Load older messages — paginate backwards
    const loadMore = async () => {
        if (!chatId || !oldestDoc) return;
        const q = query(
            collection(db, `chats/${chatId}/messages`),
            orderBy('timestamp', 'asc'),
            endBefore(oldestDoc),
            limitToLast(PAGE_SIZE)
        );
        const snapshot = await getDocs(q);
        const older = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage));
        setMessages(prev => [...older, ...prev]);
        setHasMore(snapshot.docs.length === PAGE_SIZE);
        if (snapshot.docs.length > 0) setOldestDoc(snapshot.docs[0]);
    };

    const sendMessage = async (senderId: string, content: string) => {
        if (!chatId) return;

        // Optimistic UI — insert immediately, rollback on failure
        const tempId = `temp_${Date.now()}`;
        const now = new Date().toISOString();
        setMessages(prev => [...prev, { id: tempId, senderId, content, timestamp: now }]);

        try {
            await addDoc(collection(db, `chats/${chatId}/messages`), { senderId, content, timestamp: now });
            await updateDoc(doc(db, 'chats', chatId), { lastMessage: content, updatedAt: now });
        } catch (e) {
            console.error('[sendMessage] failed:', e);
            setMessages(prev => prev.filter(m => m.id !== tempId)); // rollback
        }
    };

    return { messages, loading, hasMore, loadMore, sendMessage };
};
