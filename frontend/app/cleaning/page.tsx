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

import { useNotificationStore } from "@/store/notificationStore";
import { div } from "framer-motion/client";

interface PreviewData {
    columns: string[];
    data: any[];
    total_rows: number;
}

interface OperationAudit {
    id: string;
    operation: string;
    timestamp: string;
}

export default function CleaningPage() {
    const { addToast, notifySystem } = useNotificationStore();
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [preview, setPreview] = useState<PreviewData | null>(null);

    // Operation State
    const [operation, setOperation] = useState("drop_missing");
    const [params, setParams] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [auditLog, setAuditLog] = useState<OperationAudit[]>([]);

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

        try {
            await api.post("/cleaning/apply", {
                dataset_id: selectedId,
                operation: operation,
                params: params
            });

            addToast("Mutation Successful: Data artifact updated", "success");
            notifySystem("Pipeline Complete", `Successfully applied ${operation.replace(/_/g, ' ')} to dataset.`);

            // Add to audit log
            const audit: OperationAudit = {
                id: Math.random().toString(36).substring(7),
                operation,
                timestamp: new Date().toLocaleTimeString()
            };
            setAuditLog(prev => [audit, ...prev].slice(0, 5));

            // Reload datasets list
            const res = await api.get("/datasets/");
            setDatasets(res.data);

        } catch (error: any) {
            const msg = error.response?.data?.detail || "Operation failed";
            addToast(msg, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] space-y-6">
            <header className="flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3 leading-none">
                        <Layers className="text-purple-500" /> Cleaning <span className="text-purple-600">Engine</span>
                    </h1>
                    <p className="text-gray-400 mt-2 text-base font-medium opacity-60">Transform and sanitize artifacts for model readiness</p>
                </div>
            </header>

            <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
                {/* Left: Source Registry */}
                <div className="w-80 flex flex-col space-y-6 shrink-0">
                    <div className="glass-panel p-5 rounded-2xl flex flex-col h-1/2 border-white/5 overflow-hidden shadow-lg">
                        <div className="flex items-center gap-2 px-1 mb-4 shrink-0">
                            <Database size={14} className="text-purple-500" />
                            <h2 className="text-sm font-semibold text-gray-400 tracking-wide leading-none">Source Registry</h2>
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
                                    <p className="font-bold text-base truncate">{ds.filename}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-xs font-semibold opacity-60 tracking-wide">{ds.row_count} Rows</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass-panel p-5 rounded-2xl flex flex-col h-1/2 border-white/5 overflow-hidden shadow-lg">
                        <div className="flex items-center gap-2 px-1 mb-4 shrink-0">
                            <RefreshCw size={14} className="text-purple-500" />
                            <h2 className="text-sm font-semibold text-gray-400 tracking-wide leading-none">Pipeline History</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                            {auditLog.length > 0 ? auditLog.map(log => (
                                <div key={log.id} className="p-3 rounded-lg border border-white/5 bg-white/[0.02] space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-purple-400 tracking-tight">{log.operation?.replace(/_/g, ' ')}</span>
                                        <span className="text-xs font-medium text-gray-500">{log.timestamp}</span>
                                    </div>
                                    <p className="text-xs text-gray-500">Mutation complete</p>
                                </div>
                            )) : (
                                <div className="h-full flex flex-col items-center justify-center opacity-20 py-8">
                                    <Layers size={24} className="mb-2" />
                                    <p className="text-[9px] font-bold uppercase tracking-widest">No mutations recorded</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Area: Controls & Workspace */}
                <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">
                    {/* Middle: Control Console - Fixed Width Column */}
                    <div className="w-[400px] glass-panel rounded-2xl border-white/5 flex flex-col shrink-0 overflow-hidden shadow-lg h-full">
                        <div className="p-5 border-b border-white/5 bg-white/[0.01] shrink-0">
                            <div className="flex items-center justify-between gap-6">
                                <div className="space-y-3 flex-1 max-w-sm">
                                    <label className="text-sm font-semibold text-purple-500 tracking-wide px-1">Control Console</label>
                                    <select
                                        className="w-full bg-[#0F172A] border border-white/20 rounded-xl p-3 text-white text-base focus:ring-2 focus:ring-purple-500/30 outline-none transition-all appearance-none cursor-pointer font-bold shadow-sm"
                                        value={operation}
                                        onChange={(e) => setOperation(e.target.value)}
                                    >
                                        <optgroup label="Missing Data" className="bg-[#04060c]">
                                            <option value="drop_missing">Drop Missing Rows</option>
                                            <option value="fill_missing">Fill Missing Values</option>
                                        </optgroup>
                                        <optgroup label="Feature Engineering" className="bg-[#04060c]">
                                            <option value="rename_columns">Rename Columns (Header Sanitization)</option>
                                            <option value="drop_columns">Drop Features (Columns)</option>
                                            <option value="convert_type">Cast / Convert Type</option>
                                        </optgroup>
                                        <optgroup label="Quality Control" className="bg-[#04060c]">
                                            <option value="drop_duplicates">Remove Duplicates</option>
                                            <option value="remove_outliers_zscore">Outliers (Z-Score)</option>
                                            <option value="remove_outliers_iqr">Outliers (IQR)</option>
                                            <option value="text_clean">Text Normalization</option>
                                        </optgroup>
                                    </select>
                                </div>

                                <div className="flex items-center gap-4 shrink-0">
                                    <button
                                        onClick={handleApply}
                                        disabled={loading || !selectedId}
                                        className={cn(
                                            "px-8 h-12 rounded-xl font-bold text-sm tracking-wide flex items-center gap-3 transition-all active:scale-95 shadow-lg",
                                            loading || !selectedId
                                                ? "bg-white/5 text-gray-700 cursor-not-allowed border border-white/5"
                                                : "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/20"
                                        )}
                                    >
                                        {loading ? <RefreshCw size={16} className="animate-spin" /> : <><Play size={16} /> Execute Transform</>}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Dynamics Area - Fills remaining height */}
                        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar bg-black/20">
                            <CleaningControls
                                operation={operation}
                                columns={preview?.columns || []}
                                onParamsChange={setParams}
                            />
                        </div>
                    </div>

                </div>

                {/* Right: Stream Analysis - Flexible */}
                <div className="flex-1 glass-panel p-6 rounded-2xl border-white/5 flex flex-col overflow-hidden h-full shadow-lg">
                    <div className="flex items-center justify-between mb-4 shrink-0 px-1">
                        <div className="flex items-center gap-2">
                            <Layers size={14} className="text-purple-500" />
                            <h2 className="text-sm font-semibold text-gray-400 tracking-wide leading-none">Stream Analysis</h2>
                        </div>
                        {preview && (
                            <span className="text-xs font-semibold text-gray-500 bg-white/5 px-2 py-1 rounded border border-white/5">
                                {preview.columns.length} Features • {preview.total_rows} Records
                            </span>
                        )}
                    </div>

                    <div className="flex-1 min-h-0 bg-black/40 rounded-xl border border-white/5 overflow-hidden flex flex-col">
                        {preview ? (
                            <DataGrid
                                columns={preview.columns}
                                data={preview.data}
                                datasetId={selectedId || undefined}
                            />
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

    );
}
