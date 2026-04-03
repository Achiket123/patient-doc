"use client";

import { useAppStore } from "@/store";
import { usePatientRecords } from "@/hooks/usePatientRecords";
import { format } from "date-fns";
import Link from "next/link";
import { useState } from "react";

export default function PatientRecords() {
    const { user } = useAppStore();
    const { records, loading } = usePatientRecords(user?.uid);
    const [filter, setFilter] = useState<'all' | 'prescription' | 'lab' | 'visit'>('all');

    if (!user) return null;

    const filteredRecords = filter === 'all' ? records : records.filter(r => r.type === filter);

    return (
        <div className="flex-1 max-w-5xl mx-auto w-full space-y-10">
            <header className="flex items-center justify-between mb-8 sticky top-0 z-50 bg-background/80 backdrop-blur-md py-4">
                <div className="flex items-center gap-4">
                    <Link href="/patient/home" className="p-2 hover:bg-surface-container-low rounded-full transition-colors">
                        <span className="material-symbols-outlined text-primary">arrow_back</span>
                    </Link>
                    <h1 className="font-headline text-2xl font-bold tracking-tight text-on-surface">Health Records</h1>
                </div>
            </header>

            {/* Specialty Filter */}
            <section className="space-y-4">
                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                    <button
                        onClick={() => setFilter('all')}
                        className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-xl px-6 transition-all ${filter === 'all' ? 'bg-primary text-on-primary' : 'bg-surface-container-low hover:bg-surface-container-high text-on-surface'}`}>
                        <span className="text-sm font-semibold">All Records</span>
                    </button>
                    <button
                        onClick={() => setFilter('visit')}
                        className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-xl px-6 transition-all ${filter === 'visit' ? 'bg-primary text-on-primary' : 'bg-surface-container-low hover:bg-surface-container-high text-on-surface'}`}>
                        <span className="material-symbols-outlined text-[20px]">assignment_ind</span>
                        <span className="text-sm font-semibold">Clinical Visits</span>
                    </button>
                    <button
                        onClick={() => setFilter('lab')}
                        className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-xl px-6 transition-all ${filter === 'lab' ? 'bg-primary text-on-primary' : 'bg-surface-container-low hover:bg-surface-container-high text-on-surface'}`}>
                        <span className="material-symbols-outlined text-[20px]">science</span>
                        <span className="text-sm font-semibold">Lab Results</span>
                    </button>
                    <button
                        onClick={() => setFilter('prescription')}
                        className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-xl px-6 transition-all ${filter === 'prescription' ? 'bg-primary text-on-primary' : 'bg-surface-container-low hover:bg-surface-container-high text-on-surface'}`}>
                        <span className="material-symbols-outlined text-[20px]">medication</span>
                        <span className="text-sm font-semibold">Prescriptions</span>
                    </button>
                </div>
            </section>

            {/* Record List */}
            <section className="space-y-4">
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map(k => (
                            <div key={k} className="h-24 bg-surface-container-low animate-pulse rounded-2xl"></div>
                        ))}
                    </div>
                ) : filteredRecords.length === 0 ? (
                    <div className="text-center py-20 bg-surface-container-low rounded-2xl">
                        <span className="material-symbols-outlined text-6xl text-outline opacity-30 mb-4">folder_off</span>
                        <h3 className="font-headline text-lg font-bold">No records found.</h3>
                        <p className="text-on-surface-variant text-sm">You do not have any {filter !== 'all' ? filter : ''} records stored.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredRecords.map(record => (
                            <div key={record.id} className="p-5 rounded-2xl bg-surface-container-lowest shadow-[0_4px_16px_rgba(0,0,0,0.04)] border border-outline-variant/10 flex flex-col justify-between hover:shadow-lg transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex gap-3 items-center">
                                        <div className={`p-2 rounded-xl ${record.type === 'visit' ? 'bg-primary/10 text-primary' : record.type === 'lab' ? 'bg-tertiary/10 text-tertiary' : 'bg-secondary/10 text-secondary'}`}>
                                            <span className="material-symbols-outlined">
                                                {record.type === 'visit' ? 'description' : record.type === 'lab' ? 'science' : 'medication'}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-outline uppercase tracking-wider">{record.type}</p>
                                            <h3 className="font-headline font-bold text-on-surface leading-tight text-lg">{record.title}</h3>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-sm text-on-surface-variant mb-4 line-clamp-3 whitespace-pre-wrap">{record.details}</p>

                                <div className="flex justify-between items-center pt-3 border-t border-outline-variant/10">
                                    <span className="text-[11px] font-bold text-primary/80 uppercase">Date: {format(new Date(record.date || record.createdAt), 'MMM dd, yyyy')}</span>
                                    <button className="text-secondary text-sm font-bold flex items-center gap-1 hover:underline">
                                        View Full <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
