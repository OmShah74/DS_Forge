"use client";
import React, { useEffect } from 'react';
import { useExplainabilityStore } from '@/store/explainabilityStore';
import { X, CheckCircle2, AlertCircle, Clock, Info, Database, BrainCircuit, Eraser, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const operationIcons: Record<string, any> = {
    upload: Database,
    cleaning: Eraser,
    feature_eng: Zap,
    training: BrainCircuit,
};

export default function ActivityLog() {
    const { activities, isActivityLogOpen, toggleActivityLog, fetchActivities, loading } = useExplainabilityStore();

    useEffect(() => {
        if (isActivityLogOpen) {
            fetchActivities();
        }
    }, [isActivityLogOpen]);

    return (
        <AnimatePresence>
            {isActivityLogOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={toggleActivityLog}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-[400px] bg-[#080a10] border-l border-white/5 z-[210] flex flex-col shadow-2xl"
                    >
                        <header className="p-6 border-b border-white/5 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Clock className="text-purple-500" size={20} /> System Activity
                                </h2>
                                <p className="text-xs text-gray-500 font-medium">Global operation traces</p>
                            </div>
                            <button
                                onClick={toggleActivityLog}
                                className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400"
                            >
                                <X size={20} />
                            </button>
                        </header>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                            {loading && activities.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center opacity-20">
                                    <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
                                    <p className="font-bold uppercase tracking-widest text-[10px]">Syncing Logs...</p>
                                </div>
                            ) : activities.length > 0 ? (
                                activities.map((activity) => (
                                    <ActivityItem key={activity.id} activity={activity} />
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-2 py-20">
                                    <Clock size={40} className="opacity-10" />
                                    <p className="text-sm font-medium">No activity recorded yet</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

function ActivityItem({ activity }: { activity: any }) {
    const Icon = operationIcons[activity.operation] || Info;
    const isSuccess = activity.status === 'success';

    return (
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group">
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isSuccess ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                        {isSuccess ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <Icon size={12} className="text-purple-500" />
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">{activity.operation}</span>
                        </div>
                        <h4 className="text-sm font-bold text-gray-200 mt-0.5">{activity.message}</h4>
                    </div>
                </div>
                <span className="text-[10px] font-mono text-gray-600">{new Date(activity.created_at).toLocaleTimeString()}</span>
            </div>

            {activity.metadata_json && (
                <div className="mt-3 bg-black/40 rounded-lg p-3 border border-white/[0.03] space-y-1">
                    {Object.entries(activity.metadata_json).map(([key, value]: [string, any]) => (
                        <div key={key} className="flex justify-between text-[10px]">
                            <span className="text-gray-500 font-medium capitalize">{key.replace('_', ' ')}</span>
                            <span className="text-gray-300 font-bold">{String(value)}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
