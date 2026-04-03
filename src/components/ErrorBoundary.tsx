"use client";

import React from "react";

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<
    { children: React.ReactNode; fallback?: React.ReactNode },
    State
> {
    state: State = { hasError: false, error: null };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        // In production this would go to Sentry / Firebase Analytics
        console.error("[ErrorBoundary]", error, info.componentStack);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback ?? (
                <div className="min-h-[200px] flex flex-col items-center justify-center p-8 rounded-2xl bg-error-container text-error">
                    <span className="material-symbols-outlined text-4xl mb-3">error</span>
                    <h3 className="font-headline font-bold text-lg">Something went wrong</h3>
                    <p className="text-sm mt-1 opacity-80">{this.state.error?.message}</p>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null })}
                        className="mt-4 px-4 py-2 bg-error text-on-error rounded-xl text-sm font-bold hover:opacity-90"
                    >
                        Try again
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
