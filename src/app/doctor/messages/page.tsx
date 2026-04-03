"use client";

import { useAppStore } from "@/store";
import { useChatThreads, useChatMessages } from "@/hooks/useMessages";
import { useState } from "react";
import { format } from "date-fns";

export default function DoctorMessages() {
    const { user } = useAppStore();
    const { threads, loading: threadsLoading } = useChatThreads(user?.uid);

    const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
    const { messages, loading: messagesLoading, sendMessage } = useChatMessages(selectedThreadId);

    const [inputMsg, setInputMsg] = useState("");

    const handleSend = () => {
        if (!inputMsg.trim() || !user || !selectedThreadId) return;
        sendMessage(user.uid, inputMsg);
        setInputMsg("");
    };

    if (!user) return null;

    return (
        <div className="flex h-[80vh] overflow-hidden bg-surface rounded-2xl shadow-sm border border-outline-variant/10">

            {/* Thread List */}
            <section className="w-80 bg-surface-container flex flex-col border-r border-outline-variant/10">
                <div className="p-6 pb-4">
                    <h1 className="font-headline text-2xl font-extrabold text-on-surface mb-6">Messages</h1>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-outline">
                            <span className="material-symbols-outlined text-sm">search</span>
                        </div>
                        <input className="w-full pl-10 pr-4 py-3 bg-surface-container-low border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 placeholder:text-outline/60 outline-none" placeholder="Search patients..." type="text" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-3 flex flex-col gap-1 pb-4 no-scrollbar">
                    {threadsLoading ? (
                        <div className="animate-pulse space-y-2 p-2 mt-4">
                            <div className="h-16 bg-surface-container-low rounded-xl"></div>
                            <div className="h-16 bg-surface-container-low rounded-xl"></div>
                        </div>
                    ) : threads.length === 0 ? (
                        <div className="text-center text-outline text-sm p-4 mt-6">No active conversations.</div>
                    ) : (
                        threads.map(thread => {
                            const isSelected = selectedThreadId === thread.id;
                            // MVP Hack: Since we don't have a joined users mapping cache in this scope, we show the thread ID. Alternatively, we show the other participant's ID.
                            const otherUserId = thread.participants.find(p => p !== user.uid) || "Unknown";

                            return (
                                <div
                                    key={thread.id}
                                    onClick={() => setSelectedThreadId(thread.id)}
                                    className={`p-4 rounded-xl transition-all cursor-pointer ${isSelected ? 'bg-surface-container-lowest shadow-sm border border-outline-variant/5' : 'hover:bg-surface-container-high'}`}>
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-full border border-surface-container bg-primary/20 flex items-center justify-center text-primary font-bold">
                                            {otherUserId.slice(0, 2).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <h3 className="font-headline font-bold text-on-surface truncate text-sm">Patient #{otherUserId.slice(0, 4)}</h3>
                                                <span className="text-[10px] font-label font-medium text-outline uppercase">
                                                    {format(new Date(thread.updatedAt), 'MMM dd')}
                                                </span>
                                            </div>
                                            <p className="text-xs text-on-surface-variant line-clamp-1">{thread.lastMessage}</p>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </section>

            {/* Main Chat Area */}
            <section className="flex-1 flex flex-col bg-surface-container-lowest">
                {selectedThreadId ? (
                    <>
                        <header className="h-20 bg-surface/70 backdrop-blur-md border-b border-outline-variant/10 px-8 flex items-center justify-between z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                    P
                                </div>
                                <div>
                                    <h2 className="font-headline text-lg font-extrabold text-on-surface leading-tight">Patient Chat</h2>
                                    <p className="text-[10px] font-label text-outline uppercase tracking-tight">Active Conversation</p>
                                </div>
                            </div>
                        </header>

                        <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6" style={{ scrollBehavior: 'smooth' }}>
                            {messagesLoading ? (
                                <div className="flex justify-center flex-1 items-center">
                                    <div className="animate-spin w-8 h-8 rounded-full border-4 border-primary border-t-transparent"></div>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="text-center font-semibold text-outline p-6 my-auto">Say hello! Start the consultation.</div>
                            ) : (
                                messages.map(msg => {
                                    const isMe = msg.senderId === user.uid;
                                    return (
                                        <div key={msg.id} className={`flex flex-col gap-1.5 max-w-[75%] ${isMe ? 'items-end self-end' : 'items-start self-start'}`}>
                                            <div className={`px-4 py-3 text-sm leading-relaxed ${isMe ? 'bg-primary text-on-primary rounded-xl rounded-br-none shadow-[0_4px_12px_rgba(0,101,101,0.15)]' : 'bg-surface-container-high text-on-surface rounded-xl rounded-bl-none shadow-sm'}`}>
                                                {msg.content}
                                            </div>
                                            <span className="text-[10px] font-label text-outline uppercase">{format(new Date(msg.timestamp), 'hh:mm a')}</span>
                                        </div>
                                    )
                                })
                            )}
                        </div>

                        {/* Input Footer */}
                        <footer className="p-6 bg-surface/80 backdrop-blur-lg border-t border-outline-variant/10">
                            <div className="max-w-4xl mx-auto flex items-end gap-3">
                                <div className="flex-1 bg-surface-container-low rounded-2xl flex flex-col p-2 group focus-within:bg-surface-container-lowest focus-within:shadow-[0_0_0_2px_rgba(0,101,101,0.1)] border border-transparent transition-all">
                                    <textarea
                                        value={inputMsg}
                                        onChange={e => setInputMsg(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                        className="w-full bg-transparent border-none focus:ring-0 text-sm p-3 resize-none max-h-32 placeholder:text-outline/50 outline-none"
                                        placeholder="Type medical note or message..."
                                        rows={1}></textarea>

                                    <div className="flex items-center justify-end px-3 pb-1 pt-2 border-t border-outline-variant/5">
                                        <button onClick={handleSend} disabled={!inputMsg.trim()} className="bg-primary text-on-primary p-2 w-10 h-10 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center outline-none">
                                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </footer>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-outline">
                        <span className="material-symbols-outlined text-6xl mb-4 opacity-20">chat</span>
                        <p className="font-semibold text-lg">Select a conversation</p>
                    </div>
                )}
            </section>
        </div>
    );
}
