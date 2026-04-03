import { db } from "./config";
import { runTransaction, doc, collection, serverTimestamp } from "firebase/firestore";

/**
 * Atomically book a doctor slot.
 *
 * Guarantees:
 * - Only one patient can book a slot (server-side lock via transaction)
 * - If two patients try simultaneously, one gets a clean user-facing error
 * - The appointment record always includes both doctorId AND patientId
 */
export async function bookSlot(
    patientId: string,
    doctorId: string,
    dateStr: string,    // "yyyy-MM-dd"
    slotId: string,
    slotTime: string,   // ISO string
    reason: string
) {
    const slotRef = doc(db, `doctors/${doctorId}/availability/${dateStr}/slots/${slotId}`);

    await runTransaction(db, async (tx) => {
        const slotSnap = await tx.get(slotRef);

        if (!slotSnap.exists()) {
            throw new Error("This slot no longer exists. Please refresh and try again.");
        }

        if (!slotSnap.data().isOpen) {
            throw new Error("This slot was just booked. Please select a different time.");
        }

        // Atomic write 1: close the slot
        tx.update(slotRef, { isOpen: false });

        // Atomic write 2: create appointment (always includes patientId + doctorId)
        const apptRef = doc(collection(db, "appointments"));
        tx.set(apptRef, {
            patientId,          // ✅ required for patient queries
            doctorId,           // ✅ required for doctor queue queries
            slot: { time: slotTime, slotId },
            reason,
            status: "pending",
            notes: "",
            createdAt: new Date().toISOString(),
        });
    });
}

/**
 * Update appointment status — called by doctor on finalize.
 */
export async function finalizeAppointment(
    appointmentId: string,
    notes: string
) {
    const { updateDoc } = await import("firebase/firestore");
    const ref = doc(db, "appointments", appointmentId);
    await updateDoc(ref, {
        status: "completed",
        notes,
    });
}
