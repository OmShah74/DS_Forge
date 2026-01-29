"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { TrainingRun } from "@/lib/types";
import { Rocket, Code, Play } from "lucide-react";
import { useNotificationStore } from "@/store/notificationStore";

export default function DeploymentPage() {
    const { addToast } = useNotificationStore();
    const [runs, setRuns] = useState<TrainingRun[]>([]);
    const [selectedRunId, setSelectedRunId] = useState<string>("");
    const [inputJson, setInputJson] = useState<string>("[\n  {\n    \"feature1\": 0.5,\n    \"feature2\": 1.0\n  }\n]");
    const [response, setResponse] = useState<any>(null);
    const [isPredicting, setIsPredicting] = useState(false);

    useEffect(() => {
        api.get("/training/runs").then(res => setRuns(res.data.filter((r: any) => r.status === 'completed')));
    }, []);

    const handlePredict = async () => {
        if (!selectedRunId) return;
        setIsPredicting(true);
        try {
            const payload = JSON.parse(inputJson);
            const res = await api.post(`/deployment/${selectedRunId}/predict`, payload);
            setResponse(res.data);
            addToast("Inference Successful", "success");
        } catch (error: any) {
            setResponse({ error: error.response?.data?.detail || "Invalid JSON or Server Error" });
            addToast("Inference Fault", "error");
        } finally {
            setIsPredicting(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 pb-20">
            {/* Header */}
            <header className="flex flex-col gap-2 px-1">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center">
                        <Rocket size={24} className="text-purple-500" />
                    </div>
                    <div>
                        <h2 className="text-[10px] font-black text-purple-500 uppercase tracking-[0.4em] leading-none">Access Gateway</h2>
                        <h1 className="text-3xl font-black text-white italic mt-1 font-mono uppercase tracking-tight">Logic <span className="text-purple-600">Deployment</span></h1>
                    </div>
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

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Request Payload (JSON)</label>
                            <textarea
                                className="w-full h-48 bg-black/40 border border-white/10 rounded-2xl p-4 font-mono text-xs text-purple-300 focus:ring-2 focus:ring-purple-500/30 outline-none resize-none transition-all"
                                value={inputJson}
                                onChange={(e) => setInputJson(e.target.value)}
                            />
                        </div>

                        <button
                            onClick={handlePredict}
                            disabled={!selectedRunId || isPredicting}
                            className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-white/5 disabled:text-gray-700 text-white p-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex justify-center items-center gap-3 transition-all shadow-2xl shadow-purple-950/40 active:scale-95"
                        >
                            {isPredicting ? "Processing Logic..." : <><Play size={14} /> Transmit Request</>}
                        </button>
                    </div>

                    {response && (
                        <div className="animate-in fade-in zoom-in-95 duration-500 mt-8 space-y-3">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Response Artifact</label>
                            <div className="bg-black/40 p-6 rounded-2xl border border-white/5 overflow-hidden">
                                <pre className="text-emerald-400 font-mono text-xs overflow-x-auto custom-scrollbar">
                                    {JSON.stringify(response, null, 2)}
                                </pre>
                            </div>
                        </div>
                    )}

                    {/* Visual decoration */}
                    <div className="absolute top-0 left-0 w-32 h-32 bg-purple-600/[0.02] blur-[60px] rounded-full -translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
                </div>

                {/* RIGHT: API Documentation */}
                <div className="flex flex-col gap-10">
                    <div className="glass-panel p-8 rounded-[2rem] border-white/5 bg-black/20 space-y-6 shadow-2xl overflow-hidden relative">
                        <div className="flex items-center gap-3 px-1 border-b border-white/5 pb-4">
                            <Code className="text-purple-500" size={16} />
                            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Integration Protocol</h2>
                        </div>

                        <p className="text-gray-500 text-[10px] font-medium leading-relaxed uppercase tracking-widest px-1">
                            Execute direct machine-level logic via secure REST endpoints.
                        </p>

                        <div className="bg-black/60 p-6 rounded-2xl border border-white/5 relative group">
                            <div className="absolute top-4 right-4 flex gap-1">
                                <div className="w-2 h-2 rounded-full bg-white/5"></div>
                                <div className="w-2 h-2 rounded-full bg-white/5"></div>
                                <div className="w-2 h-2 rounded-full bg-white/5"></div>
                            </div>
                            <pre className="text-gray-300 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap leading-relaxed custom-scrollbar">
                                {`curl -X 'POST' \\
  'http://localhost:8000/api/v1/deployment/${selectedRunId || "{ID}"}/predict' \\
  -H 'Content-Type: application/json' \\
  -d '[
  {
    "feature1": "value",
    "feature2": "value"
  }
]'`}
                            </pre>
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
