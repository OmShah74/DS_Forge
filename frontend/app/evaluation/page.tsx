"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { TrainingRun } from "@/lib/types";
import {
    BarChart as BarChartIcon, TrendingUp, Grid,
    Activity, ChevronRight, Zap, PieChart,
    ArrowUpRight, Target, HelpCircle
} from "lucide-react";
import { useExplainabilityStore } from "@/store/explainabilityStore";
import { useNotificationStore } from "@/store/notificationStore";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell,
    LineChart, Line, AreaChart, Area
} from 'recharts';

export default function EvaluationPage() {
    const { addToast } = useNotificationStore();
    const [runs, setRuns] = useState<TrainingRun[]>([]);
    const [selectedRun, setSelectedRun] = useState<TrainingRun | null>(null);
    const { openHelp } = useExplainabilityStore();

    useEffect(() => {
        api.get("/training/runs").then(res => setRuns(res.data));
    }, []);

    // --- CHART COMPONENTS ---

    const FeatureImportanceChart = ({ data }: { data: Record<string, number> }) => {
        const chartData = Object.entries(data)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        return (
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey="name"
                            type="category"
                            width={100}
                            tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 'bold' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            contentStyle={{
                                backgroundColor: '#080c18',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                fontSize: '10px',
                                fontWeight: 'bold'
                            }}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={`rgba(147, 51, 234, ${1 - index * 0.1})`} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        );
    };

    const ROCCurveChart = ({ roc }: { roc: any }) => {
        if (!roc) return null;
        const chartData = roc.fpr.map((fpr: number, i: number) => ({
            fpr,
            tpr: roc.tpr[i]
        }));

        return (
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorTpr" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#9333ea" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#9333ea" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis
                            dataKey="fpr"
                            label={{ value: 'False Positive Rate', position: 'insideBottom', offset: -5, fill: '#4b5563', fontSize: 9 }}
                            tick={{ fill: '#4b5563', fontSize: 9 }}
                        />
                        <YAxis
                            label={{ value: 'True Positive Rate', angle: -90, position: 'insideLeft', fill: '#4b5563', fontSize: 9 }}
                            tick={{ fill: '#4b5563', fontSize: 9 }}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#080c18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                        />
                        <Area type="monotone" dataKey="tpr" stroke="#9333ea" fillOpacity={1} fill="url(#colorTpr)" strokeWidth={3} />
                        <Line type="monotone" dataKey="fpr" stroke="rgba(255,255,255,0.2)" strokeDasharray="5 5" dot={false} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        );
    };

    const ResidualsChart = ({ actual, predicted }: { actual: number[], predicted: number[] }) => {
        const chartData = actual.map((act, i) => ({
            index: i,
            actual: act,
            predicted: predicted[i]
        }));

        return (
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="index" hide />
                        <YAxis tick={{ fill: '#4b5563', fontSize: 9 }} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#080c18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                        />
                        <Line type="step" dataKey="actual" stroke="#4b5563" strokeWidth={1} dot={false} strokeDasharray="3 3" />
                        <Line type="monotone" dataKey="predicted" stroke="#9333ea" strokeWidth={2} dot={{ r: 2, fill: '#9333ea' }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        );
    };

    // --- RENDER HELPERS ---

    const renderConfusionMatrix = (matrix: number[][], classes: string[]) => {
        return (
            <div className="overflow-x-auto glass-panel rounded-2xl border-white/5 bg-black/40 p-6">
                <table className="w-full text-center border-collapse">
                    <thead>
                        <tr>
                            <th className="p-4 border-b border-white/10 text-[9px] font-black text-purple-500 uppercase tracking-widest">Act \ Pred</th>
                            {classes.map((c) => (
                                <th key={c} className="p-4 border-b border-white/10 text-[9px] font-black text-gray-500 uppercase tracking-widest">{c}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {matrix.map((row, i) => (
                            <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                <td className="p-4 border-r border-white/10 text-[10px] font-black text-gray-500 uppercase">{classes[i]}</td>
                                {row.map((val, j) => (
                                    <td key={j} className={`p-4 text-xs font-mono font-bold ${i === j ? 'text-emerald-400' : 'text-gray-700'}`}>
                                        {val}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <main className="max-w-[1600px] mx-auto h-[calc(100vh-80px)] flex gap-10 animate-in fade-in duration-700">
            {/* Sidebar List */}
            <div className="w-96 glass-panel rounded-3xl border-white/5 bg-black/20 flex flex-col overflow-hidden shadow-2xl relative">
                <div className="p-6 border-b border-white/5 shrink-0 bg-black/20">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <BarChartIcon className="text-purple-500" size={16} />
                            <h2 className="text-sm font-semibold text-gray-400 tracking-wide">Model Registry</h2>
                        </div>
                        <span className="text-xs font-semibold text-gray-600 tracking-wide">Verified Logic</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {runs.filter(r => r.status === 'completed').length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-700 opacity-20 italic p-8 text-center">
                            <Activity size={48} className="mb-4" />
                            <p className="text-xs font-black uppercase tracking-[0.4em]">No validated models found</p>
                        </div>
                    ) : (
                        runs.filter(r => r.status === 'completed').map(run => (
                            <div
                                key={run.id}
                                onClick={() => setSelectedRun(run)}
                                className={`
                                    p-6 rounded-2xl cursor-pointer transition-all border group relative overflow-hidden
                                    ${selectedRun?.id === run.id
                                        ? 'bg-purple-500/10 border-purple-500/40 shadow-[0_0_40px_rgba(168,85,247,0.15)]'
                                        : 'bg-white/[0.01] border-white/5 hover:bg-white/5'}
                                `}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="space-y-1">
                                        <h3 className={`font-bold text-sm truncate max-w-[180px] ${selectedRun?.id === run.id ? 'text-purple-400' : 'text-gray-300'}`}>
                                            {run.model_name?.replace(/_/g, ' ')}
                                        </h3>
                                        <p className="text-xs font-medium text-gray-500">{new Date(run.created_at + 'Z').toLocaleDateString()}</p>
                                    </div>
                                    <span className="text-xs font-mono font-bold opacity-30 bg-black/60 px-2 py-0.5 rounded border border-white/5">#{run.id}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {run.metrics && Object.entries(run.metrics).slice(0, 2).map(([k, v]) => (
                                        <div key={k} className="flex flex-col bg-black/40 p-2 rounded-lg border border-white/5">
                                            <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-0.5">{k}</span>
                                            <span className={`text-[10px] font-mono font-bold ${selectedRun?.id === run.id ? 'text-white' : 'text-gray-400'}`}>
                                                {typeof v === 'number' ? v.toFixed(3) : v}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                {selectedRun?.id === run.id && (
                                    <div className="absolute left-0 top-0 w-1 h-full bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.8)]"></div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 glass-panel rounded-[2.5rem] border-white/5 bg-black/40 flex flex-col shadow-2xl relative overflow-hidden">
                {selectedRun ? (
                    <div className="flex-1 overflow-y-auto p-12 custom-scrollbar space-y-12">
                        {/* Header Section */}
                        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 animate-in fade-in slide-in-from-top-2 duration-500">
                            <div className="space-y-3">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                                        <TrendingUp className="text-emerald-500" size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-purple-500 tracking-widest mb-1 uppercase">Telemetry Analysis</h2>
                                        <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-4">
                                            Logic <span className="text-purple-600">Artifact</span> Report
                                            <button
                                                onClick={() => openHelp('evaluation')}
                                                className="p-2 hover:bg-white/5 rounded-full text-gray-600 hover:text-purple-400 transition-colors"
                                            >
                                                <HelpCircle size={20} />
                                            </button>
                                        </h1>
                                    </div>
                                </div>
                                <p className="text-gray-400 text-sm font-medium px-1">Validated performance metrics for instance #{selectedRun.id}</p>
                            </div>

                            <div className="flex gap-4">
                                <div className="bg-black/60 border border-white/5 rounded-2xl px-6 py-4 shadow-2xl relative overflow-hidden group">
                                    <div className="relative z-10">
                                        <p className="text-xs font-semibold text-gray-500 tracking-wide mb-1 flex items-center gap-2">
                                            <Target size={12} className="text-purple-500" /> Target
                                        </p>
                                        <p className="text-base font-bold text-white">{selectedRun.target_column || "Unspecified"}</p>
                                    </div>
                                    <ArrowUpRight size={40} className="absolute -bottom-2 -right-2 text-purple-500/5 group-hover:text-purple-500/10 transition-colors" />
                                </div>
                                <div className="bg-black/60 border border-white/5 rounded-2xl px-6 py-4 shadow-2xl relative overflow-hidden group">
                                    <div className="relative z-10">
                                        <p className="text-xs font-semibold text-gray-500 tracking-wide mb-1 flex items-center gap-2">
                                            <Activity size={12} className="text-purple-500" /> Model Type
                                        </p>
                                        <p className="text-base font-bold text-white">{selectedRun.model_name?.replace(/_/g, ' ')}</p>
                                    </div>
                                    <Zap size={40} className="absolute -bottom-2 -right-2 text-purple-500/5 group-hover:text-purple-500/10 transition-colors" />
                                </div>
                            </div>
                        </header>

                        {/* Prime Metrics Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {selectedRun.metrics && Object.entries(selectedRun.metrics).map(([k, v]) => (
                                <div key={k} className="glass-panel p-8 rounded-2xl border-white/5 bg-black/60 relative overflow-hidden group hover:border-purple-500/30 transition-all">
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 group-hover:text-purple-400 transition-colors">{k.replace(/_/g, ' ')}</h3>
                                    <p className="text-4xl font-mono font-bold text-white tracking-tighter">{typeof v === 'number' ? v.toFixed(5) : v}</p>
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-600/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
                                </div>
                            ))}
                        </div>

                        {/* Diagnostic Visuals */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                            {/* Feature Importance (Always show if available) */}
                            {selectedRun.detailed_report?.feature_importance && (
                                <div className="glass-panel p-8 rounded-3xl border-white/5 bg-black/30 space-y-6">
                                    <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                                        <div className="p-2 rounded-lg bg-purple-600/10"><BarChartIcon size={14} className="text-purple-500" /></div>
                                        <h3 className="text-sm font-bold text-gray-400 tracking-wide uppercase">Feature Influence Matrix</h3>
                                    </div>
                                    <FeatureImportanceChart data={selectedRun.detailed_report.feature_importance} />
                                </div>
                            )}

                            {/* Classification: Confusion Matrix & ROC */}
                            {selectedRun.detailed_report?.type === 'classification' && (
                                <>
                                    <div className="glass-panel p-8 rounded-3xl border-white/5 bg-black/30 space-y-6">
                                        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                                            <div className="p-2 rounded-lg bg-purple-600/10"><Grid size={14} className="text-purple-500" /></div>
                                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Logic Density Map</h3>
                                        </div>
                                        {renderConfusionMatrix(selectedRun.detailed_report.confusion_matrix, selectedRun.detailed_report.classes || [])}
                                    </div>
                                    {selectedRun.detailed_report.roc && (
                                        <div className="glass-panel p-8 rounded-3xl border-white/5 bg-black/30 space-y-6">
                                            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                                                <div className="p-2 rounded-lg bg-purple-600/10"><PieChart size={14} className="text-purple-500" /></div>
                                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Operational Curve (ROC)</h3>
                                            </div>
                                            <ROCCurveChart roc={selectedRun.detailed_report.roc} />
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Regression: Residuals Analysis */}
                            {selectedRun.detailed_report?.type === 'regression' && (
                                <div className="glass-panel p-8 rounded-3xl border-white/5 bg-black/30 lg:col-span-2 space-y-6">
                                    <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                                        <div className="p-2 rounded-lg bg-purple-600/10"><Activity size={14} className="text-purple-500" /></div>
                                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Variance Stream (Actual vs Predicted)</h3>
                                    </div>
                                    <ResidualsChart actual={selectedRun.detailed_report.actual} predicted={selectedRun.detailed_report.predicted} />
                                </div>
                            )}

                            {!selectedRun.detailed_report && (
                                <div className="glass-panel p-20 rounded-3xl border-dashed border-white/5 bg-black/10 flex flex-col items-center justify-center text-gray-800 lg:col-span-2">
                                    <Activity size={48} className="mb-4 opacity-5" />
                                    <p className="text-[11px] font-black uppercase tracking-[0.5em]">No detailed diagnostic artifacts were captured for this run</p>
                                </div>
                            )}
                        </div>

                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-700 opacity-20 italic">
                        <Activity size={120} className="mb-8" />
                        <div className="text-center space-y-2">
                            <h2 className="text-lg font-black uppercase tracking-[0.8em] text-white/50">Awaiting Signal</h2>
                            <p className="text-[10px] font-bold uppercase tracking-[0.4em]">Select active logic from the registry to inspect telemetry</p>
                        </div>
                    </div>
                )}

                {/* Visual decoration */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/[0.03] blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            </div>
        </main>
    );
}
