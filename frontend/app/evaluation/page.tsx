"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { TrainingRun } from "@/lib/types";
import { BarChart, TrendingUp, Grid, Activity } from "lucide-react";
import { useNotificationStore } from "@/store/notificationStore";

export default function EvaluationPage() {
    const { addToast } = useNotificationStore();
    const [runs, setRuns] = useState<TrainingRun[]>([]);
    const [selectedRun, setSelectedRun] = useState<TrainingRun | null>(null);

    useEffect(() => {
        api.get("/training/runs").then(res => setRuns(res.data));
    }, []);

    // Helper to render Confusion Matrix
    const renderConfusionMatrix = (report: any) => {
        if (!report || !report.confusion_matrix) return null;
        const matrix = report.confusion_matrix;
        const classes = report.classes || [];

        return (
            <div className="mt-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 px-1">Classification Matrix</h3>
                <div className="overflow-x-auto glass-panel rounded-2xl border-white/5 bg-black/40 p-4">
                    <table className="w-full text-center border-collapse">
                        <thead>
                            <tr>
                                <th className="p-4 border-b border-white/5 text-[9px] font-black text-purple-500 uppercase tracking-widest">Act \ Pred</th>
                                {classes.map((c: string) => (
                                    <th key={c} className="p-4 border-b border-white/5 text-[9px] font-black text-gray-400 uppercase tracking-widest">{c}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {matrix.map((row: number[], i: number) => (
                                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="p-4 border-r border-white/5 text-[10px] font-black text-gray-400 uppercase">{classes[i]}</td>
                                    {row.map((val, j) => (
                                        <td key={j} className={`p-4 text-xs font-mono font-bold ${i === j ? 'text-emerald-400' : 'text-gray-600'}`}>
                                            {val}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    // Helper for Regression Plots (Actual vs Predicted)
    const renderRegressionAnalysis = (report: any) => {
        if (!report || !report.actual) return null;
        return (
            <div className="mt-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 px-1">Regression Variance Stream</h3>
                <div className="glass-panel rounded-2xl border-white/5 bg-black/40 p-6 overflow-hidden">
                    <div className="grid grid-cols-2 gap-8 border-b border-white/5 pb-4 mb-4">
                        <span className="text-[9px] font-black text-purple-500 uppercase tracking-widest">Target Artifact (Actual)</span>
                        <span className="text-[9px] font-black text-purple-500 uppercase tracking-widest">Inference Out (Predicted)</span>
                    </div>
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                        {report.actual.map((act: number, i: number) => (
                            <div key={i} className="grid grid-cols-2 gap-8 py-2 border-b border-white/[0.02] last:border-0 group">
                                <span className="text-xs font-mono font-bold text-gray-400">{act.toFixed(4)}</span>
                                <span className={`text-xs font-mono font-bold ${Math.abs(act - report.predicted[i]) > (act * 0.1) ? "text-rose-500" : "text-emerald-500"}`}>
                                    {report.predicted[i].toFixed(4)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="h-[calc(100vh-100px)] flex gap-10 animate-in fade-in duration-700">
            {/* Sidebar List */}
            <div className="w-96 glass-panel rounded-3xl border-white/5 bg-black/20 flex flex-col overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-white/5 shrink-0 bg-black/20">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <BarChart className="text-purple-500" size={14} />
                            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Model Registry</h2>
                        </div>
                        <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Completed Only</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {runs.filter(r => r.status === 'completed').length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-700 opacity-20 italic p-8 text-center">
                            <BarChart size={48} className="mb-4" />
                            <p className="text-xs font-black uppercase tracking-[0.4em]">No validated models found</p>
                        </div>
                    ) : (
                        runs.filter(r => r.status === 'completed').map(run => (
                            <div
                                key={run.id}
                                onClick={() => setSelectedRun(run)}
                                className={`
                                    p-5 rounded-2xl cursor-pointer transition-all border group relative overflow-hidden
                                    ${selectedRun?.id === run.id
                                        ? 'bg-purple-500/10 border-purple-500/20 text-purple-400 shadow-xl'
                                        : 'bg-white/[0.01] border-white/5 text-gray-500 hover:bg-white/5 hover:text-gray-300'}
                                `}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="font-black text-sm uppercase tracking-tight truncate max-w-[180px]">{run.model_name}</h3>
                                    <span className="text-[9px] font-mono font-black opacity-40 bg-black/40 px-2 py-0.5 rounded">#{run.id}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {run.metrics && Object.entries(run.metrics).slice(0, 2).map(([k, v]) => (
                                        <div key={k} className="flex flex-col">
                                            <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">{k}</span>
                                            <span className="text-xs font-mono font-bold">{typeof v === 'number' ? v.toFixed(3) : v}</span>
                                        </div>
                                    ))}
                                </div>
                                {selectedRun?.id === run.id && (
                                    <div className="absolute left-0 top-0 w-1 h-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 glass-panel rounded-3xl border-white/5 bg-black/40 flex flex-col overflow-hidden shadow-2xl relative">
                {selectedRun ? (
                    <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                        <header className="flex items-center justify-between mb-12 animate-in fade-in slide-in-from-top-2 duration-500">
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <TrendingUp className="text-emerald-500" size={24} />
                                    <h1 className="text-3xl font-black text-white italic font-mono uppercase tracking-tight">Telemetry <span className="text-purple-600">Report</span></h1>
                                </div>
                                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest px-1">Deep analysis of logic artifact validation phase</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="bg-black/40 border border-white/5 rounded-2xl px-6 py-3 text-right">
                                    <p className="text-[8px] font-black text-gray-600 uppercase tracking-[0.2em] mb-1">Target Vector</p>
                                    <p className="text-xs font-black text-purple-400 uppercase">{selectedRun.target_column || "UNSPECIFIED"}</p>
                                </div>
                                <div className="bg-black/40 border border-white/5 rounded-2xl px-6 py-3 text-right">
                                    <p className="text-[8px] font-black text-gray-600 uppercase tracking-[0.2em] mb-1">Compute Date</p>
                                    <p className="text-xs font-black text-gray-300 uppercase">{new Date(selectedRun.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </header>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                            {selectedRun.metrics && Object.entries(selectedRun.metrics).map(([k, v]) => (
                                <div key={k} className="glass-panel p-6 rounded-2xl border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors group shadow-xl">
                                    <h3 className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] mb-3 group-hover:text-purple-500 transition-colors">{k.replace('_', ' ')}</h3>
                                    <p className="text-3xl font-mono font-black text-white">{typeof v === 'number' ? v.toFixed(6) : v}</p>
                                </div>
                            ))}
                        </div>

                        {/* Detailed Reports */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 mb-6">
                                <Grid className="text-purple-500/40" size={16} />
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.5em]">Logic Topology Analysis</h3>
                            </div>

                            {/* @ts-ignore */}
                            {selectedRun.detailed_report?.type === 'classification'
                                // @ts-ignore
                                ? renderConfusionMatrix(selectedRun.detailed_report)
                                // @ts-ignore
                                : renderRegressionAnalysis(selectedRun.detailed_report)
                            }

                            {/* @ts-ignore */}
                            {!selectedRun.detailed_report && (
                                <div className="glass-panel p-20 rounded-3xl border-dashed border-white/5 bg-black/20 flex flex-col items-center justify-center text-gray-700">
                                    <Activity size={32} className="mb-4 opacity-50" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">Extended diagnostics not generated during training</p>
                                </div>
                            )}
                        </div>

                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-700 opacity-20 italic">
                        <BarChart size={80} className="mb-6" />
                        <p className="text-sm font-black uppercase tracking-[0.5em]">Select Core Logic to Initiate Telemetry</p>
                    </div>
                )}

                {/* Visual decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/[0.02] blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            </div>
        </div>
    );
}
