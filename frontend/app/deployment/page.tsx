"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { TrainingRun } from "@/lib/types";
import { Rocket, Code, Play, AlertCircle, CheckCircle, Copy, HelpCircle } from "lucide-react";
import { useNotificationStore } from "@/store/notificationStore";
import { useExplainabilityStore } from "@/store/explainabilityStore";

export default function DeploymentPage() {
    const { addToast } = useNotificationStore();
    const { openHelp } = useExplainabilityStore();
    const [runs, setRuns] = useState<TrainingRun[]>([]);
    const [selectedRunId, setSelectedRunId] = useState<string>("");

    // Dynamic Form State
    const [requiredFeatures, setRequiredFeatures] = useState<string[]>([]);
    const [featureValues, setFeatureValues] = useState<Record<string, string>>({});

    // Legacy JSON State (computed from form now)
    const [response, setResponse] = useState<any>(null);
    const [isPredicting, setIsPredicting] = useState(false);

    useEffect(() => {
        api.get("/training/runs").then(res => setRuns(res.data.filter((r: any) => r.status === 'completed')));
    }, []);

    // When Model Changes, extract features
    useEffect(() => {
        if (!selectedRunId) {
            setRequiredFeatures([]);
            setFeatureValues({});
            return;
        }

        const run = runs.find(r => r.id === Number(selectedRunId));
        if (run) {
            let features: string[] = [];
            // Priority 1: Explicit feature columns
            if (run.feature_columns && run.feature_columns.length > 0) {
                features = run.feature_columns;
            }
            // Priority 2: Feature Importance keys from report
            else if (run.detailed_report?.feature_importance) {
                features = Object.keys(run.detailed_report.feature_importance);
            }

            setRequiredFeatures(features);

            // Allow manual override if no features found (edge case)
            if (features.length === 0) {
                addToast("Auto-schema detection failed. Please input JSON manually.", "warning");
            }

            // Reset values
            const initialValues: Record<string, string> = {};
            features.forEach(f => initialValues[f] = "");
            setFeatureValues(initialValues);
            setResponse(null);
        }
    }, [selectedRunId, runs]);

    const handleParamChange = (feature: string, value: string) => {
        setFeatureValues(prev => ({ ...prev, [feature]: value }));
    };

    const getPayload = () => {
        // Convert values to numbers where possible, otherwise keep string
        const processed: Record<string, any> = {};
        Object.entries(featureValues).forEach(([k, v]) => {
            const num = Number(v);
            processed[k] = isNaN(num) || v === "" ? v : num;
        });
        return [processed]; // Wrap in array as expected by backend
    };

    const handlePredict = async () => {
        if (!selectedRunId) return;
        setIsPredicting(true);
        setResponse(null);

        try {
            const payload = getPayload();
            const res = await api.post(`/deployment/${selectedRunId}/predict`, payload);
            setResponse(res.data);
            addToast("Inference Successful", "success");
        } catch (error: any) {
            console.error(error);
            setResponse({
                error: true,
                message: error.response?.data?.detail || "Prediction failed. Check inputs matches model expectations."
            });
            addToast("Inference Fault", "error");
        } finally {
            setIsPredicting(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        addToast("Copied to clipboard", "info");
    };

    const computedJson = JSON.stringify(getPayload(), null, 2);

    return (
        <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 pb-20">
            {/* Header */}
            <header className="flex flex-col gap-2 px-1">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center">
                            <Rocket size={24} className="text-purple-500" />
                        </div>
                        <div>
                            <h2 className="text-[10px] font-black text-purple-500 uppercase tracking-[0.4em] leading-none">Access Gateway</h2>
                            <h1 className="text-3xl font-black text-white italic mt-1 font-mono uppercase tracking-tight">Logic <span className="text-purple-600">Deployment</span></h1>
                        </div>
                    </div>
                    <button
                        onClick={() => openHelp('deployment')}
                        className="p-3 rounded-xl bg-white/5 border border-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2 group"
                    >
                        <HelpCircle size={18} className="group-hover:text-purple-400 transition-colors" />
                        <span className="text-xs font-bold uppercase tracking-widest hidden md:inline">Protocol Guide</span>
                    </button>
                </div>
                <p className="text-gray-500 text-xs font-medium max-w-lg mt-2">
                    Interface with active inference nodes. Test production protocols and integrate logic into external systems.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

                {/* LEFT: Test Interface */}
                <div className="glass-panel p-8 rounded-[2rem] border-white/5 bg-black/40 space-y-8 shadow-2xl relative overflow-hidden">
                    <div className="flex items-center justify-between px-1 border-b border-white/5 pb-4">
                        <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Live Testing Node</h2>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                            <span className="text-[9px] font-black text-emerald-500/80 uppercase tracking-widest">Node Active</span>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Logic Artifact Selection</label>
                            <select
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-xs focus:ring-2 focus:ring-purple-500/30 outline-none transition-all appearance-none cursor-pointer font-bold"
                                value={selectedRunId}
                                onChange={(e) => setSelectedRunId(e.target.value)}
                            >
                                <option value="" className="bg-[#04060c]">Select Model Engine...</option>
                                {runs.map(r => (
                                    <option key={r.id} value={r.id} className="bg-[#04060c]">{r.model_name} (ID: {r.id})</option>
                                ))}
                            </select>
                        </div>

                        {selectedRunId && requiredFeatures.length > 0 && (
                            <div className="space-y-4 animate-in slide-in-from-left-2 duration-500">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1 flex items-center gap-2">
                                    <AlertCircle size={10} /> Dynamic Feature Input
                                </label>
                                <div className="grid grid-cols-2 gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                                    {requiredFeatures.map(feature => (
                                        <div key={feature} className="space-y-1">
                                            <label className="text-[9px] font-mono text-purple-300 uppercase truncate block" title={feature}>
                                                {feature}
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Value..."
                                                className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-xs text-white focus:border-purple-500/50 outline-none transition-all"
                                                value={featureValues[feature] || ""}
                                                onChange={(e) => handleParamChange(feature, e.target.value)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handlePredict}
                            disabled={!selectedRunId || isPredicting}
                            className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-white/5 disabled:text-gray-700 text-white p-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex justify-center items-center gap-3 transition-all shadow-2xl shadow-purple-950/40 active:scale-95"
                        >
                            {isPredicting ? "Processing Logic..." : <><Play size={14} /> Transmit Request</>}
                        </button>
                    </div>

                    {response && (
                        <div className="animate-in fade-in zoom-in-95 duration-500 mt-8 space-y-4">
                            <label className={`text-[10px] font-black uppercase tracking-widest px-1 flex items-center gap-2 ${response.error ? "text-rose-500" : "text-emerald-500"}`}>
                                {response.error ? <AlertCircle size={12} /> : <CheckCircle size={12} />}
                                {response.error ? "Inference Failed" : "🎯 Prediction Result"}
                            </label>

                            {/* PROMINENT PREDICTION DISPLAY */}
                            {!response.error && response.predictions && (
                                <div className="bg-gradient-to-br from-emerald-500/20 to-purple-500/10 border-2 border-emerald-500/40 rounded-2xl p-8 text-center relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 blur-3xl rounded-full"></div>
                                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-4">Your Model Predicts</p>
                                    <div className="text-6xl font-black text-white mb-2 drop-shadow-lg">
                                        {response.predictions.map((p: any, i: number) => (
                                            <span key={i} className="inline-block px-4">{String(p)}</span>
                                        ))}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-4">Run ID: {response.run_id}</p>
                                </div>
                            )}

                            {/* Error Display */}
                            {response.error && (
                                <div className="bg-rose-950/30 border border-rose-500/30 rounded-2xl p-6">
                                    <pre className="font-mono text-xs text-rose-300 whitespace-pre-wrap">
                                        {response.message || JSON.stringify(response, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Visual decoration */}
                    <div className="absolute top-0 left-0 w-32 h-32 bg-purple-600/[0.02] blur-[60px] rounded-full -translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
                </div>

                {/* RIGHT: API Documentation */}
                <div className="flex flex-col gap-10">
                    <div className="glass-panel p-8 rounded-[2rem] border-white/5 bg-black/20 space-y-6 shadow-2xl overflow-hidden relative">
                        <div className="flex items-center justify-between px-1 border-b border-white/5 pb-4">
                            <div className="flex items-center gap-3">
                                <Code className="text-purple-500" size={16} />
                                <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Integration Protocol</h2>
                            </div>
                            <button onClick={() => copyToClipboard(computedJson)} className="text-gray-600 hover:text-white transition-colors" title="Copy JSON">
                                <Copy size={14} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <p className="text-gray-500 text-[10px] font-medium leading-relaxed uppercase tracking-widest px-1">
                                Generated Payload (Live Preview)
                            </p>
                            <div className="bg-black/60 p-4 rounded-2xl border border-white/5 relative group">
                                <pre className="text-purple-300 font-mono text-[10px] overflow-x-auto leading-relaxed custom-scrollbar">
                                    {computedJson}
                                </pre>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-gray-500 text-[10px] font-medium leading-relaxed uppercase tracking-widest px-1">
                                CURL Command
                            </p>
                            <div className="bg-black/60 p-4 rounded-2xl border border-white/5 relative group">
                                <pre className="text-gray-400 font-mono text-[10px] overflow-x-auto whitespace-pre-wrap leading-relaxed custom-scrollbar max-h-40">
                                    {`curl -X 'POST' \\
  '${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/api/proxy/deployment/${selectedRunId || "{ID}"}/predict' \\
  -H 'Content-Type: application/json' \\
  -d '${computedJson}'`}
                                </pre>
                            </div>
                        </div>

                        {/* Visual decoration */}
                        <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-600/[0.02] blur-[60px] rounded-full translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                    </div>

                    <div className="glass-panel p-8 rounded-[2rem] border-white/5 bg-purple-600/[0.02] shadow-2xl relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-xs font-black text-purple-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                <span className="w-1 h-1 bg-purple-500 rounded-full animate-ping"></span>
                                Production Readiness
                            </h3>
                            <p className="text-[10px] font-medium text-gray-500 uppercase leading-loose tracking-[0.15em]">
                                This endpoint is currently operating in local development mode. To upgrade to high-availability production clusters, migrate this node to distributed cloud infrastructure (AWS/Azure/GCP).
                            </p>
                        </div>

                        {/* High-tech grid background effect */}
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #8b5cf6 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
