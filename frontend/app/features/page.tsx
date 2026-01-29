"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Dataset } from "@/lib/types";
import DataGrid from "@/components/DataGrid";
import {
    FlaskConical, Play, Sparkles, Filter,
    Settings, ListChecks, Wand2, Info
} from "lucide-react";
import { useNotificationStore } from "@/store/notificationStore";

export default function FeatureEngineeringPage() {
    const { addToast, notifySystem } = useNotificationStore();
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [preview, setPreview] = useState<any>(null);
    const [columns, setColumns] = useState<string[]>([]);

    // Wizard State
    const [operation, setOperation] = useState("standard_scaler");
    const [selectedCols, setSelectedCols] = useState<string[]>([]);
    const [pcaComponents, setPcaComponents] = useState(2);
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
        const res = await api.get(`/datasets/${id}/preview?limit=10`);
        setPreview(res.data);
        setColumns(res.data.columns);
        setSelectedCols([]);
    };

    const toggleColumn = (col: string) => {
        if (selectedCols.includes(col)) {
            setSelectedCols(prev => prev.filter(c => c !== col));
        } else {
            setSelectedCols(prev => [...prev, col]);
        }
    };

    const handleApply = async () => {
        if (!selectedId || selectedCols.length === 0) return;
        setLoading(true);
        try {
            const finalParams: any = { columns: selectedCols };
            if (operation === 'pca') {
                finalParams.n_components = pcaComponents;
            }

            await api.post("/features/apply", {
                dataset_id: selectedId,
                operation: operation,
                params: finalParams
            });
            addToast("Mutation Successful: Features computed", "success");
            notifySystem("Pipeline Complete", `Feature engineering (${operation}) successful.`);
            loadDatasets();
        } catch (error: any) {
            const msg = error.response?.data?.detail || "Operation failed";
            addToast(msg, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="h-[calc(100vh-100px)] flex gap-8 overflow-hidden animate-in fade-in duration-700 pb-10">
            {/* LEFT: Controls */}
            <div className="w-96 flex flex-col gap-8 shrink-0">

                {/* Dataset Selector */}
                <div className="glass-panel p-6 rounded-[2rem] flex flex-col h-[40%] border-white/5 overflow-hidden shadow-2xl bg-black/20">
                    <div className="flex items-center justify-between px-1 mb-6 shrink-0">
                        <div className="flex items-center gap-2">
                            <FlaskConical size={14} className="text-purple-500" />
                            <h2 className="text-sm font-semibold text-gray-400 tracking-wide leading-none">Source Registry</h2>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                        {datasets.map(ds => (
                            <div
                                key={ds.id}
                                onClick={() => setSelectedId(ds.id)}
                                className={`
                                    p-5 rounded-2xl cursor-pointer transition-all border group relative overflow-hidden
                                    ${selectedId === ds.id
                                        ? 'bg-purple-500/10 border-purple-500/20 shadow-xl'
                                        : 'bg-white/[0.01] border-white/5 text-gray-500 hover:bg-white/5 hover:text-gray-300'}
                                `}
                            >
                                {selectedId === ds.id && (
                                    <div className="absolute left-0 top-0 w-1 h-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
                                )}
                                <p className={`font-bold text-base truncate ${selectedId === ds.id ? 'text-purple-400' : 'text-gray-300'}`}>{ds.filename}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-xs font-semibold opacity-50 tracking-wide bg-black/40 px-2 py-0.5 rounded border border-white/5">{ds.row_count} Vectors</span>
                                    <span className="text-xs font-semibold opacity-50 tracking-wide bg-black/40 px-2 py-0.5 rounded border border-white/5">{ds.column_count} Features</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Mutation Wizard */}
                <div className="glass-panel p-8 rounded-[2rem] flex flex-col h-[60%] border-white/5 overflow-hidden shadow-2xl bg-black/40 relative">
                    <div className="flex items-center gap-3 px-1 mb-8 shrink-0">
                        <div className="p-2 rounded-lg bg-purple-600/10 border border-purple-500/20">
                            <Wand2 size={16} className="text-purple-500" />
                        </div>
                        <h2 className="text-sm font-bold text-gray-400 tracking-wide uppercase">Mutation Wizard</h2>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-8 pr-2 custom-scrollbar pb-6">

                        {/* Technique Select */}
                        <div className="space-y-4">
                            <label className="text-base font-semibold text-gray-500 tracking-wide px-1 flex items-center gap-2">
                                <Settings size={12} className="text-purple-500" /> Transformation Protocol
                            </label>
                            <select
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-xs focus:ring-2 focus:ring-purple-500/30 outline-none transition-all appearance-none cursor-pointer font-bold"
                                value={operation}
                                onChange={(e) => setOperation(e.target.value)}
                            >
                                <optgroup label="Symmetry & Scaling" className="bg-[#04060c]">
                                    <option value="standard_scaler">Standard Scaler (Z-Score)</option>
                                    <option value="minmax_scaler">MinMax Scaler (0-1 Range)</option>
                                </optgroup>
                                <optgroup label="Logic Encoding" className="bg-[#04060c]">
                                    <option value="label_encoding">Direct Label Encoder</option>
                                    <option value="one_hot_encoding">One-Hot Signal Matrix</option>
                                </optgroup>
                                <optgroup label="Compression" className="bg-[#04060c]">
                                    <option value="pca">PCA (Dimension Reduction)</option>
                                </optgroup>
                            </select>
                        </div>

                        {/* Feature Selection Pills */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <ListChecks size={10} className="text-purple-500" /> target vectors
                                </label>
                                <span className="text-[9px] font-black text-purple-400 italic">{selectedCols.length} Selected</span>
                            </div>

                            {!selectedId ? (
                                <div className="p-6 border border-dashed border-white/5 rounded-2xl flex flex-col items-center gap-2 justify-center text-gray-700">
                                    <Filter size={14} className="opacity-50" />
                                    <span className="text-[8px] font-black uppercase tracking-widest">Select Source Artifact</span>
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {columns.map(col => (
                                        <button
                                            key={col}
                                            onClick={() => toggleColumn(col)}
                                            className={`
                                                px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all
                                                ${selectedCols.includes(col)
                                                    ? 'bg-purple-600/20 border-purple-500/40 text-purple-400'
                                                    : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10'}
                                            `}
                                        >
                                            {col}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Extra Params */}
                        {operation === 'pca' && (
                            <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                                    <Info size={10} className="text-purple-500" /> PCA Components
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    max={columns.length}
                                    value={pcaComponents}
                                    onChange={(e) => setPcaComponents(Number(e.target.value))}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-xs font-mono font-bold focus:ring-2 focus:ring-purple-500/30 outline-none"
                                />
                            </div>
                        )}
                    </div>

                    <div className="pt-4 mt-auto">
                        <button
                            onClick={handleApply}
                            disabled={loading || !selectedId || selectedCols.length === 0}
                            className={`
                                w-full p-4 rounded-xl font-bold text-sm tracking-wide flex justify-center items-center gap-3 transition-all shadow-2xl active:scale-95
                                ${loading || !selectedId || selectedCols.length === 0
                                    ? 'bg-white/5 text-gray-700'
                                    : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/40'}
                            `}
                        >
                            {loading ? "Syncing Logic..." : <><Sparkles size={16} /> Commit Mutation</>}
                        </button>
                    </div>

                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/[0.02] blur-[80px] rounded-full pointer-events-none"></div>
                </div>
            </div>

            {/* RIGHT: Data Grid */}
            <div className="flex-1 glass-panel p-2 rounded-[2.5rem] overflow-hidden flex flex-col border-white/5 shadow-2xl relative bg-black/40">
                {preview ? (
                    <div className="flex-1 animate-in fade-in duration-1000">
                        <DataGrid
                            columns={preview.columns}
                            data={preview.data}
                            datasetId={selectedId!}
                        />
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-700 opacity-20">
                        <FlaskConical size={100} className="mb-8" />
                        <div className="text-center space-y-2">
                            <h2 className="text-xl font-black uppercase tracking-[0.8em] text-white/50">Core Engine Idle</h2>
                            <p className="text-[10px] font-bold uppercase tracking-[0.4em]">Select active logic from the registry to inspect telemetry</p>
                        </div>
                    </div>
                )}
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/[0.01] blur-[150px] rounded-full pointer-events-none translate-y-1/2 translate-x-1/2"></div>
            </div>
        </main>
    );
}
