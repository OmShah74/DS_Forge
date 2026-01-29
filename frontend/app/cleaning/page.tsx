"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Dataset } from "@/lib/types";
import { Play, RefreshCw, Table as TableIcon, Database, Layers, CheckCircle2, AlertCircle } from "lucide-react";
import DataGrid from "@/components/DataGrid";
import CleaningControls from "@/components/CleaningControls";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface PreviewData {
    columns: string[];
    data: any[];
    total_rows: number;
}

export default function CleaningPage() {
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [preview, setPreview] = useState<PreviewData | null>(null);

    // Operation State
    const [operation, setOperation] = useState("drop_missing");
    const [params, setParams] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [statusText, setStatusText] = useState<string | null>(null);

    useEffect(() => {
        api.get("/datasets/").then((res) => setDatasets(res.data));
    }, []);

    useEffect(() => {
        if (selectedId) {
            loadPreview(selectedId);
            setParams({}); // Reset params when dataset changes
        }
    }, [selectedId]);

    const loadPreview = async (id: number) => {
        try {
            const res = await api.get(`/cleaning/preview/${id}`);
            setPreview(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleApply = async () => {
        if (!selectedId) return;
        setLoading(true);
        setStatusText("Executing Pipeline...");
        try {
            await api.post("/cleaning/apply", {
                dataset_id: selectedId,
                operation: operation,
                params: params // Already an object from CleaningControls
            });

            setStatusText("Success! Artifact Created");
            // Reload datasets list
            const res = await api.get("/datasets/");
            setDatasets(res.data);
            setTimeout(() => setStatusText(null), 3000);

        } catch (error: any) {
            alert(error.response?.data?.detail || "Operation failed");
            setStatusText("Pipeline Aborted");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] space-y-6">
            <header className="flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-3xl font-black text-white flex items-center gap-3 italic leading-none">
                        <Layers className="text-purple-500" /> CLEANING <span className="text-purple-500">ENGINE</span>
                    </h1>
                    <p className="text-gray-400 mt-2 uppercase text-[10px] font-bold tracking-[0.2em] opacity-60">Transform and sanitize artifacts for model readiness</p>
                </div>
            </header>

            <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
                {/* Left: Source Registry */}
                <div className="w-80 flex flex-col space-y-4 shrink-0">
                    <div className="glass-panel p-5 rounded-2xl flex flex-col h-full border-white/5 overflow-hidden shadow-2xl">
                        <div className="flex items-center gap-2 px-1 mb-4 shrink-0">
                            <Database size={14} className="text-purple-500" />
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
                                            ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                                            : 'bg-white/[0.02] border-white/5 text-gray-500 hover:bg-white/5 hover:text-gray-300'}
                                    `}
                                >
                                    {selectedId === ds.id && (
                                        <div className="absolute left-0 top-0 w-1 h-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
                                    )}
                                    <p className="font-bold text-sm truncate">{ds.filename}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-[9px] font-black opacity-60 uppercase tracking-tighter">{ds.row_count} rows</span>
                                        <span className="w-1 h-1 rounded-full bg-white/10"></span>
                                        <span className="text-[9px] font-black opacity-60 uppercase tracking-tighter">ID: {ds.id}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Workspace */}
                <div className="flex-1 flex flex-col gap-6 min-h-0 overflow-hidden">
                    {/* Controls - Fixed height with internal scroll */}
                    <div className="glass-panel rounded-2xl border-white/5 flex flex-col shrink-0 overflow-hidden shadow-2xl">
                        <div className="p-5 border-b border-white/5 bg-white/[0.01] shrink-0">
                            <div className="flex items-center justify-between gap-6">
                                <div className="space-y-1.5 flex-1 max-w-sm">
                                    <label className="text-[10px] font-black text-purple-500 uppercase tracking-[0.2em] px-1">Control Console</label>
                                    <select
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm focus:ring-2 focus:ring-purple-500/30 outline-none transition-all appearance-none cursor-pointer font-bold"
                                        value={operation}
                                        onChange={(e) => setOperation(e.target.value)}
                                    >
                                        <optgroup label="Missing Data" className="bg-[#0a0c14]">
                                            <option value="drop_missing">Drop Missing Rows</option>
                                            <option value="fill_missing">Fill Missing Values</option>
                                        </optgroup>
                                        <optgroup label="Feature Engineering" className="bg-[#0a0c14]">
                                            <option value="rename_columns">Rename Columns (Header Sanitization)</option>
                                            <option value="drop_columns">Drop Features (Columns)</option>
                                            <option value="convert_type">Cast / Convert Type</option>
                                        </optgroup>
                                        <optgroup label="Quality Control" className="bg-[#0a0c14]">
                                            <option value="drop_duplicates">Remove Duplicates</option>
                                            <option value="remove_outliers_zscore">Outliers (Z-Score)</option>
                                            <option value="remove_outliers_iqr">Outliers (IQR)</option>
                                            <option value="text_clean">Text Normalization</option>
                                        </optgroup>
                                    </select>
                                </div>

                                <div className="flex items-center gap-4 shrink-0">
                                    {statusText && (
                                        <div className={cn(
                                            "flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-3 rounded-xl bg-purple-500/5 border border-purple-500/20 animate-in fade-in slide-in-from-right-2",
                                            statusText.includes('Success') ? "text-emerald-400" : "text-purple-400"
                                        )}>
                                            {statusText.includes('Success') ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                                            {statusText}
                                        </div>
                                    )}
                                    <button
                                        onClick={handleApply}
                                        disabled={loading || !selectedId}
                                        className={cn(
                                            "px-8 h-12 rounded-xl font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 transition-all active:scale-95 shadow-lg",
                                            loading || !selectedId
                                                ? "bg-white/5 text-gray-600 cursor-not-allowed border border-white/5"
                                                : "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/20"
                                        )}
                                    >
                                        {loading ? <RefreshCw size={16} className="animate-spin" /> : <><Play size={16} /> Execute Transform</>}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Dynamics Area - Internal Scroll */}
                        <div className="p-6 overflow-y-auto max-h-[300px] custom-scrollbar bg-black/20">
                            <CleaningControls
                                operation={operation}
                                columns={preview?.columns || []}
                                onParamsChange={setParams}
                            />
                        </div>
                    </div>

                    {/* Preview Area - Flexible */}
                    <div className="flex-1 glass-panel p-6 rounded-2xl border-white/5 flex flex-col overflow-hidden relative min-h-0 shadow-2xl">
                        <div className="flex items-center justify-between mb-4 shrink-0 px-1">
                            <div className="flex items-center gap-2">
                                <Layers size={14} className="text-purple-500" />
                                <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Stream Analysis</h2>
                            </div>
                            {preview && (
                                <span className="text-[9px] font-black text-gray-500 uppercase bg-white/5 px-2 py-1 rounded border border-white/5">
                                    {preview.columns.length} Features • {preview.total_rows} Records
                                </span>
                            )}
                        </div>

                        <div className="flex-1 min-h-0 bg-black/40 rounded-xl border border-white/5 overflow-hidden relative">
                            {preview ? (
                                <div className="absolute inset-0">
                                    <DataGrid
                                        columns={preview.columns}
                                        data={preview.data}
                                        datasetId={selectedId || undefined}
                                    />
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-700">
                                    <TableIcon size={32} className="mb-4 opacity-5" />
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Awaiting Data Stream Selection</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
