"use client";

import { useAppStore } from "@/store";
import { db } from "@/services/firebase/config";
import { useEffect, useState } from "react";
import { collection, query, getDocs, onSnapshot, runTransaction, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { format, addDays } from "date-fns";
import Link from "next/link";

type Slot = {
    id: string;
    time: string;
    isOpen: boolean;
};

export default function BookAppointment() {
    const { user } = useAppStore();
    const router = useRouter();

    const [doctors, setDoctors] = useState<any[]>([]);
    const [loadingDoctors, setLoadingDoctors] = useState(true);

    const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);

    // Create next 7 days
    const dates = Array.from({ length: 6 }).map((_, i) => addDays(new Date(), i));
    const [selectedDate, setSelectedDate] = useState<Date>(dates[0]);

    const [slots, setSlots] = useState<Slot[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

    const [reason, setReason] = useState("");
    const [bookingStatus, setBookingStatus] = useState<'' | 'loading' | 'error' | 'success'>('');
    const [errorMsg, setErrorMsg] = useState('');

    // 1. Fetch Doctors Globally
    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const snap = await getDocs(collection(db, "doctors"));
                const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                setDoctors(docs);
                if (docs.length > 0) setSelectedDoctorId(docs[0].id);
            } catch (e) {
                console.error("Failed to fetch doctors", e);
            } finally {
                setLoadingDoctors(false);
            }
        };
        fetchDoctors();
    }, []);

    // 2. Real-time fetch Slots for selected doctor & date
    useEffect(() => {
        if (!selectedDoctorId || !selectedDate) return;

        setLoadingSlots(true);
        setSelectedSlotId(null);
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const slotsRef = collection(db, `doctors/${selectedDoctorId}/availability/${dateStr}/slots`);

        const unsubscribe = onSnapshot(slotsRef, (snap) => {
            const fetchedSlots: Slot[] = snap.docs.map(doc => {
                const data = doc.data() as { time?: string; isOpen?: boolean };
                return {
                    id: doc.id,
                    time: data.time ?? "",
                    isOpen: data.isOpen ?? false
                };
            });
            // Sort by time
            fetchedSlots.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
            setSlots(fetchedSlots);
            setLoadingSlots(false);
        });

        return () => unsubscribe();
    }, [selectedDoctorId, selectedDate]);

    // 3. Atomic Booking Transaction
    const handleBooking = async () => {
        if (!selectedDoctorId || !selectedSlotId || !reason || !user) {
            setErrorMsg("Please fill all required fields.");
            return;
        }

        setBookingStatus('loading');
        const dateStr = format(selectedDate, 'yyyy-MM-dd');

        try {
            await runTransaction(db, async (transaction) => {
                const slotPath = `doctors/${selectedDoctorId}/availability/${dateStr}/slots/${selectedSlotId}`;
                const slotRef = doc(db, slotPath);

                const slotDoc = await transaction.get(slotRef);
                if (!slotDoc.exists()) {
                    throw new Error("Slot does not exist.");
                }

                const data = slotDoc.data();
                if (!data.isOpen) {
                    throw new Error("Sorry, this slot was just booked by someone else.");
                }

                // 1. Mark as unavailable atomically
                transaction.update(slotRef, { isOpen: false });

                // 2. Create the appointment record atomically
                const newApptRef = doc(collection(db, "appointments"));
                transaction.set(newApptRef, {
                    patientId: user.uid,
                    doctorId: selectedDoctorId,
                    slot: data, // includes time string
                    reason,
                    status: 'pending',
                    notes: ''
                });
            });

            setBookingStatus('success');
            setTimeout(() => router.push("/patient/home"), 2000);
        } catch (e: any) {
            setBookingStatus('error');
            setErrorMsg(e.message || "Failed to book appointment.");
        }
    };

    const selectedDoctor = doctors.find(d => d.id === selectedDoctorId);
    const selectedSlot = slots.find(s => s.id === selectedSlotId);

    return (
        <div className="flex-1 max-w-4xl mx-auto w-full space-y-10">
            <header className="flex items-center justify-between mb-8 sticky top-0 z-50 bg-background/80 backdrop-blur-md py-4">
                <div className="flex items-center gap-4">
                    <Link href="/patient/home" className="p-2 hover:bg-surface-container-low rounded-full transition-colors">
                        <span className="material-symbols-outlined text-primary">arrow_back</span>
                    </Link>
                    <h1 className="font-headline text-xl font-bold tracking-tight text-on-surface">Book Appointment</h1>
                </div>
            </header>

            {bookingStatus === 'error' && (
                <div className="p-4 bg-error-container text-error rounded-xl text-sm font-semibold mb-4 mx-1">
                    {errorMsg}
                </div>
            )}

            {bookingStatus === 'success' && (
                <div className="p-4 bg-primary-fixed text-on-primary-fixed-variant rounded-xl text-sm font-semibold mb-4 mx-1">
                    Appointment pending! Redirecting you to the dashboard...
                </div>
            )}

            {/* Doctor List */}
            <section className="space-y-4">
                <h2 className="font-headline text-lg font-bold px-1">Available Doctors</h2>
                {loadingDoctors ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="animate-pulse bg-surface-container-low h-24 rounded-xl"></div>
                        <div className="animate-pulse bg-surface-container-low h-24 rounded-xl"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {doctors.map(doctor => (
                            <label key={doctor.id} className="relative group cursor-pointer" onClick={() => setSelectedDoctorId(doctor.id)}>
                                <input type="radio" name="doctor" className="peer sr-only" checked={selectedDoctorId === doctor.id} onChange={() => { }} />
                                <div className="p-4 rounded-xl bg-surface-container-low border-2 border-transparent peer-checked:border-primary peer-checked:bg-surface-container-lowest peer-checked:medical-glow transition-all flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-container-high relative">
                                        <img src="https://via.placeholder.com/150" alt="Doctor" className="object-cover w-full h-full" />
                                        <div className="absolute bottom-1 right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-headline font-bold text-on-surface">Dr. {doctor.name || doctor.clinicName}</h3>
                                        <p className="text-xs text-outline font-medium uppercase tracking-wider">{doctor.specialty || 'General Practice'}</p>
                                    </div>
                                    <span className="material-symbols-outlined text-primary opacity-0 peer-checked:opacity-100 transition-opacity">check_circle</span>
                                </div>
                            </label>
                        ))}
                    </div>
                )}
            </section>

            {/* Date Strip */}
            {selectedDoctorId && (
                <section className="space-y-4">
                    <h2 className="font-headline text-lg font-bold px-1">Select Date</h2>
                    <div className="bg-surface-container-low rounded-xl p-2 flex gap-2 overflow-x-auto no-scrollbar">
                        {dates.map((date, idx) => {
                            const isSelected = format(selectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
                            return (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedDate(date)}
                                    className={`flex flex-col items-center justify-center min-w-[70px] py-3 rounded-lg transition-colors ${isSelected ? 'bg-surface-container-lowest medical-glow border-b-4 border-primary' : 'hover:bg-surface-container-high'
                                        }`}>
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isSelected ? 'text-outline' : 'text-outline'}`}>{format(date, 'EEE')}</span>
                                    <span className={`font-headline text-xl font-bold ${isSelected ? 'text-primary' : 'text-on-surface'}`}>{format(date, 'dd')}</span>
                                    <span className={`text-[10px] font-bold ${isSelected ? 'text-primary' : 'text-outline'}`}>{format(date, 'MMM')}</span>
                                </button>
                            )
                        })}
                    </div>
                </section>
            )}

            {/* Time Slots */}
            {selectedDoctorId && selectedDate && (
                <section className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="font-headline text-lg font-bold">Select Time Slot</h2>
                    </div>

                    {loadingSlots ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="h-12 animate-pulse bg-surface-container-low rounded-lg"></div>
                            <div className="h-12 animate-pulse bg-surface-container-low rounded-lg"></div>
                        </div>
                    ) : slots.length === 0 ? (
                        <div className="text-center bg-surface-container-low p-6 rounded-xl">
                            <p className="text-on-surface-variant font-medium">No slots available for this date.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {slots.map(slot => {
                                const isSelected = selectedSlotId === slot.id;
                                if (!slot.isOpen) {
                                    return (
                                        <div key={slot.id} className="h-12 flex items-center justify-center rounded-lg bg-surface-container-high text-outline font-medium line-through cursor-not-allowed">
                                            {slot.time && format(new Date(slot.time), 'hh:mm a')}
                                        </div>
                                    )
                                }
                                return (
                                    <label key={slot.id} className="cursor-pointer" onClick={() => setSelectedSlotId(slot.id)}>
                                        <input type="radio" name="time" className="peer sr-only" checked={isSelected} onChange={() => { }} />
                                        <div className="h-12 flex items-center justify-center rounded-lg bg-primary-fixed/20 border border-primary-fixed/30 text-on-primary-fixed-variant font-bold peer-checked:bg-primary peer-checked:text-on-primary peer-checked:border-primary transition-all">
                                            {slot.time && format(new Date(slot.time), 'hh:mm a')}
                                        </div>
                                    </label>
                                )
                            })}
                        </div>
                    )}
                </section>
            )}

            {/* Reason for Visit */}
            {selectedSlotId && (
                <section className="space-y-4 pb-20">
                    <h2 className="font-headline text-lg font-bold px-1">Reason for Visit</h2>
                    <div className="relative">
                        <textarea
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            className="w-full bg-surface-container-low border-none rounded-xl p-4 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all outline-none"
                            placeholder="Please describe your symptoms..."
                            rows={4}>
                        </textarea>
                    </div>
                    <p className="text-xs text-outline px-1">Your information is protected by healthcare privacy standards.</p>
                </section>
            )}

            {/* Fixed Footer CTA */}
            {selectedSlotId && (
                <footer className="fixed bottom-0 left-0 right-0 bg-surface/80 backdrop-blur-lg border-t border-surface-container-high p-6 z-50">
                    <div className="max-w-[1440px] px-6 py-2 md:px-10 lg:px-40 mx-auto flex items-center justify-between gap-6">
                        <div className="hidden sm:block">
                            <p className="text-xs font-bold text-outline uppercase tracking-widest">Summary</p>
                            <p className="font-headline font-bold text-on-surface">Dr. {selectedDoctor?.name || 'Doctor'} • {selectedDate && format(selectedDate, 'MMM dd')}, {selectedSlot && selectedSlot.time && format(new Date(selectedSlot.time), 'hh:mm a')}</p>
                        </div>
                        <button
                            disabled={bookingStatus === 'loading'}
                            onClick={handleBooking}
                            className="flex-1 sm:flex-none sm:min-w-[240px] h-14 bg-gradient-to-br from-primary to-primary-container text-on-primary font-headline font-bold text-lg rounded-xl medical-glow hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 outline-none disabled:opacity-50">
                            {bookingStatus === 'loading' ? 'Processing...' : 'Confirm Appointment'}
                            <span className="material-symbols-outlined">arrow_forward</span>
                        </button>
                    </div>
                </footer>
            )}
        </div>
    );
}
