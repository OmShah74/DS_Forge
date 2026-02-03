"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Dataset, ModelOption, TrainingRun } from "@/lib/types";
import {
    BrainCircuit, Play, Activity, AlertCircle,
    CheckCircle, Loader2, Clock, Trash2,
    Download, ChevronDown, ChevronUp, ListFilter, Target, Box, Settings, Terminal, HelpCircle, Sparkles
} from "lucide-react";
import { useNotificationStore } from "@/store/notificationStore";
import { useExplainabilityStore } from "@/store/explainabilityStore";
import { useConfigStore } from "@/store/configStore";
import { Info } from "lucide-react";

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
    const [selectedParams, setSelectedParams] = useState<Record<string, any>>({});

    const [featureAnalysis, setFeatureAnalysis] = useState<any[]>([]);
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const { openHelp } = useExplainabilityStore();
    const { apiKey, llmProvider, modelName } = useConfigStore(); // Get LLM Config

    // UI State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showFeatureMatrix, setShowFeatureMatrix] = useState(false);

    // Advanced State
    const [taskType, setTaskType] = useState<"classification" | "regression">("regression");
    const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

    // Filter models based on task type
    const availableModels = models.filter(m => m.type === taskType);

    // 1. Initial Load
    useEffect(() => {
        api.get("/datasets/").then(res => setDatasets(res.data)).catch(err => console.error("Datasets fetch failed", err));
        api.get("/models/").then(res => setModels(res.data)).catch(err => console.error("Models fetch failed", err));
        fetchRuns();

        // High-frequency polling for telemetry (every 2s for "live" feel)
        const interval = setInterval(fetchRuns, 2000);
        return () => clearInterval(interval);
    }, []);

    const fetchRuns = () => {
        // Silently catch polling errors to avoid spamming the user
        api.get("/training/runs")
            .then(res => setRuns(res.data))
            .catch(() => { });
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

    const fetchAnalysisAndRecs = (target: string, typeOverride: string | null) => {
        // We use Promise.allSettled to ensure one failure doesn't block the other
        Promise.allSettled([
            api.post("/analysis/features", { dataset_id: selectedDsId, target_column: target }),

            // PASS LLM CONFIG HERE
            api.post("/models/recommend", {
                dataset_id: selectedDsId,
                target_column: target,
                task_type: typeOverride,
                provider: llmProvider,
                api_key: apiKey,
                model: modelName
            })
        ]).then(([resFeatures, resRecs]) => {

            // Handle Features
            if (resFeatures.status === 'fulfilled') {
                setFeatureAnalysis(resFeatures.value.data);
            } else {
                console.error("Feature Analysis Failed", resFeatures.reason);
                setFeatureAnalysis([]);
            }

            // Handle Recommendations
            if (resRecs.status === 'fulfilled') {
                const recs = resRecs.value.data;
                setRecommendations(recs);

                // If this was an auto-detect (typeOverride is null), perform a smart switch of the UI toggler
                // based on the first recommendation's type if possible, or infer from logic.
                if (!typeOverride && recs.length > 0) {
                    const bestRec = recs[0];
                    const modelDef = models.find(m => m.key === bestRec.key);
                    if (modelDef) {
                        setTaskType(modelDef.type as any);
                    }
                    // Auto-select best model
                    handleModelChange(bestRec.key);
                }
            } else {
                console.error("Recommendations Failed", resRecs.reason);
                setRecommendations([]);
            }
        });
    };

    const handleTargetChange = (val: string) => {
        setSelectedTarget(val);
        setIsModelDropdownOpen(false);
        if (val) {
            setSelectedFeatures(columns.filter(c => c !== val));
            // Pass null to let backend auto-detect initially
            fetchAnalysisAndRecs(val, null);
        } else {
            setFeatureAnalysis([]);
            setRecommendations([]);
        }
    };

    const handleModelChange = (key: string) => {
        setSelectedModelKey(key);
        const model = models.find(m => m.key === key);
        if (model) {
            setSelectedParams(model.default_params || {});
        }
    };

    const updateParam = (key: string, val: any) => {
        setSelectedParams(prev => ({ ...prev, [key]: val }));
    };

    const toggleTaskType = (type: "classification" | "regression") => {
        setTaskType(type);
        setRecommendations([]); // Clear old recs
        setSelectedModelKey("");
        if (selectedTarget) {
            fetchAnalysisAndRecs(selectedTarget, type);
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
                parameters: selectedParams
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
        <main className="min-h-screen bg-[#020408] text-white overflow-x-hidden selection:bg-purple-500/30 selection:text-purple-200 pb-20">
            {/* Header */}
            <header className="max-w-7xl mx-auto px-6 pt-8 pb-12 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center">
                        <BrainCircuit size={24} className="text-purple-500" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-purple-500 tracking-widest leading-none mb-1 uppercase">Compute Studio</h2>
                        <h1 className="text-4xl font-black text-white mt-1 tracking-tight flex items-center gap-4 uppercase italic">
                            Model <span className="text-purple-600">Training</span>
                            <button
                                onClick={() => openHelp('training')}
                                className="p-2 hover:bg-white/5 rounded-full text-gray-600 hover:text-purple-400 transition-colors"
                            >
                                <HelpCircle size={20} />
                            </button>
                        </h1>
                    </div>
                </div>
                <p className="text-gray-400 text-base font-medium max-w-lg mt-2">
                    Execute high-performance machine learning pipelines. Configure target vectors and optimized model architectures.
                </p>
            </header>


            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 max-w-7xl mx-auto px-6">

                {/* LEFT: Configuration Panel */}
                <div className="glass-panel p-8 rounded-[2rem] border-white/5 bg-black/40 h-fit space-y-8 shadow-2xl relative">
                    <div className="px-1 border-b border-white/5 pb-4">
                        <h3 className="text-sm font-bold text-gray-400 tracking-wide uppercase">Pipeline Configuration</h3>
                    </div>

                    <div className="space-y-6">
                        {/* Dataset Select */}
                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-gray-500 tracking-wide px-1 flex items-center gap-2">
                                <Box size={14} className="text-purple-500" /> Artifact Source
                            </label>
                            <select
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm focus:ring-2 focus:ring-purple-500/30 outline-none transition-all appearance-none cursor-pointer font-medium"
                                onChange={(e) => setSelectedDsId(Number(e.target.value))}
                                value={selectedDsId || ""}
                            >
                                <option value="" className="bg-[#04060c]">Select dataset...</option>
                                {datasets.map(ds => (
                                    <option key={ds.id} value={ds.id} className="bg-[#04060c]">{ds.filename}</option>
                                ))}
                            </select>
                        </div>

                        {/* Target Select */}
                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-gray-500 tracking-wide px-1 flex items-center gap-2">
                                <Target size={14} className="text-purple-500" /> Target Vector (Y)
                            </label>
                            <select
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm focus:ring-2 focus:ring-purple-500/30 outline-none transition-all appearance-none cursor-pointer font-medium disabled:opacity-30"
                                onChange={(e) => handleTargetChange(e.target.value)}
                                value={selectedTarget}
                                disabled={!selectedDsId}
                            >
                                <option value="" className="bg-[#04060c]">Select target column...</option>
                                {columns.map(col => (
                                    <option key={col} value={col} className="bg-[#04060c]">{col}</option>
                                ))}
                            </select>
                        </div>

                        {/* Feature Selection (The NEW Matrix) */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-sm font-semibold text-gray-500 tracking-wide flex items-center gap-2">
                                    <ListFilter size={14} className="text-purple-500" /> Feature Matrix (X)
                                </label>
                                <span className="text-xs font-medium text-gray-400">{selectedFeatures.length}/{columns.length - 1} Selected</span>
                            </div>

                            <button
                                onClick={() => setShowFeatureMatrix(!showFeatureMatrix)}
                                disabled={!selectedTarget}
                                className="w-full bg-white/[0.03] border border-white/5 rounded-xl p-3 flex items-center justify-between text-sm text-gray-400 hover:bg-white/[0.05] transition-all disabled:opacity-30"
                            >
                                <span className="font-semibold text-sm">Configure selection</span>
                                <ChevronDown size={14} className={`transition-transform duration-300 ${showFeatureMatrix ? 'rotate-180' : ''}`} />
                            </button>

                            {showFeatureMatrix && (
                                <div className="animate-in slide-in-from-top-2 fade-in duration-300 bg-black/60 rounded-2xl border border-white/5 p-4 max-h-[400px] overflow-y-auto custom-scrollbar grid grid-cols-1 gap-2">
                                    {/* Auto-Select Button */}
                                    {featureAnalysis.length > 0 && (
                                        <button
                                            onClick={() => {
                                                const goodFeatures = featureAnalysis.filter(f => f.relevance === "High" || f.relevance === "Medium").map(f => f.feature);
                                                setSelectedFeatures(goodFeatures);
                                            }}
                                            className="text-[10px] text-purple-400 font-bold uppercase tracking-widest hover:text-white mb-2 text-left"
                                        >
                                            + Auto-Select High Relevance
                                        </button>
                                    )}

                                    {columns.filter(c => c !== selectedTarget).map(col => {
                                        const analysis = featureAnalysis.find(f => f.feature === col);
                                        const isHigh = analysis?.relevance === "High";
                                        const isLow = analysis?.relevance === "Low";

                                        return (
                                            <div
                                                key={col}
                                                onClick={() => toggleFeature(col)}
                                                className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${selectedFeatures.includes(col)
                                                    ? 'bg-purple-600/10 border-purple-500/40'
                                                    : 'bg-white/5 border-white/5'
                                                    }`}
                                            >
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${selectedFeatures.includes(col) ? 'text-purple-400' : 'text-gray-500'}`}>
                                                            {col}
                                                        </span>
                                                        {analysis && (
                                                            <span className={`text-[8px] px-1.5 py-0.5 rounded border ${isHigh ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : isLow ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
                                                                {analysis.relevance}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {analysis && <span className="text-[9px] text-gray-600">{analysis.reason}</span>}
                                                </div>

                                                <div className={`w-3 h-3 rounded-full border-2 ${selectedFeatures.includes(col)
                                                    ? 'bg-purple-500 border-purple-400'
                                                    : 'border-white/10'
                                                    }`}></div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Model Configuration */}
                        {selectedTarget && (
                            <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-6 backdrop-blur-sm animate-in fade-in slide-in-from-left-4">

                                {/* Task Type Switcher */}
                                <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                                    <button
                                        onClick={() => toggleTaskType("regression")}
                                        className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${taskType === 'regression' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'text-gray-500 hover:text-gray-300'}`}
                                    >
                                        Regression
                                    </button>
                                    <button
                                        onClick={() => toggleTaskType("classification")}
                                        className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${taskType === 'classification' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'text-gray-500 hover:text-gray-300'}`}
                                    >
                                        Classification
                                    </button>
                                </div>

                                {/* Custom Model Dropdown */}
                                <div className="relative space-y-3">
                                    <label className="text-sm font-semibold text-gray-500 tracking-wide px-1 flex items-center gap-2">
                                        <Activity size={14} className="text-purple-500" /> Protocol / Algorithm
                                    </label>

                                    <button
                                        onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                                        className="w-full bg-[#09090b] border border-white/10 rounded-xl p-4 text-left flex justify-between items-center hover:border-purple-500/30 transition-all group"
                                    >
                                        <span className={`text-sm font-medium ${selectedModelKey ? 'text-white' : 'text-gray-500'}`}>
                                            {selectedModelKey ? models.find(m => m.key === selectedModelKey)?.name : "Select an algorithm..."}
                                        </span>
                                        {isModelDropdownOpen ? <ChevronUp size={16} className="text-purple-500" /> : <ChevronDown size={16} className="text-gray-600 group-hover:text-purple-500" />}
                                    </button>

                                    {isModelDropdownOpen && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-[#09090b] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 max-h-80 overflow-y-auto">

                                            {/* Recommendations Section */}
                                            {recommendations.length > 0 && (
                                                <div className="p-2">
                                                    <div className="px-2 py-1 text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                                                        <Sparkles size={10} /> Recommended
                                                    </div>
                                                    {recommendations.map(rec => {
                                                        const model = models.find(m => m.key === rec.key);
                                                        if (!model || model.type !== taskType) return null; // Only show if matches current task view

                                                        return (
                                                            <div
                                                                key={rec.key}
                                                                onClick={() => { setSelectedModelKey(rec.key); setIsModelDropdownOpen(false); }}
                                                                className="p-3 rounded-lg hover:bg-emerald-500/10 cursor-pointer group transition-colors border border-transparent hover:border-emerald-500/20"
                                                            >
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <span className="text-white font-bold text-sm tracking-tight">{model.name}</span>
                                                                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">{rec.match_score}% Match</span>
                                                                </div>
                                                                <p className="text-[10px] text-gray-400 group-hover:text-gray-300">
                                                                    {rec.reason}
                                                                </p>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            <div className="h-px bg-white/5 mx-2 my-1" />

                                            {/* Other Models */}
                                            <div className="p-2">
                                                <div className="px-2 py-1 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                                                    Available Architectures
                                                </div>
                                                {availableModels.filter(m => !recommendations.find(r => r.key === m.key)).map(model => (
                                                    <div
                                                        key={model.key}
                                                        onClick={() => { setSelectedModelKey(model.key); setIsModelDropdownOpen(false); }}
                                                        className="p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                                                    >
                                                        <div className="text-white font-medium text-sm">{model.name}</div>
                                                        <div className="text-[10px] text-gray-600 truncate">{model.description}</div>
                                                    </div>
                                                ))}
                                                {availableModels.length === 0 && (
                                                    <div className="p-4 text-center text-xs text-gray-500 italic">
                                                        No other models found for {taskType}.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Recommendation Reason */}
                                {selectedModelKey && recommendations.find(r => r.key === selectedModelKey) && (
                                    <div className="mt-2 px-2 flex items-center gap-2 animate-in fade-in">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">✨ Recommendation Engine:</span>
                                        <span className="text-[10px] text-gray-400 italic">"{recommendations.find(r => r.key === selectedModelKey).reason}"</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Educational / Formula Section */}
                        {selectedModelKey && (
                            <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/10 space-y-3 animate-in fade-in zoom-in-95 duration-300">
                                <div className="flex items-center gap-2">
                                    <BrainCircuit size={14} className="text-purple-400" />
                                    <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">Algorithm Logic</span>
                                </div>
                                <p className="text-xs text-gray-400 leading-relaxed">
                                    {models.find(m => m.key === selectedModelKey)?.description}
                                </p>
                                <div className="p-3 bg-black/40 rounded-lg border border-white/5 font-mono text-[10px] text-purple-300 overflow-x-auto whitespace-nowrap">
                                    {models.find(m => m.key === selectedModelKey)?.formula}
                                </div>
                            </div>
                        )}

                        {/* Hyperparameters Configurator */}
                        {selectedModelKey && models.find(m => m.key === selectedModelKey)?.param_meta && (
                            <div className="space-y-4 pt-4 border-t border-white/5 animate-in fade-in slide-in-from-top-4">
                                <label className="text-[10px] font-bold text-purple-400 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                                    <Settings size={12} /> Tuning Parameters (Optimized Defaults Active)
                                </label>
                                <p className="text-[9px] text-gray-500 italic px-1">
                                    Expert-selected hyperparameters for this algorithm. Adjust only if necessary.
                                </p>
                                <div className="space-y-4">
                                    {Object.entries(models.find(m => m.key === selectedModelKey)!.param_meta).map(([key, meta]: [string, any]) => (
                                        <div key={key} className="space-y-2">
                                            <div className="flex justify-between items-center px-1">
                                                <div className="flex items-center gap-2 group/help relative">
                                                    <span className="text-xs font-semibold text-gray-400 border-b border-dotted border-gray-600 cursor-help">{meta.label || key}</span>
                                                    {meta.help && (
                                                        <div className="absolute left-0 bottom-full mb-2 w-48 p-3 bg-black border border-white/20 rounded-lg shadow-xl opacity-0 group-hover/help:opacity-100 pointer-events-none transition-opacity z-50">
                                                            <div className="flex items-start gap-2">
                                                                <Info size={12} className="text-purple-400 shrink-0 mt-0.5" />
                                                                <p className="text-[10px] text-gray-300 leading-relaxed">{meta.help}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-xs font-mono text-purple-400">{selectedParams[key] ?? 'Default'}</span>
                                            </div>
                                            {meta.type === 'number' ? (
                                                <input
                                                    type="range"
                                                    min={meta.min}
                                                    max={meta.max}
                                                    step={meta.step}
                                                    value={selectedParams[key] ?? meta.min}
                                                    onChange={(e) => updateParam(key, Number(e.target.value))}
                                                    className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                                />
                                            ) : meta.type === 'select' ? (
                                                <select
                                                    value={selectedParams[key]}
                                                    onChange={(e) => updateParam(key, e.target.value)}
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white outline-none"
                                                >
                                                    {meta.options.map((opt: string) => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            ) : null}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleStartTraining}
                        disabled={isSubmitting || !selectedDsId || !selectedTarget || !selectedModelKey || selectedFeatures.length === 0}
                        className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-white/5 disabled:text-gray-700 text-white p-4 rounded-xl font-bold text-sm tracking-wide flex justify-center items-center gap-3 transition-all shadow-2xl shadow-purple-950/40 active:scale-95"
                    >
                        {isSubmitting ? "Syncing..." : <><Play size={14} /> Initiate Training Protocol</>}
                    </button>

                    {/* Visual decoration - OPTIMIZED */}
                    <div className="absolute top-0 left-0 w-32 h-32 bg-purple-600/[0.01] blur-[40px] rounded-full -translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
                </div>

                {/* RIGHT: Experiment Tracking Board */}
                <div className="lg:col-span-2 glass-panel p-8 rounded-[2rem] border-white/5 bg-black/20 min-h-[600px] flex flex-col shadow-2xl relative overflow-hidden">
                    <div className="flex items-center justify-between mb-8 px-1 border-b border-white/5 pb-4">
                        <div className="flex items-center gap-3">
                            <Activity className="text-purple-500" size={16} />
                            <h3 className="text-sm font-bold text-gray-400 font-mono tracking-wide uppercase">Telemetry Stream</h3>
                        </div>
                        <span className="text-xs font-semibold text-gray-500 tracking-wider">{runs.length} Runs Logged</span>
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
                                                <p className="text-xs font-medium text-gray-400">
                                                    {new Date(run.created_at + 'Z').toLocaleString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })} • {run.status}
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
                                        <div className="flex justify-between items-center text-sm font-semibold tracking-tight">
                                            <span className="text-gray-400 flex items-center gap-2">
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

                                    {/* Evaluation Statistics - Intensive Update */}
                                    {run.status === 'completed' && run.metrics && (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-y border-white/5 bg-white/[0.01] rounded-xl px-6">
                                            {Object.entries(run.metrics).map(([k, v]) => (
                                                <div key={k} className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{k.replace('_', ' ')}</span>
                                                    <span className="text-2xl font-mono font-bold text-purple-400 tracking-tighter">{typeof v === 'number' ? v.toFixed(4) : v}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* TERMINAL CONSOLE */}
                                    {(run.status === 'running' || run.status === 'completed' || run.status === 'failed') && (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 px-1">
                                                <Terminal size={12} className="text-purple-500" />
                                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Compute Terminal</span>
                                            </div>
                                            <div className="bg-[#050608] border border-white/5 rounded-xl p-4 font-mono text-[11px] leading-relaxed max-h-[160px] overflow-y-auto custom-scrollbar shadow-inner">
                                                {run.logs && run.logs.length > 0 ? (
                                                    run.logs.map((log, i) => (
                                                        <div key={i} className="flex gap-4 group">
                                                            <span className="text-gray-700 select-none">{i + 1}</span>
                                                            <span className={log.includes('ERROR') ? 'text-rose-400' : 'text-emerald-400/80'}>{log}</span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-gray-700 animate-pulse">Establishing handshake with training engine...</div>
                                                )}
                                                {run.status === 'running' && (
                                                    <div className="mt-2 text-purple-500 flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
                                                        Listening for telemetry broadcast...
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {run.status === 'failed' && (
                                        <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/10">
                                            <p className="text-rose-400 text-xs font-medium">{run.error_message}</p>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Visual decoration - OPTIMIZED */}
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-600/[0.005] blur-[60px] rounded-full translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                </div>
            </div>
        </main >
    );
}
