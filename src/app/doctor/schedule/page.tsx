"use client";

import { useAppStore } from "@/store";
import { useState, useEffect } from "react";
import { format, addDays } from "date-fns";
import { db } from "@/services/firebase/config";
import {
    collection,
    onSnapshot,
    query,
    where
} from "firebase/firestore";
import { bookSlot } from "@/services/firebase/appointments";

type Slot = {
    id: string;
    time: string;
    isOpen: boolean;
};

export default function BookAppointment() {
    const { user } = useAppStore();

    const dates = Array.from({ length: 7 }).map((_, i) =>
        addDays(new Date(), i)
    );

    const [selectedDate, setSelectedDate] = useState<Date>(dates[0]);
    const [selectedDoctor, setSelectedDoctor] = useState<string>("");

    const [slots, setSlots] = useState<Slot[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    // 🔥 Fetch slots
    useEffect(() => {
        if (!selectedDoctor || !selectedDate) return;

        setLoadingSlots(true);

        const dateStr = format(selectedDate, "yyyy-MM-dd");

        const slotsRef = collection(
            db,
            `doctors/${selectedDoctor}/availability/${dateStr}/slots`
        );

        const unsubscribe = onSnapshot(slotsRef, (snap) => {
            const fetchedSlots: Slot[] = snap.docs.map((doc) => {
                const data = doc.data() as {
                    time?: string;
                    isOpen?: boolean;
                };

                return {
                    id: doc.id,
                    time: data.time ?? "",
                    isOpen: data.isOpen ?? false
                };
            });

            // ✅ SAFE SORT
            fetchedSlots.sort(
                (a, b) =>
                    new Date(a.time).getTime() -
                    new Date(b.time).getTime()
            );

            setSlots(fetchedSlots);
            setLoadingSlots(false);
        });

        return () => unsubscribe();
    }, [selectedDoctor, selectedDate]);

    // 🔥 Handle booking
    const handleBook = async (slot: Slot) => {
        if (!user || !selectedDoctor) return;

        try {
            await bookSlot(selectedDoctor, slot.id);
            alert("Appointment booked!");
        } catch (e) {
            console.error(e);
            alert("Booking failed");
        }
    };

    if (!user) return null;

    return (
        <div className="max-w-4xl mx-auto w-full space-y-8">

            {/* Doctor Select (TEMP SIMPLE) */}
            <div>
                <input
                    placeholder="Enter Doctor ID"
                    value={selectedDoctor}
                    onChange={(e) => setSelectedDoctor(e.target.value)}
                    className="border p-2 rounded"
                />
            </div>

            {/* Date Selector */}
            <div className="flex gap-2 overflow-x-auto">
                {dates.map((date, idx) => (
                    <button
                        key={idx}
                        onClick={() => setSelectedDate(date)}
                        className="px-3 py-2 border rounded"
                    >
                        {format(date, "dd MMM")}
                    </button>
                ))}
            </div>

            {/* Slots */}
            {loadingSlots ? (
                <p>Loading slots...</p>
            ) : (
                <div className="grid grid-cols-3 gap-3">
                    {slots.map((slot) => (
                        <button
                            key={slot.id}
                            disabled={!slot.isOpen}
                            onClick={() => handleBook(slot)}
                            className={`p-3 rounded border ${slot.isOpen
                                    ? "bg-green-100"
                                    : "bg-gray-200 cursor-not-allowed"
                                }`}
                        >
                            {slot.time &&
                                format(new Date(slot.time), "hh:mm a")}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}