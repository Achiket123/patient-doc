"use client";

import { useAppStore } from "@/store";
import { useState, useEffect } from "react";
import { format, addDays } from "date-fns";
import { db } from "@/services/firebase/config";
import { doc, writeBatch, collection, onSnapshot } from "firebase/firestore";

export default function DoctorSchedule() {
    const { user } = useAppStore();

    const dates = Array.from({ length: 14 }).map((_, i) => addDays(new Date(), i));
    const [selectedDate, setSelectedDate] = useState<Date>(dates[0]);

    const [slots, setSlots] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        if (!user || !selectedDate) return;
        setLoading(true);
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const slotsRef = collection(db, `doctors/${user.uid}/availability/${dateStr}/slots`);

        const unsubscribe = onSnapshot(slotsRef, (snap) => {
            const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            fetched.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
            setSlots(fetched);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, selectedDate]);

    const convertTo24 = (time: string, dateObj: Date) => {
        // time e.g "09:00 AM"
        const [hm, ampm] = time.split(' ');
        const [h, m] = hm.split(':');
        let hr = parseInt(h);
        if (ampm === 'PM' && hr !== 12) hr += 12;
        if (ampm === 'AM' && hr === 12) hr = 0;

        const d = new Date(dateObj);
        d.setHours(hr, parseInt(m), 0, 0);
        return d.toISOString();
    };

    const generateDefaultSlots = async () => {
        if (!user) return;
        setGenerating(true);
        const times = [
            "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
            "11:00 AM", "11:30 AM", "01:00 PM", "01:30 PM",
            "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM"
        ];

        try {
            const batch = writeBatch(db);
            const dateStr = format(selectedDate, 'yyyy-MM-dd');

            times.forEach(t => {
                const isoTime = convertTo24(t, selectedDate);
                const slotId = Date.now().toString() + Math.random().toString(36).substring(7);
                const slotRef = doc(db, `doctors/${user.uid}/availability/${dateStr}/slots`, slotId);
                batch.set(slotRef, {
                    time: isoTime,
                    isOpen: true
                });
            });

            await batch.commit();
        } catch (e) {
            console.error(e);
        } finally {
            setGenerating(false);
        }
    };

    const toggleSlot = async (slotId: string, currentOpen: boolean) => {
        if (!user) return;
        try {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const batch = writeBatch(db); // use batch or single doc update
            const slotRef = doc(db, `doctors/${user.uid}/availability/${dateStr}/slots`, slotId);
            batch.update(slotRef, { isOpen: !currentOpen });
            await batch.commit();
        } catch (e) {
            console.error("Failed to toggle slot:", e);
        }
    };

    if (!user) return null;

    return (
        <div className="flex-1 max-w-4xl mx-auto w-full space-y-10">
            <header className="mb-8">
                <h1 className="font-headline text-2xl font-extrabold tracking-tight text-on-surface">Schedule Management</h1>
                <p className="text-on-surface-variant">Configure your availability for patient appointments.</p>
            </header>

            {/* Date Strip */}
            <section className="space-y-4">
                <h2 className="font-headline text-lg font-bold px-1">Select Date to Configure</h2>
                <div className="bg-surface-container-low rounded-xl p-2 flex gap-2 overflow-x-auto no-scrollbar">
                    {dates.map((date, idx) => {
                        const isSelected = format(selectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
                        return (
                            <button
                                key={idx}
                                onClick={() => setSelectedDate(date)}
                                className={`flex flex-col items-center justify-center min-w-[70px] py-3 rounded-lg transition-colors ${isSelected ? 'bg-surface-container-lowest shadow-sm border-b-4 border-secondary text-secondary' : 'hover:bg-surface-container-high'
                                    }`}>
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${isSelected ? 'text-outline' : 'text-outline'}`}>{format(date, 'EEE')}</span>
                                <span className={`font-headline text-xl font-bold ${isSelected ? 'text-secondary' : 'text-on-surface'}`}>{format(date, 'dd')}</span>
                                <span className={`text-[10px] font-bold ${isSelected ? 'text-secondary' : 'text-outline'}`}>{format(date, 'MMM')}</span>
                            </button>
                        )
                    })}
                </div>
            </section>

            <section className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm border border-outline-variant/10">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="font-headline text-lg font-bold">Time Slots for {format(selectedDate, 'MMM dd, yyyy')}</h2>
                        <p className="text-sm text-outline">Active slots will be visible to patients during booking.</p>
                    </div>
                    <button disabled={generating} onClick={generateDefaultSlots} className="bg-secondary text-on-secondary px-4 py-2 flex items-center gap-2 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
                        <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                        Auto Generate Shift
                    </button>
                </div>

                {loading ? (
                    <div className="animate-pulse space-y-4">
                        <div className="h-10 bg-surface-container-low rounded-xl"></div>
                        <div className="h-10 bg-surface-container-low rounded-xl"></div>
                    </div>
                ) : slots.length === 0 ? (
                    <div className="text-center py-10 bg-surface-container-low rounded-xl border border-dashed border-outline-variant/30">
                        <span className="material-symbols-outlined text-4xl text-outline mb-2">event_busy</span>
                        <p className="font-bold">No slots configured for this date.</p>
                        <p className="text-sm text-outline mt-1">Click 'Auto Generate Shift' to load standard availability.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {slots.map(slot => (
                            <button
                                key={slot.id}
                                onClick={() => toggleSlot(slot.id, slot.isOpen)}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${slot.isOpen
                                        ? 'bg-primary-fixed/20 border-primary cursor-pointer text-on-surface hover:bg-primary-fixed/30'
                                        : 'bg-surface-container-high border-transparent text-outline cursor-pointer opacity-70 hover:opacity-100'
                                    }`}
                            >
                                <span className="font-bold">{format(new Date(slot.time), 'hh:mm a')}</span>
                                <span className="text-[10px] uppercase font-bold mt-1 tracking-wider">{slot.isOpen ? 'Active' : 'Disabled'}</span>
                            </button>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
