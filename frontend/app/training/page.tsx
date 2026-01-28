"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Dataset, ModelOption, TrainingRun } from "@/lib/types";
import { BrainCircuit, Play, Activity, AlertCircle, CheckCircle } from "lucide-react";

export default function TrainingPage() {
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
            fetchRuns(); // Refresh immediately
        } catch (error) {
            alert("Failed to start training");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-slate-900 text-white p-8">
            <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
                <BrainCircuit className="text-purple-500" size={32} /> Model Training Studio
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* LEFT: Configuration Panel */}
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 h-fit">
                    <h2 className="text-xl font-semibold mb-6">Configuration</h2>
                    
                    {/* Dataset Select */}
                    <div className="mb-4">
                        <label className="block text-sm text-gray-400 mb-2">1. Select Dataset</label>
                        <select 
                            className="w-full bg-gray-900 border border-gray-600 rounded p-3"
                            onChange={(e) => setSelectedDsId(Number(e.target.value))}
                            value={selectedDsId || ""}
                        >
                            <option value="">-- Choose Dataset --</option>
                            {datasets.map(ds => (
                                <option key={ds.id} value={ds.id}>{ds.filename}</option>
                            ))}
                        </select>
                    </div>

                    {/* Target Select */}
                    <div className="mb-4">
                        <label className="block text-sm text-gray-400 mb-2">2. Target Column (Y)</label>
                        <select 
                            className="w-full bg-gray-900 border border-gray-600 rounded p-3"
                            onChange={(e) => setSelectedTarget(e.target.value)}
                            value={selectedTarget}
                            disabled={!selectedDsId}
                        >
                            <option value="">-- Choose Target --</option>
                            {columns.map(col => (
                                <option key={col} value={col}>{col}</option>
                            ))}
                        </select>
                    </div>

                    {/* Model Select */}
                    <div className="mb-6">
                        <label className="block text-sm text-gray-400 mb-2">3. Select Model</label>
                        <select 
                            className="w-full bg-gray-900 border border-gray-600 rounded p-3"
                            onChange={(e) => setSelectedModelKey(e.target.value)}
                            value={selectedModelKey}
                        >
                            <option value="">-- Choose Algorithm --</option>
                            {models.map(m => (
                                <option key={m.key} value={m.key}>
                                    [{m.type.toUpperCase()}] {m.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={handleStartTraining}
                        disabled={isSubmitting || !selectedDsId || !selectedTarget || !selectedModelKey}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 py-3 rounded-lg font-bold flex justify-center items-center gap-2 disabled:opacity-50"
                    >
                        {isSubmitting ? "Starting..." : <><Play size={20} /> Start Training</>}
                    </button>
                </div>

                {/* RIGHT: Experiment Tracking Board */}
                <div className="lg:col-span-2 bg-gray-800 p-6 rounded-xl border border-gray-700 min-h-[500px]">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <Activity className="text-blue-500" /> Training Runs
                    </h2>

                    <div className="space-y-4">
                        {runs.length === 0 ? (
                            <p className="text-gray-500 italic text-center mt-12">No training runs yet. Start one on the left.</p>
                        ) : (
                            runs.map(run => (
                                <div key={run.id} className="bg-gray-900 p-4 rounded-lg border border-gray-700 flex justify-between items-center">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-lg text-gray-200">{run.model_name}</span>
                                            <span className="text-xs text-gray-500">#{run.id}</span>
                                        </div>
                                        <p className="text-xs text-gray-400">
                                            {new Date(run.created_at).toLocaleString()}
                                        </p>
                                    </div>

                                    {/* Metrics / Status */}
                                    <div className="text-right">
                                        {run.status === 'completed' && run.metrics && (
                                            <div className="flex gap-4 text-sm">
                                                {Object.entries(run.metrics).map(([k, v]) => (
                                                    <div key={k} className="bg-gray-800 px-3 py-1 rounded border border-gray-700">
                                                        <span className="text-gray-400 mr-2">{k}:</span>
                                                        <span className="text-green-400 font-mono font-bold">{v.toFixed(4)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        
                                        {run.status === 'failed' && (
                                            <p className="text-red-400 text-sm max-w-[300px] truncate">{run.error_message}</p>
                                        )}
                                    </div>

                                    {/* Status Badge */}
                                    <div className="ml-4 min-w-[100px] flex justify-end">
                                        {run.status === 'completed' && <div className="flex items-center gap-1 text-green-500"><CheckCircle size={18}/> Done</div>}
                                        {run.status === 'failed' && <div className="flex items-center gap-1 text-red-500"><AlertCircle size={18}/> Failed</div>}
                                        {run.status === 'running' && <div className="flex items-center gap-1 text-blue-400 animate-pulse"><Activity size={18}/> Training</div>}
                                        {run.status === 'pending' && <div className="text-gray-500">Queued</div>}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}