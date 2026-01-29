"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Dataset, ModelOption, TrainingRun } from "@/lib/types";
import {
    BrainCircuit, Play, Activity, AlertCircle,
    CheckCircle, Loader2, Clock, Trash2,
    Download, ChevronDown, ListFilter, Target, Box
} from "lucide-react";
import { useNotificationStore } from "@/store/notificationStore";

export default function TrainingPage() {
    const { addToast, notifySystem, showConfirm } = useNotificationStore();

    // Data Lists
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [models, setModels] = useState<ModelOption[]>([]);
    const [runs, setRuns] = useState<TrainingRun[]>([]);
    const [columns, setColumns] = useState<string[]>([]);

    // Form Selection
    const [selectedDsId, setSelectedDsId] = useState<number | null>(null);
    const [selectedTarget, setSelectedTarget] = useState<string>("");
    const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
    const [selectedModelKey, setSelectedModelKey] = useState<string>("");

    // UI State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showFeatureMatrix, setShowFeatureMatrix] = useState(false);

    // 1. Initial Load
    useEffect(() => {
        api.get("/datasets/").then(res => setDatasets(res.data));
        api.get("/models/").then(res => setModels(res.data));
        fetchRuns();

        // High-frequency polling for telemetry (every 2s for "live" feel)
        const interval = setInterval(fetchRuns, 2000);
        return () => clearInterval(interval);
    }, []);

    const fetchRuns = () => {
        api.get("/training/runs").then(res => setRuns(res.data));
    };

    // 2. When Dataset changes, fetch columns
    useEffect(() => {
        if (selectedDsId) {
            api.get(`/datasets/${selectedDsId}/preview?limit=1`)
                .then(res => {
                    setColumns(res.data.columns);
                    // Default features to all except target (we'll update this in handleTargetChange too)
                    setSelectedTarget("");
                    setSelectedFeatures([]);
                });
        }
    }, [selectedDsId]);

    const handleTargetChange = (val: string) => {
        setSelectedTarget(val);
        // Automatically select all OTHER columns as features by default
        if (val) {
            setSelectedFeatures(columns.filter(c => c !== val));
        }
    };

    const toggleFeature = (col: string) => {
        if (selectedFeatures.includes(col)) {
            setSelectedFeatures(prev => prev.filter(f => f !== col));
        } else {
            setSelectedFeatures(prev => [...prev, col]);
        }
    };

    // 3. Actions
    const handleStartTraining = async () => {
        if (!selectedDsId || !selectedTarget || !selectedModelKey) return;
        setIsSubmitting(true);

        try {
            await api.post("/training/start", {
                dataset_id: selectedDsId,
                target_column: selectedTarget,
                feature_columns: selectedFeatures,
                model_key: selectedModelKey,
                parameters: {}
            });
            addToast("Training Sequence Initiated", "info");
            notifySystem("Compute Cluster Active", "A new model training run has been queued.");
            fetchRuns();
        } catch (error) {
            addToast("Initialization Fault: Failed to start training engine", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const deleteRun = async (id: number) => {
        showConfirm({
            title: "Purge Logic Instance",
            message: "This will permanently delete the model artifact and all telemetry data for this run.",
            onConfirm: async () => {
                try {
                    await api.delete(`/training/runs/${id}`);
                    addToast("Logic Instance Purged", "success");
                    fetchRuns();
                } catch (error) {
                    addToast("System Fault: Deletion failed", "error");
                }
            }
        });
    };

    const downloadModel = (id: number) => {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
        window.open(`${baseUrl}/training/runs/${id}/download`, '_blank');
        addToast("Downloading Model Artifact", "info");
    };

    return (
        <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 pb-20">
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
                    Execute high-performance machine learning pipelines. Configure target vectors and optimized model architectures.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                {/* LEFT: Configuration Panel */}
                <div className="glass-panel p-8 rounded-[2rem] border-white/5 bg-black/40 h-fit space-y-8 shadow-2xl relative overflow-hidden">
                    <div className="px-1 border-b border-white/5 pb-4">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Pipeline Config</h3>
                    </div>

                    <div className="space-y-6">
                        {/* Dataset Select */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1 flex items-center gap-2">
                                <Box size={10} className="text-purple-500" /> Artifact Source
                            </label>
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
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1 flex items-center gap-2">
                                <Target size={10} className="text-purple-500" /> Target Vector (Y)
                            </label>
                            <select
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-xs focus:ring-2 focus:ring-purple-500/30 outline-none transition-all appearance-none cursor-pointer font-bold disabled:opacity-30"
                                onChange={(e) => handleTargetChange(e.target.value)}
                                value={selectedTarget}
                                disabled={!selectedDsId}
                            >
                                <option value="" className="bg-[#04060c]">Select Target Column...</option>
                                {columns.map(col => (
                                    <option key={col} value={col} className="bg-[#04060c]">{col}</option>
                                ))}
                            </select>
                        </div>

                        {/* Feature Selection (The NEW Matrix) */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    <ListFilter size={10} className="text-purple-500" /> Feature Matrix (X)
                                </label>
                                <span className="text-[9px] font-bold text-gray-400">{selectedFeatures.length}/{columns.length - 1} Selected</span>
                            </div>

                            <button
                                onClick={() => setShowFeatureMatrix(!showFeatureMatrix)}
                                disabled={!selectedTarget}
                                className="w-full bg-white/[0.03] border border-white/5 rounded-xl p-4 flex items-center justify-between text-xs text-gray-400 hover:bg-white/[0.05] transition-all disabled:opacity-30"
                            >
                                <span className="font-bold uppercase tracking-widest text-[10px]">Configure Selection</span>
                                <ChevronDown size={14} className={`transition-transform duration-300 ${showFeatureMatrix ? 'rotate-180' : ''}`} />
                            </button>

                            {showFeatureMatrix && (
                                <div className="animate-in slide-in-from-top-2 fade-in duration-300 bg-black/60 rounded-2xl border border-white/5 p-4 max-h-[300px] overflow-y-auto custom-scrollbar grid grid-cols-1 gap-2">
                                    {columns.filter(c => c !== selectedTarget).map(col => (
                                        <div
                                            key={col}
                                            onClick={() => toggleFeature(col)}
                                            className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${selectedFeatures.includes(col)
                                                ? 'bg-purple-600/10 border-purple-500/40'
                                                : 'bg-white/5 border-white/5'
                                                }`}
                                        >
                                            <span className={`text-[10px] font-bold uppercase tracking-widest ${selectedFeatures.includes(col) ? 'text-purple-400' : 'text-gray-500'}`}>
                                                {col}
                                            </span>
                                            <div className={`w-3 h-3 rounded-full border-2 ${selectedFeatures.includes(col)
                                                ? 'bg-purple-500 border-purple-400'
                                                : 'border-white/10'
                                                }`}></div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Model Select */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1 flex items-center gap-2">
                                <Activity size={10} className="text-purple-500" /> Protocol / Algorithm
                            </label>
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
                    </div>

                    <button
                        onClick={handleStartTraining}
                        disabled={isSubmitting || !selectedDsId || !selectedTarget || !selectedModelKey || selectedFeatures.length === 0}
                        className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-white/5 disabled:text-gray-700 text-white p-5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex justify-center items-center gap-3 transition-all shadow-2xl shadow-purple-950/40 active:scale-95"
                    >
                        {isSubmitting ? "Syncing..." : <><Play size={14} /> Initiate Training Protocol</>}
                    </button>

                    {/* Visual decoration */}
                    <div className="absolute top-0 left-0 w-32 h-32 bg-purple-600/[0.02] blur-[60px] rounded-full -translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
                </div>

                {/* RIGHT: Experiment Tracking Board */}
                <div className="lg:col-span-2 glass-panel p-8 rounded-[2rem] border-white/5 bg-black/20 min-h-[600px] flex flex-col shadow-2xl relative overflow-hidden">
                    <div className="flex items-center justify-between mb-8 px-1 border-b border-white/5 pb-4">
                        <div className="flex items-center gap-3">
                            <Activity className="text-purple-500" size={16} />
                            <h3 className="text-[10px] font-black text-gray-400 font-mono uppercase tracking-[0.3em]">Telemetry Stream</h3>
                        </div>
                        <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{runs.length} Runs Logged</span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-6 pr-1 custom-scrollbar">
                        {runs.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-700 opacity-20 italic">
                                <Activity size={48} className="mb-4" />
                                <p className="text-xs font-black uppercase tracking-[0.4em]">No active runs detected</p>
                            </div>
                        ) : (
                            runs.map(run => (
                                <div key={run.id} className="relative bg-black/20 p-6 rounded-[1.5rem] border border-white/5 flex flex-col gap-6 group transition-all hover:border-purple-500/20 hover:bg-black/30">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-3">
                                                <span className="font-black text-sm text-white uppercase tracking-tight italic">{run.model_name}</span>
                                                <span className="text-[10px] font-mono text-gray-600">ID: {run.id}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${run.status === 'completed' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : run.status === 'failed' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 'bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]'}`}></div>
                                                <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.1em]">
                                                    {new Date(run.created_at).toLocaleTimeString()} • {run.status}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {run.status === 'completed' && (
                                                <button
                                                    onClick={() => downloadModel(run.id)}
                                                    className="p-2 rounded-lg bg-white/5 border border-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                                                    title="Download Weights"
                                                >
                                                    <Download size={14} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => deleteRun(run.id)}
                                                className="p-2 rounded-lg bg-rose-500/5 border border-rose-500/10 text-rose-500/60 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                                                title="Purge Run"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Progress Section */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                            <span className="text-gray-500 flex items-center gap-2 uppercase">
                                                {run.status === 'completed' ? 'Processing Finalized' : run.status === 'failed' ? 'Engine Fault' : `Current Stage: ${run.stage || 'Initializing'}`}
                                            </span>
                                            <span className={run.status === 'completed' ? 'text-emerald-500' : run.status === 'failed' ? 'text-rose-500' : 'text-blue-500'}>
                                                {run.progress || 0}%
                                            </span>
                                        </div>
                                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-1000 ease-out ${run.status === 'completed' ? 'bg-emerald-500' :
                                                    run.status === 'failed' ? 'bg-rose-500' :
                                                        'bg-purple-600 shadow-[0_0_10px_rgba(147,51,234,0.5)]'
                                                    }`}
                                                style={{ width: `${run.progress || 0}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    {/* Metrics Footer */}
                                    {run.status === 'completed' && run.metrics && (
                                        <div className="pt-4 border-t border-white/5 flex flex-wrap gap-4">
                                            {Object.entries(run.metrics).map(([k, v]) => (
                                                <div key={k} className="flex flex-col gap-1">
                                                    <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">{k}</span>
                                                    <span className="text-emerald-400 font-mono font-bold text-xs">{v.toFixed(4)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {run.status === 'failed' && (
                                        <div className="pt-4 border-t border-white/5">
                                            <p className="text-rose-400 text-[10px] font-bold uppercase tracking-widest italic">{run.error_message}</p>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Visual decoration */}
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-600/[0.01] blur-[100px] rounded-full translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                </div>
            </div>
        </div>
    );
}
