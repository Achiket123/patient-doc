import { useEffect, useState } from 'react';
import { db } from '../services/firebase/config';
import { collection, query, where, onSnapshot, orderBy, doc, getDocs, addDoc, updateDoc } from 'firebase/firestore';

export interface ChatThread {
    id: string;
    participants: string[]; // [uid1, uid2]
    lastMessage: string;
    updatedAt: string; // ISO string
}

export interface ChatMessage {
    id: string;
    senderId: string;
    content: string;
    timestamp: string;
}

export const useChatThreads = (userId: string | undefined) => {
    const [threads, setThreads] = useState<ChatThread[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'chats'),
            where('participants', 'array-contains', userId)
            // Ordering by updatedAt requires composite index: participants + updatedAt DESC
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const results: ChatThread[] = [];
            snapshot.forEach(doc => {
                results.push({ id: doc.id, ...doc.data() } as ChatThread);
            });
            results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

            setThreads(results);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    return { threads, loading };
};

export const useChatMessages = (chatId: string | null) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!chatId) {
            setMessages([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const q = query(
            collection(db, `chats/${chatId}/messages`)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const results: ChatMessage[] = [];
            snapshot.forEach(doc => {
                results.push({ id: doc.id, ...doc.data() } as ChatMessage);
            });
            // Sort in client
            results.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

            setMessages(results);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [chatId]);

    const sendMessage = async (senderId: string, content: string) => {
        if (!chatId) return;

        // Optimistic UI updates
        const tempId = Date.now().toString();
        const newMsg: ChatMessage = {
            id: tempId,
            senderId,
            content,
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, newMsg]);

        try {
            const msgsRef = collection(db, `chats/${chatId}/messages`);
            await addDoc(msgsRef, {
                senderId,
                content,
                timestamp: new Date().toISOString()
            });

            const chatRef = doc(db, 'chats', chatId);
            await updateDoc(chatRef, {
                lastMessage: content,
                updatedAt: new Date().toISOString()
            });
        } catch (e) {
            console.error(e);
            // rollback could be applied here
        }
    };

    return { messages, loading, sendMessage };
};
