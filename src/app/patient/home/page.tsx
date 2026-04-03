"use client";

import { useAppStore } from "@/store";
import { useAppointments } from "@/hooks/useAppointments";
import { usePatientRecords } from "@/hooks/usePatientRecords";
import { format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PatientDashboard() {
    const { user, isLoadingAuth } = useAppStore();
    const router = useRouter();

    useEffect(() => {
        if (!isLoadingAuth && !user) {
            router.push("/");
        }
    }, [user, isLoadingAuth, router]);

    const { appointments, loading: apptLoading } = useAppointments(user?.uid, 'patient');
    const { records, loading: recordsLoading } = usePatientRecords(user?.uid);

    if (isLoadingAuth || !user) return null;

    const nextAppointment = appointments.length > 0 ? appointments[0] : null;

    return (
        <>
            <section className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="h-16 w-16 rounded-full bg-cover bg-center border-4 border-surface-container-lowest shadow-sm" style={{ backgroundImage: `url('${user.photoURL || 'https://via.placeholder.com/150'}')` }}></div>
                        <div>
                            <span className="text-label-sm font-bold tracking-widest text-primary uppercase text-[11px]">Welcome Back</span>
                            <h1 className="text-3xl font-headline font-extrabold text-on-background">Hello, {user.name}</h1>
                        </div>
                    </div>
                    <p className="text-on-surface-variant text-base">Your health metrics look stable today. You have {appointments.length} upcoming tasks.</p>
                </div>
                <div className="flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-full">
                    <span className="text-primary font-bold text-sm">Member ID: #{user.uid.slice(0, 6).toUpperCase()}</span>
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 flex flex-col gap-8">

                    {/* Highlighted Next Appointment Card */}
                    <div className="relative overflow-hidden rounded-2xl bg-surface-container-lowest shadow-[0_12px_32px_-4px_rgba(0,101,101,0.08)]">
                        <div className="flex flex-col md:flex-row min-h-[16rem]">
                            <div className="w-full md:w-1/3 bg-cover bg-center h-48 md:h-auto bg-surface-container-high relative">
                                {apptLoading && <div className="absolute inset-0 animate-pulse bg-surface-variant"></div>}
                                {!apptLoading && <div className="absolute inset-0 bg-primary/10"></div>}
                            </div>

                            <div className="flex-1 p-8">
                                {apptLoading ? (
                                    <div className="animate-pulse space-y-4">
                                        <div className="h-4 bg-surface-variant rounded w-1/4"></div>
                                        <div className="h-8 bg-surface-variant rounded w-1/2"></div>
                                        <div className="h-4 bg-surface-variant rounded w-3/4"></div>
                                        <div className="h-16 bg-surface-variant rounded w-full mt-4"></div>
                                    </div>
                                ) : nextAppointment ? (
                                    <>
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                                            <span className="text-xs font-bold text-primary uppercase tracking-widest">Upcoming Appointment</span>
                                        </div>
                                        <h3 className="text-2xl font-headline font-bold text-on-background mb-1">Appointment Details</h3>
                                        <p className="text-on-surface-variant font-medium mb-6">Doctor ID: {nextAppointment.doctorId} | Reason: {nextAppointment.reason}</p>

                                        <div className="flex flex-wrap gap-6 mb-8">
                                            <div className="flex items-center gap-3">
                                                <div className="flex w-10 h-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                                    <span className="material-symbols-outlined">calendar_today</span>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-on-surface-variant uppercase font-bold">Date</p>
                                                    <p className="text-sm font-semibold">{format(new Date(nextAppointment.slot.time), 'MMM dd, yyyy')}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex w-10 h-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                                    <span className="material-symbols-outlined">schedule</span>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-on-surface-variant uppercase font-bold">Time</p>
                                                    <p className="text-sm font-semibold">{format(new Date(nextAppointment.slot.time), 'hh:mm a')}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-3">
                                            <button className="flex-1 md:flex-none px-6 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2">
                                                <span className="material-symbols-outlined text-lg">video_call</span>
                                                Join Consultation
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-center">
                                        <span className="material-symbols-outlined text-4xl text-outline mb-2">event_available</span>
                                        <h3 className="text-xl font-headline font-bold text-on-background">No upcoming appointments</h3>
                                        <p className="text-on-surface-variant text-sm mt-1 mb-4">You have a clear schedule. Book a visit if you need care.</p>
                                        <Link href="/patient/book" className="px-6 py-3 bg-primary text-on-primary rounded-xl font-bold text-sm shadow-md transition-all hover:opacity-90">
                                            Book Appointment
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick Action Strip */}
                    <div className="grid grid-cols-3 gap-4">
                        <Link href="/patient/book" className="group flex flex-col items-center justify-center p-6 rounded-2xl bg-surface-container-low hover:bg-primary hover:text-on-primary transition-all duration-300">
                            <div className="w-14 h-14 rounded-full bg-surface-container-lowest group-hover:bg-primary-container flex items-center justify-center mb-3 shadow-sm transition-colors">
                                <span className="material-symbols-outlined text-primary group-hover:text-on-primary">add_circle</span>
                            </div>
                            <span className="font-headline font-bold text-sm">Book Visit</span>
                        </Link>

                        <Link href="/patient/messages" className="group flex flex-col items-center justify-center p-6 rounded-2xl bg-surface-container-low hover:bg-secondary hover:text-on-primary transition-all duration-300">
                            <div className="w-14 h-14 rounded-full bg-surface-container-lowest group-hover:bg-secondary-container flex items-center justify-center mb-3 shadow-sm transition-colors">
                                <span className="material-symbols-outlined text-secondary group-hover:text-on-primary">chat</span>
                            </div>
                            <span className="font-headline font-bold text-sm">Messages</span>
                        </Link>

                        <Link href="/patient/records" className="group flex flex-col items-center justify-center p-6 rounded-2xl bg-surface-container-low hover:bg-tertiary hover:text-on-primary transition-all duration-300">
                            <div className="w-14 h-14 rounded-full bg-surface-container-lowest group-hover:bg-tertiary-container flex items-center justify-center mb-3 shadow-sm transition-colors">
                                <span className="material-symbols-outlined text-tertiary group-hover:text-on-primary">folder_open</span>
                            </div>
                            <span className="font-headline font-bold text-sm">Records</span>
                        </Link>
                    </div>
                </div>

                {/* Recent Activity Sidebar */}
                <aside className="lg:col-span-4">
                    <div className="rounded-2xl bg-surface-container-low p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-headline font-bold text-on-background">Recent Activity</h3>
                            <Link href="/patient/records" className="text-primary text-xs font-bold hover:underline">View All</Link>
                        </div>

                        <div className="space-y-6">
                            {recordsLoading ? (
                                <div className="animate-pulse space-y-4">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="flex gap-4">
                                            <div className="w-10 h-10 bg-surface-variant rounded-xl"></div>
                                            <div className="flex-1 space-y-2">
                                                <div className="h-4 bg-surface-variant rounded w-3/4"></div>
                                                <div className="h-3 bg-surface-variant rounded w-1/2"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : records.length === 0 ? (
                                <div className="text-center py-6 text-outline text-sm">No recent activity</div>
                            ) : (
                                records.slice(0, 4).map(record => (
                                    <div key={record.id} className="flex gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${record.type === 'lab' ? 'bg-primary/10 text-primary' :
                                                record.type === 'prescription' ? 'bg-secondary/10 text-secondary' :
                                                    'bg-tertiary/10 text-tertiary'
                                            }`}>
                                            <span className="material-symbols-outlined text-[20px]">
                                                {record.type === 'lab' ? 'science' :
                                                    record.type === 'prescription' ? 'medication' : 'description'}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-on-background capitalize">{record.type} Added</p>
                                            <p className="text-xs text-on-surface-variant mb-1">{record.title}</p>
                                            <p className="text-[10px] font-bold text-primary/60 uppercase">{format(new Date(record.createdAt), 'MMM dd, yyyy')}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Health Tip Card */}
                        <div className="mt-10 p-5 rounded-xl bg-gradient-to-br from-tertiary to-tertiary-container text-on-tertiary-container shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="material-symbols-outlined text-lg">lightbulb</span>
                                <span className="text-xs font-bold uppercase tracking-wider">Daily Health Tip</span>
                            </div>
                            <p className="text-sm leading-relaxed opacity-90">Remember to stay hydrated! Drinking 8 glasses of water daily helps maintain optimal heart health and energy levels.</p>
                        </div>
                    </div>
                </aside>
            </div>
        </>
    );
}
