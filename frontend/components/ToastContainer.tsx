"use client";
import React from 'react';
import { useNotificationStore } from '@/store/notificationStore';
import { CheckCircle2, AlertCircle, Info, X, BellRing } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function ToastContainer() {
    const { toasts, removeToast, confirmation, closeConfirm } = useNotificationStore();

    const icons = {
        success: <CheckCircle2 size={18} className="text-emerald-400" />,
        error: <AlertCircle size={18} className="text-rose-400" />,
        info: <Info size={18} className="text-blue-400" />,
        warning: <BellRing size={18} className="text-amber-400" />,
    };

    return (
        <>
            {/* Confirmation Modal */}
            {confirmation && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
                        onClick={() => {
                            confirmation.onCancel?.();
                            closeConfirm();
                        }}
                    ></div>
                    <div className="relative glass-panel p-8 rounded-[2.5rem] border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] max-w-md w-full animate-in fade-in zoom-in duration-300 bg-[#080c18]/90">
                        <div className="flex flex-col items-center text-center space-y-6">
                            <div className="w-16 h-16 rounded-3xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center">
                                <AlertCircle size={32} className="text-purple-500" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-black text-white italic uppercase tracking-tight">{confirmation.title}</h3>
                                <p className="text-xs font-medium text-gray-500 leading-relaxed uppercase tracking-widest">{confirmation.message}</p>
                            </div>
                            <div className="flex items-center gap-4 w-full">
                                <button
                                    onClick={() => {
                                        confirmation.onCancel?.();
                                        closeConfirm();
                                    }}
                                    className="flex-1 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-gray-400 hover:text-white hover:bg-white/5 transition-all border border-white/5"
                                >
                                    Abort
                                </button>
                                <button
                                    onClick={() => {
                                        confirmation.onConfirm();
                                        closeConfirm();
                                    }}
                                    className="flex-1 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] bg-purple-600 text-white shadow-2xl shadow-purple-900/40 hover:bg-purple-500 transition-all"
                                >
                                    Proceed
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Toasts */}
            <div className="fixed bottom-8 right-8 z-[200] flex flex-col gap-3 pointer-events-none max-w-md w-full px-4 sm:px-0">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={cn(
                            "pointer-events-auto flex items-start gap-4 p-4 rounded-2xl glass-panel border border-white/10 shadow-2xl animate-in slide-in-from-right-10 duration-500",
                            "bg-[#0a0f1d]/90 backdrop-blur-xl"
                        )}
                    >
                        <div className="shrink-0 mt-0.5">
                            {icons[toast.type]}
                        </div>
                        <div className="flex-1 space-y-1">
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">System Event</p>
                            <p className="text-sm font-bold text-white leading-relaxed">
                                {toast.message}
                            </p>
                        </div>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="shrink-0 p-1 hover:bg-white/5 rounded-lg transition-colors text-white/20 hover:text-white"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </>
    );
}
