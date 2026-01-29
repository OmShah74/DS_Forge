"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Dataset, ModelOption, TrainingRun } from "@/lib/types";
import { BrainCircuit, Play, Activity, AlertCircle, CheckCircle, Loader2, Clock } from "lucide-react";
import { useNotificationStore } from "@/store/notificationStore";

export default function TrainingPage() {
    const { addToast, notifySystem } = useNotificationStore();
    // Data Lists
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [models, setModels] = useState<ModelOption[]>([]);
    const [runs, setRuns] = useState<TrainingRun[]>([]);
    const [columns, setColumns] = useState<string[]>([]);

    // Form Selection
    const [selectedDsId, setSelectedDsId] = useState<number | null>(null);
    const [selectedTarget, setSelectedTarget] = useState<string>("");
    const [selectedModelKey, setSelectedModelKey] = useState<string>("");

    // UI State
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 1. Initial Load
    useEffect(() => {
        api.get("/datasets/").then(res => setDatasets(res.data));
        api.get("/models/").then(res => setModels(res.data));
        fetchRuns();

        // Poll for status updates every 5 seconds
        const interval = setInterval(fetchRuns, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchRuns = () => {
        api.get("/training/runs").then(res => setRuns(res.data));
    };

    // 2. When Dataset changes, fetch columns
    useEffect(() => {
        if (selectedDsId) {
            api.get(`/cleaning/preview/${selectedDsId}?limit=1`)
                .then(res => setColumns(res.data.columns));
        }
    }, [selectedDsId]);

    // 3. Start Training
    const handleStartTraining = async () => {
        if (!selectedDsId || !selectedTarget || !selectedModelKey) return;
        setIsSubmitting(true);

        try {
            await api.post("/training/start", {
                dataset_id: selectedDsId,
                target_column: selectedTarget,
                model_key: selectedModelKey,
                parameters: {} // Using defaults for now
            });
            addToast("Training Sequence Initiated", "info");
            notifySystem("Compute Cluster Active", "A new model training run has been queued.");
            fetchRuns(); // Refresh immediately
        } catch (error) {
            addToast("Initialization Fault: Failed to start training engine", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
            {/* Header */}
            <header className="flex flex-col gap-2 px-1">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center">
                        <BrainCircuit size={24} className="text-purple-500" />
                    </div>
                    <div>
                        <h2 className="text-[10px] font-black text-purple-500 uppercase tracking-[0.4em] leading-none">Compute Studio</h2>
                        <h1 className="text-3xl font-black text-white italic mt-1 font-mono uppercase tracking-tight">Model <span className="text-purple-600">Training</span></h1>
                    </div>
                </div>
                <p className="text-gray-500 text-xs font-medium max-w-lg mt-2">
                    Execute high-performance machine learning pipelines. Configure target vectors and model architectures.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                {/* LEFT: Configuration Panel */}
                <div className="glass-panel p-8 rounded-[2rem] border-white/5 bg-black/40 h-fit space-y-8 shadow-2xl">
                    <div className="px-1 border-b border-white/5 pb-4">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Pipeline Config</h3>
                    </div>

                    {/* Dataset Select */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">1. Primary Artifact</label>
                        <select
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-xs focus:ring-2 focus:ring-purple-500/30 outline-none transition-all appearance-none cursor-pointer font-bold"
                            onChange={(e) => setSelectedDsId(Number(e.target.value))}
                            value={selectedDsId || ""}
                        >
                            <option value="" className="bg-[#04060c]">Select Dataset...</option>
                            {datasets.map(ds => (
                                <option key={ds.id} value={ds.id} className="bg-[#04060c]">{ds.filename}</option>
                            ))}
                        </select>
                    </div>

                    {/* Target Select */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">2. Target Vector (Y)</label>
                        <select
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-xs focus:ring-2 focus:ring-purple-500/30 outline-none transition-all appearance-none cursor-pointer font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                            onChange={(e) => setSelectedTarget(e.target.value)}
                            value={selectedTarget}
                            disabled={!selectedDsId}
                        >
                            <option value="" className="bg-[#04060c]">Select Target Column...</option>
                            {columns.map(col => (
                                <option key={col} value={col} className="bg-[#04060c]">{col}</option>
                            ))}
                        </select>
                    </div>

                    {/* Model Select */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">3. Protocol / Algorithm</label>
                        <select
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-xs focus:ring-2 focus:ring-purple-500/30 outline-none transition-all appearance-none cursor-pointer font-bold"
                            onChange={(e) => setSelectedModelKey(e.target.value)}
                            value={selectedModelKey}
                        >
                            <option value="" className="bg-[#04060c]">Select Logic...</option>
                            {models.map(m => (
                                <option key={m.key} value={m.key} className="bg-[#04060c]">
                                    [{m.type.toUpperCase()}] {m.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={handleStartTraining}
                        disabled={isSubmitting || !selectedDsId || !selectedTarget || !selectedModelKey}
                        className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-white/5 disabled:text-gray-700 text-white p-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex justify-center items-center gap-3 transition-all shadow-2xl shadow-purple-950/40 active:scale-95"
                    >
                        {isSubmitting ? "Syncing..." : <><Play size={14} /> Initiate Run</>}
                    </button>
                </div>

                {/* RIGHT: Experiment Tracking Board */}
                <div className="lg:col-span-2 glass-panel p-8 rounded-[2rem] border-white/5 bg-black/20 min-h-[550px] flex flex-col shadow-2xl">
                    <div className="flex items-center justify-between mb-8 px-1 border-b border-white/5 pb-4">
                        <div className="flex items-center gap-3">
                            <Activity className="text-purple-500" size={16} />
                            <h3 className="text-[10px] font-black text-gray-400 font-mono uppercase tracking-[0.3em]">Telemetry Stream</h3>
                        </div>
                        <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{runs.length} Runs Logged</span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                        {runs.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-700 opacity-20 italic">
                                <Activity size={48} className="mb-4" />
                                <p className="text-xs font-black uppercase tracking-[0.4em]">No active runs detected</p>
                            </div>
                        ) : (
                            runs.map(run => (
                                <div key={run.id} className="bg-black/20 p-5 rounded-2xl border border-white/5 flex flex-col md:flex-row justify-between items-center group transition-all hover:border-purple-500/20">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-3">
                                            <span className="font-black text-sm text-white uppercase tracking-tight">{run.model_name}</span>
                                            <span className="text-[10px] font-mono text-gray-600">ID: {run.id}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${run.status === 'completed' ? 'bg-emerald-500' : run.status === 'failed' ? 'bg-rose-500' : 'bg-blue-500 animate-pulse'}`}></div>
                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
                                                {new Date(run.created_at).toLocaleTimeString()} • {run.status}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Metrics / Status */}
                                    <div className="flex-1 flex justify-center mt-4 md:mt-0">
                                        {run.status === 'completed' && run.metrics && (
                                            <div className="flex gap-3">
                                                {Object.entries(run.metrics).map(([k, v]) => (
                                                    <div key={k} className="bg-white/[0.02] px-4 py-1.5 rounded-xl border border-white/5">
                                                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest mr-2">{k}:</span>
                                                        <span className="text-emerald-400 font-mono font-bold text-xs">{v.toFixed(4)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {run.status === 'failed' && (
                                            <p className="text-rose-400 text-[10px] font-bold uppercase tracking-widest bg-rose-500/5 px-4 py-1.5 rounded-xl border border-rose-500/10">Engine Fault: {run.error_message}</p>
                                        )}
                                    </div>

                                    {/* Status Icon */}
                                    <div className="ml-4 min-w-[100px] flex justify-end">
                                        {run.status === 'completed' && <CheckCircle size={18} className="text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" />}
                                        {run.status === 'failed' && <AlertCircle size={18} className="text-rose-500" />}
                                        {run.status === 'running' && <Loader2 size={18} className="text-blue-500 animate-spin" />}
                                        {run.status === 'pending' && <Clock size={18} className="text-gray-600" />}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
