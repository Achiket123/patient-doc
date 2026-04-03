import { db } from "./config";
import { collection, addDoc, doc, updateDoc, writeBatch } from "firebase/firestore";
import { format } from "date-fns";

/**
 * Add a health record to a top-level collection (prescriptions / labs / visits).
 */
export async function addRecord(
    type: "prescriptions" | "labs" | "visits",
    patientId: string,
    doctorId: string,
    title: string,
    details: string
) {
    const now = new Date().toISOString();
    await addDoc(collection(db, type), {
        patientId,
        doctorId,
        title,
        details,
        date: now,
        createdAt: now,
    });
}

/**
 * Generate a full day of 30-min slots for a doctor.
 * Uses writeBatch to atomically write all slots at once.
 */
export async function generateDoctorSlots(
    doctorId: string,
    date: Date,
    times: string[]  // ISO time strings
) {
    const batch = writeBatch(db);
    const dateStr = format(date, "yyyy-MM-dd");

    times.forEach((isoTime) => {
        // Use the time string as ID — unique per slot, deterministic, human-readable
        // e.g. "2026-04-03T09:00:00.000Z" → "2026-04-03T09-00-00-000Z"
        const slotId = isoTime.replace(/[:.]/g, '-');
        const slotRef = doc(db, `doctors/${doctorId}/availability/${dateStr}/slots/${slotId}`);
        batch.set(slotRef, { time: isoTime, isOpen: true });
    });

    await batch.commit();
}
