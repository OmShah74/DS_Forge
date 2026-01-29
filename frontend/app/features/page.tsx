"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Dataset } from "@/lib/types";
import DataGrid from "@/components/DataGrid";
import { FlaskConical, Play, Sparkles } from "lucide-react";
import { useNotificationStore } from "@/store/notificationStore";

export default function FeatureEngineeringPage() {
    const { addToast, notifySystem } = useNotificationStore();
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [preview, setPreview] = useState<any>(null);

    const [operation, setOperation] = useState("standard_scaler");
    const [params, setParams] = useState("{}");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadDatasets();
    }, []);

    const loadDatasets = () => {
        api.get("/datasets/").then((res) => setDatasets(res.data));
    };

    useEffect(() => {
        if (selectedId) loadPreview(selectedId);
    }, [selectedId]);

    const loadPreview = async (id: number) => {
        const res = await api.get(`/cleaning/preview/${id}`);
        setPreview(res.data);
    };

    const handleApply = async () => {
        if (!selectedId) return;
        setLoading(true);
        try {
            const parsedParams = JSON.parse(params);
            await api.post("/features/apply", {
                dataset_id: selectedId,
                operation: operation,
                params: parsedParams
            });
            addToast("Mutation Successful: Features computed", "success");
            notifySystem("Pipeline Complete", `Feature engineering (${operation}) successful.`);
            loadDatasets(); // Refresh list to see new FE dataset
        } catch (error: any) {
            const msg = error.response?.data?.detail || "Operation failed";
            addToast(msg, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="h-[calc(100vh-80px)] flex gap-8 overflow-hidden animate-in fade-in duration-700">
            {/* LEFT: Controls */}
            <div className="w-80 flex flex-col gap-6 shrink-0">
                {/* Dataset Selector */}
                <div className="glass-panel p-6 rounded-2xl flex flex-col h-1/2 border-white/5 overflow-hidden shadow-2xl">
                    <div className="flex items-center gap-2 px-1 mb-4 shrink-0">
                        <FlaskConical size={14} className="text-purple-500" />
                        <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Source Registry</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                        {datasets.map(ds => (
                            <div
                                key={ds.id}
                                onClick={() => setSelectedId(ds.id)}
                                className={`
                                    p-4 rounded-xl cursor-pointer transition-all border group relative overflow-hidden
                                    ${selectedId === ds.id
                                        ? 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                                        : 'bg-white/[0.01] border-white/5 text-gray-500 hover:bg-white/5 hover:text-gray-300'}
                                `}
                            >
                                {selectedId === ds.id && (
                                    <div className="absolute left-0 top-0 w-1 h-full bg-purple-500"></div>
                                )}
                                <p className="font-bold text-sm truncate">{ds.filename}</p>
                                <p className="text-[9px] font-black opacity-60 uppercase tracking-tighter mt-1">{ds.row_count} rows</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Operation Config */}
                <div className="glass-panel p-6 rounded-2xl flex flex-col h-1/2 border-white/5 overflow-hidden shadow-2xl bg-black/40">
                    <div className="flex items-center gap-2 px-1 mb-6 shrink-0">
                        <Sparkles size={14} className="text-purple-500" />
                        <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Compute Config</h2>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-6 pr-1 custom-scrollbar">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Technique</label>
                            <select
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs focus:ring-2 focus:ring-purple-500/30 outline-none transition-all appearance-none cursor-pointer font-bold"
                                value={operation}
                                onChange={(e) => setOperation(e.target.value)}
                            >
                                <optgroup label="Scaling" className="bg-[#04060c]">
                                    <option value="standard_scaler">Standard Scaler (Z-Score)</option>
                                    <option value="minmax_scaler">MinMax Scaler (0-1)</option>
                                </optgroup>
                                <optgroup label="Encoding" className="bg-[#04060c]">
                                    <option value="label_encoding">Label Encoding</option>
                                    <option value="one_hot_encoding">One-Hot Encoding</option>
                                </optgroup>
                                <optgroup label="Dimensionality" className="bg-[#04060c]">
                                    <option value="pca">PCA (Principal Component Analysis)</option>
                                </optgroup>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Parameters (JSON)</label>
                            <textarea
                                className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-3 font-mono text-xs text-purple-300 focus:ring-2 focus:ring-purple-500/30 outline-none resize-none transition-all"
                                value={params}
                                onChange={(e) => setParams(e.target.value)}
                                placeholder='{ "columns": ["age", "salary"] }'
                            />
                        </div>

                        <button
                            onClick={handleApply}
                            disabled={loading || !selectedId}
                            className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-white/5 disabled:text-gray-700 text-white p-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex justify-center items-center gap-3 transition-all shadow-2xl shadow-purple-900/40 active:scale-95 mt-4"
                        >
                            {loading ? "Computing Core..." : <><Play size={14} /> Execute Compute</>}
                        </button>
                    </div>
                </div>
            </div>

            {/* RIGHT: Data Grid */}
            <div className="flex-1 glass-panel p-1 rounded-2xl overflow-hidden flex flex-col border-white/5 shadow-2xl">
                {preview ? (
                    <DataGrid
                        columns={preview.columns}
                        data={preview.data}
                        datasetId={selectedId!}
                    />
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-700 opacity-20">
                        <FlaskConical size={64} className="mb-4" />
                        <p className="text-xs font-black uppercase tracking-[0.4em]">Awaiting Data Stream</p>
                    </div>
                )}
            </div>
        </main>
    );
}
