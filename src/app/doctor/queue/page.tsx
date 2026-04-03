"use client";

import { useAppStore } from "@/store";
import { useAppointments } from "@/hooks/useAppointments";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { db } from "@/services/firebase/config";
import { doc, updateDoc, addDoc, collection } from "firebase/firestore";

export default function DoctorQueue() {
    const { user } = useAppStore();
    const { appointments, loading } = useAppointments(user?.uid, 'doctor');

    const [selectedApptId, setSelectedApptId] = useState<string | null>(null);

    // Form State for SOAP
    const [subjective, setSubjective] = useState('');
    const [objective, setObjective] = useState('');
    const [assessment, setAssessment] = useState('');
    const [plan, setPlan] = useState('');
    const [saving, setSaving] = useState(false);

    // Automatically select first appointment if none is selected
    useEffect(() => {
        if (appointments.length > 0 && !selectedApptId) {
            setSelectedApptId(appointments[0].id);
        }
    }, [appointments, selectedApptId]);

    const selectedAppt = appointments.find(a => a.id === selectedApptId);

    const handleFinalize = async () => {
        if (!selectedAppt || !user) return;
        setSaving(true);

        try {
            // 1. Create a Visit Record
            const visitRef = collection(db, "visits");
            await addDoc(visitRef, {
                patientId: selectedAppt.patientId,
                doctorId: user.uid,
                appointmentId: selectedAppt.id,
                date: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                title: `Clinical Visit - ${format(new Date(selectedAppt.slot.time), 'MMM dd, yyyy')}`,
                details: `S: ${subjective}\nO: ${objective}\nA: ${assessment}\nP: ${plan}`,
            });

            // 2. Mark Appointment as Completed
            const apptRef = doc(db, "appointments", selectedAppt.id);
            await updateDoc(apptRef, {
                status: 'completed',
                notes: `S: ${subjective}\nO: ${objective}\nA: ${assessment}\nP: ${plan}`
            });

            // Reset form
            setSubjective('');
            setObjective('');
            setAssessment('');
            setPlan('');
            setSelectedApptId(null);
        } catch (error) {
            console.error("Failed to finalize encounter", error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-1 h-[70vh] items-center justify-center">
                <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="flex h-[80vh] overflow-hidden bg-surface rounded-2xl shadow-sm border border-outline-variant/10">

            {/* Left Panel: Patient Queue */}
            <aside className="w-80 flex flex-col bg-surface-container-low border-r border-outline-variant/10">
                <div className="p-6 pb-2">
                    <h3 className="text-xl font-headline font-bold mb-1">Queue</h3>
                    <p className="text-xs text-outline-variant uppercase tracking-widest font-bold">{format(new Date(), 'MMM dd, yyyy')}</p>
                </div>

                <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-2 mt-4">
                    {appointments.length === 0 && (
                        <div className="text-center text-outline text-sm mt-10">No pending appointments today.</div>
                    )}
                    {appointments.map(appt => {
                        const isSelected = selectedApptId === appt.id;
                        const timeStr = format(new Date(appt.slot.time), 'hh:mm a');
                        return (
                            <div
                                key={appt.id}
                                onClick={() => setSelectedApptId(appt.id)}
                                className={`p-4 rounded-xl transition-all cursor-pointer border ${isSelected ? 'bg-surface-container-lowest border-secondary/20 shadow-sm' : 'bg-surface-container-high/50 hover:bg-surface-container-high border-transparent'}`}>
                                <div className="flex justify-between items-start mb-3">
                                    <span className={`${isSelected ? 'bg-secondary-fixed text-on-secondary-fixed-variant' : 'bg-surface-variant text-on-surface-variant'} text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter`}>
                                        {isSelected ? 'In Progress' : 'Waiting'}
                                    </span>
                                    <span className={`text-xs font-semibold ${isSelected ? 'text-secondary' : 'text-on-surface-variant'}`}>{timeStr}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-cover bg-center bg-surface-variant" style={{ backgroundImage: "url('https://via.placeholder.com/150')" }}></div>
                                    <div>
                                        {/* Patient Name would ideally be fetched using a denormalized value or a join. Displaying ID for now in MVP */}
                                        <h4 className="text-sm font-bold truncate w-40">Patient #{appt.patientId.slice(0, 4).toUpperCase()}</h4>
                                        <p className="text-[11px] text-outline truncate">{appt.reason}</p>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </aside>

            {/* Right Panel: Patient Details & SOAP Form */}
            <section className="flex-1 flex flex-col bg-surface">
                {selectedAppt ? (
                    <>
                        <div className="px-8 py-6 flex justify-between items-end border-b border-outline-variant/5">
                            <div className="flex items-end gap-6">
                                <div className="w-20 h-20 rounded-2xl bg-cover bg-center border-4 border-surface shadow-md bg-surface-variant" style={{ backgroundImage: "url('https://via.placeholder.com/150')" }}></div>
                                <div className="mb-1">
                                    <h2 className="text-3xl font-headline font-extrabold leading-none">Patient #{selectedAppt.patientId.slice(0, 4).toUpperCase()}</h2>
                                    <div className="flex gap-4 mt-2">
                                        <p className="text-sm text-outline font-medium"><span className="text-on-surface-variant">Reason:</span> {selectedAppt.reason}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    disabled={saving}
                                    onClick={handleFinalize}
                                    className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-secondary to-secondary-container text-on-secondary font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50">
                                    <span className="material-symbols-outlined text-lg">save</span>
                                    {saving ? 'Saving...' : 'Finalize Encounter'}
                                </button>
                            </div>
                        </div>

                        {/* SOAP Form */}
                        <div className="flex-1 overflow-y-auto px-8 pb-8 mt-6">
                            <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/10 shadow-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <span className="material-symbols-outlined text-secondary">edit_note</span>
                                    <h3 className="text-xl font-headline font-bold">Clinical SOAP Note</h3>
                                </div>

                                <form className="grid grid-cols-2 gap-8">
                                    <div className="flex flex-col gap-2 p-5 bg-surface-container-low rounded-2xl transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-secondary/20">
                                        <label className="text-[11px] font-bold text-secondary uppercase tracking-widest flex justify-between items-center">
                                            Subjective
                                            <span className="material-symbols-outlined text-sm opacity-50">person</span>
                                        </label>
                                        <textarea
                                            value={subjective} onChange={e => setSubjective(e.target.value)}
                                            className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm leading-relaxed min-h-[120px] placeholder:text-outline/40 outline-none"
                                            placeholder="Patient's reported symptoms..."></textarea>
                                    </div>

                                    <div className="flex flex-col gap-2 p-5 bg-surface-container-low rounded-2xl transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-secondary/20">
                                        <label className="text-[11px] font-bold text-secondary uppercase tracking-widest flex justify-between items-center">
                                            Objective
                                            <span className="material-symbols-outlined text-sm opacity-50">visibility</span>
                                        </label>
                                        <textarea
                                            value={objective} onChange={e => setObjective(e.target.value)}
                                            className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm leading-relaxed min-h-[120px] placeholder:text-outline/40 outline-none"
                                            placeholder="Physical examination findings..."></textarea>
                                    </div>

                                    <div className="flex flex-col gap-2 p-5 bg-surface-container-low rounded-2xl transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-secondary/20">
                                        <label className="text-[11px] font-bold text-secondary uppercase tracking-widest flex justify-between items-center">
                                            Assessment
                                            <span className="material-symbols-outlined text-sm opacity-50">psychology</span>
                                        </label>
                                        <textarea
                                            value={assessment} onChange={e => setAssessment(e.target.value)}
                                            className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm leading-relaxed min-h-[120px] placeholder:text-outline/40 outline-none"
                                            placeholder="Diagnosis..."></textarea>
                                    </div>

                                    <div className="flex flex-col gap-2 p-5 bg-surface-container-low rounded-2xl transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-secondary/20">
                                        <label className="text-[11px] font-bold text-secondary uppercase tracking-widest flex justify-between items-center">
                                            Plan
                                            <span className="material-symbols-outlined text-sm opacity-50">event_note</span>
                                        </label>
                                        <textarea
                                            value={plan} onChange={e => setPlan(e.target.value)}
                                            className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm leading-relaxed min-h-[120px] placeholder:text-outline/40 outline-none"
                                            placeholder="Treatment and follow-up..."></textarea>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-outline">
                        <span className="material-symbols-outlined text-6xl mb-4 opacity-20">clinical_notes</span>
                        <p className="font-semibold">Select an appointment from the queue to start an encounter.</p>
                    </div>
                )}
            </section>
        </div>
    );
}
