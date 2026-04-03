import { db } from "./config";
import { doc, setDoc, addDoc, collection, serverTimestamp, updateDoc } from "firebase/firestore";

/**
 * Get or create a chat thread between two users.
 * Uses a deterministic ID (sorted UIDs joined by "_") so only ONE thread
 * ever exists between any two users — no duplicates possible.
 */
export async function getOrCreateThread(uid1: string, uid2: string): Promise<string> {
    const threadId = [uid1, uid2].sort().join("_");
    const ref = doc(db, "chats", threadId);

    // setDoc with merge:true creates the doc if missing, updates if exists
    await setDoc(ref, {
        participants: [uid1, uid2],
        lastMessage: "",
        updatedAt: new Date().toISOString(),
    }, { merge: true });

    return threadId;
}

/**
 * Send a message inside a chat thread.
 * Also updates thread's lastMessage + updatedAt for inbox ordering.
 */
export async function sendMessage(threadId: string, senderId: string, content: string) {
    const now = new Date().toISOString();

    await addDoc(collection(db, "chats", threadId, "messages"), {
        senderId,
        content,
        timestamp: now,
    });

    // Update thread metadata so inbox list sorts correctly
    await updateDoc(doc(db, "chats", threadId), {
        lastMessage: content,
        updatedAt: now,
    });
}
