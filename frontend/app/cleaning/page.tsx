"use client";
import { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";
import { Dataset } from "@/lib/types";
import { Play, RefreshCw, Table as TableIcon, Database, Layers, CheckCircle2, AlertCircle, HelpCircle, ChevronDown, Zap, Search, Star } from "lucide-react";
import DataGrid from "@/components/DataGrid";
import CleaningControls from "@/components/CleaningControls";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

import { useNotificationStore } from "@/store/notificationStore";

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

const CLEANING_OPS = [
    { value: "drop_missing_rows", label: "Drop Missing Rows", description: "Remove entire rows containing any missing values.", category: "Missing Data" },
    { value: "drop_missing_cols", label: "Drop Missing Columns", description: "Remove columns containing any missing values.", category: "Missing Data" },
    { value: "fill_missing_mean", label: "Fill Missing (Mean)", description: "Replace missing numeric values with the column mean.", category: "Missing Data" },
    { value: "fill_missing_median", label: "Fill Missing (Median)", description: "Replace missing numeric values with the column median.", category: "Missing Data" },
    { value: "fill_missing_mode", label: "Fill Missing (Mode)", description: "Replace missing values with the most frequent value.", category: "Missing Data" },
    { value: "fill_missing_constant", label: "Fill Missing (Constant)", description: "Replace missing values with a specific constant.", category: "Missing Data" },
    { value: "fill_missing_ffill", label: "Forward Fill", description: "Propagate the last valid observation forward.", category: "Missing Data" },
    { value: "fill_missing_bfill", label: "Backward Fill", description: "Use the next valid observation to fill gaps.", category: "Missing Data" },

    { value: "drop_duplicates", label: "Remove Duplicates", description: "Remove duplicate rows from the dataset.", category: "Quality Control" },
    { value: "drop_columns", label: "Drop Columns", description: "Remove specific columns from the dataset.", category: "Column Ops" },
    { value: "rename_columns", label: "Rename Columns", description: "Rename specific columns.", category: "Column Ops" },

    { value: "convert_to_int", label: "Convert to Integer", description: "Cast columns to integer type.", category: "Type Conversion" },
    { value: "convert_to_float", label: "Convert to Float", description: "Cast columns to float type.", category: "Type Conversion" },
    { value: "convert_to_datetime", label: "Convert to Datetime", description: "parse columns as dates.", category: "Type Conversion" },
    { value: "convert_to_string", label: "Convert to String", description: "Cast columns to string type.", category: "Type Conversion" },
    { value: "convert_to_category", label: "Convert to Category", description: "Optimize memory for categorical data.", category: "Type Conversion" },

    { value: "remove_outliers_zscore", label: "Outliers (Z-Score)", description: "Remove rows with values > 3 std devs from mean.", category: "Outliers" },
    { value: "remove_outliers_iqr", label: "Outliers (IQR)", description: "Remove rows outside 1.5 * IQR range.", category: "Outliers" },
    { value: "cap_outliers_winsorize", label: "Winsorize", description: "Cap extreme values at specific percentiles.", category: "Outliers" },

    { value: "text_lowercase", label: "Text: Lowercase", description: "Convert text to lowercase.", category: "Text Cleaning" },
    { value: "text_uppercase", label: "Text: Uppercase", description: "Convert text to uppercase.", category: "Text Cleaning" },
    { value: "text_trim", label: "Text: Trim Whitespace", description: "Remove leading/trailing whitespace.", category: "Text Cleaning" },
    { value: "text_titlecase", label: "Text: Title Case", description: "Capitalize first letter of each word.", category: "Text Cleaning" },

    { value: "find_replace_value", label: "Find & Replace", description: "Replace specific values globally.", category: "Ad-hoc" },
    { value: "regex_replace", label: "Regex Replace", description: "Replace text using Regular Expressions.", category: "Ad-hoc" },
    { value: "sort_values", label: "Sort Values", description: "Sort dataset by specific column(s).", category: "Structure" },
    { value: "shuffle_data", label: "Shuffle Data", description: "Randomly shuffle rows in the dataset.", category: "Structure" },
    { value: "sample_data", label: "Sample Data", description: "Randomly sample a fraction of rows.", category: "Structure" },
];

export default function CleaningPage() {
    const { addToast, notifySystem } = useNotificationStore();
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [preview, setPreview] = useState<PreviewData | null>(null);

    // Operation State
    const [operation, setOperation] = useState("drop_missing_rows");
    const [params, setParams] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [auditLog, setAuditLog] = useState<OperationAudit[]>([]);

    // Recommendations
    const [recommendations, setRecommendations] = useState<string[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Tooltip State
    const [hoveredOp, setHoveredOp] = useState<string | null>(null);

    useEffect(() => {
        api.get("/datasets/").then((res) => setDatasets(res.data));
    }, []);

    useEffect(() => {
        if (selectedId) {
            loadPreview(selectedId);
            loadRecommendations(selectedId);
            setParams({}); // Reset params when dataset changes
        }
    }, [selectedId]);

    const [previewLimit, setPreviewLimit] = useState(50);

    const loadPreview = async (id: number) => {
        try {
            const res = await api.get(`/cleaning/preview/${id}?limit=${previewLimit}`);
            setPreview(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    const loadRecommendations = async (id: number) => {
        try {
            const res = await api.get(`/cleaning/recommend/${id}`);
            setRecommendations(res.data.recommendations || []);
        } catch (error) {
            console.error(error);
            setRecommendations([]);
        }
    };

    // Reload preview when limit changes
    useEffect(() => {
        if (selectedId) loadPreview(selectedId);
    }, [previewLimit]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // --- Manual Edit State ---
    const [pendingEdits, setPendingEdits] = useState<Record<string, any>>({});

    const handleCellEdit = (rowIndex: number, column: string, value: any) => {
        setPendingEdits(prev => ({
            ...prev,
            [`${rowIndex}-${column}`]: value
        }));
    };

    const handleDiscardEdits = () => {
        setPendingEdits({});
        addToast("Edits Discarded", "info");
    };

    const handleSaveEdits = async () => {
        if (!selectedId || Object.keys(pendingEdits).length === 0) return;
        setLoading(true);

        const updates = Object.entries(pendingEdits).map(([key, value]) => {
            const [rowStr, col] = key.split(/-(.+)/);
            return {
                index: parseInt(rowStr),
                column: col,
                value: value
            };
        });

        try {
            const response = await api.post("/cleaning/apply", {
                dataset_id: selectedId,
                operation: "manual_update",
                params: { updates }
            });

            addToast("Batch Update Successful", "success");
            notifySystem("Manual Edit", `Applied ${updates.length} cell updates.`);

            const audit: OperationAudit = {
                id: Math.random().toString(36).substring(7),
                operation: "manual_edit",
                timestamp: new Date().toLocaleTimeString()
            };
            setAuditLog(prev => [audit, ...prev].slice(0, 5));
            setPendingEdits({});

            const res = await api.get("/datasets/");
            setDatasets(res.data);
            if (response.data.new_dataset_id) {
                setSelectedId(response.data.new_dataset_id);
            }
        } catch (error: any) {
            const msg = error.response?.data?.detail || "Update failed";
            addToast(msg, "error");
        } finally {
            setLoading(false);
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

            const audit: OperationAudit = {
                id: Math.random().toString(36).substring(7),
                operation,
                timestamp: new Date().toLocaleTimeString()
            };
            setAuditLog(prev => [audit, ...prev].slice(0, 5));

            const res = await api.get("/datasets/");
            setDatasets(res.data);
            if (res.data.length > 0) {
                // Optionally switch to new dataset automatically? 
                // Backend returns new_dataset_id in response but we didn't capture it here properly in previous code?
                // Wait, API response in engine is standard.
                // Ideally we should switch.
            }

        } catch (error: any) {
            const msg = error.response?.data?.detail || "Operation failed";
            addToast(msg, "error");
        } finally {
            setLoading(false);
        }
    };

    const isRecommended = (op: string) => recommendations.includes(op);
    const selectedOpDetails = CLEANING_OPS.find(o => o.value === operation);

    // Filter ops for dropdown
    const filteredOps = CLEANING_OPS.filter(op =>
        op.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        op.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const groupedOps = filteredOps.reduce((groups, op) => {
        const category = op.category;
        if (!groups[category]) groups[category] = [];
        groups[category].push(op);
        return groups;
    }, {} as Record<string, typeof CLEANING_OPS>);

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
                        <div className="flex items-center justify-between px-1 mb-4 shrink-0">
                            <div className="flex items-center gap-2">
                                <RefreshCw size={14} className="text-purple-500" />
                                <h2 className="text-sm font-semibold text-gray-400 tracking-wide leading-none">Pipeline History</h2>
                            </div>
                            <div className="flex items-center gap-3">
                                {auditLog.length > 0 && (
                                    <button
                                        onClick={() => setAuditLog([])}
                                        className="text-[10px] font-bold text-rose-500 hover:text-rose-400 uppercase tracking-widest transition-colors"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
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
                    <div className="w-[400px] glass-panel rounded-2xl border-white/5 flex flex-col shrink-0 shadow-lg h-full relative z-20">
                        <div className="p-5 border-b border-white/5 bg-white/[0.01] shrink-0 relative z-50">
                            <div className="flex items-center justify-between gap-6">
                                <div className="space-y-3 flex-1 max-w-sm relative" ref={dropdownRef}>
                                    <label className="text-sm font-semibold text-purple-500 tracking-wide px-1 flex items-center gap-2">
                                        Control Console
                                        {isRecommended(operation) && (
                                            <Star size={12} className="text-yellow-400 fill-yellow-400 ml-auto" />
                                        )}
                                    </label>

                                    {/* Custom Select with Search & Tooltips */}
                                    <button
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        className="w-full bg-[#0F172A] border border-white/20 rounded-xl p-3 text-white text-base focus:ring-2 focus:ring-purple-500/30 outline-none transition-all font-bold shadow-sm flex items-center justify-between"
                                    >
                                        <span className="truncate">{selectedOpDetails?.label || "Select Operation"}</span>
                                        <ChevronDown size={16} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {isDropdownOpen && (
                                        <div className="absolute top-full left-0 w-full mt-2 bg-[#0F172A] border border-white/20 rounded-xl shadow-2xl z-50 max-h-[600px] overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2">
                                            <div className="p-3 border-b border-white/10 flex items-center gap-2 bg-black/20">
                                                <Search size={14} className="text-gray-500" />
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    placeholder="Search cleaning ops..."
                                                    className="bg-transparent text-sm text-white font-medium outline-none w-full placeholder:text-gray-600"
                                                    value={searchQuery}
                                                    onChange={e => setSearchQuery(e.target.value)}
                                                />
                                            </div>
                                            <div className="overflow-y-auto flex-1 p-2 custom-scrollbar">
                                                {Object.entries(groupedOps).map(([cat, ops]) => (
                                                    <div key={cat} className="mb-4">
                                                        <div className="px-2 py-1 text-[10px] uppercase font-black tracking-widest text-gray-500 sticky top-0 bg-[#0F172A] z-10 opacity-90 backdrop-blur-sm">{cat}</div>
                                                        <div className="space-y-1">
                                                            {ops.map(op => (
                                                                <div
                                                                    key={op.value}
                                                                    className={`
                                                                        group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all
                                                                        ${operation === op.value ? 'bg-purple-600 text-white' : 'hover:bg-white/5 text-gray-300'}
                                                                    `}
                                                                    onClick={() => {
                                                                        setOperation(op.value);
                                                                        setIsDropdownOpen(false);
                                                                    }}
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-bold text-sm tracking-tight">{op.label}</span>
                                                                        {isRecommended(op.value) && (
                                                                            <Star size={12} className="text-yellow-400 fill-yellow-400" />
                                                                        )}
                                                                    </div>
                                                                    {/* Tooltip trigger - Question mark */}
                                                                    <div
                                                                        className="relative px-2 py-1"
                                                                        onMouseEnter={() => setHoveredOp(op.value)}
                                                                        onMouseLeave={() => setHoveredOp(null)}
                                                                    >
                                                                        <HelpCircle size={14} className={`opacity-40 group-hover:opacity-100 transition-opacity ${operation === op.value ? 'text-white' : 'text-gray-400'}`} />

                                                                        {/* Tooltip (Inside dropdown context) */}
                                                                        {hoveredOp === op.value && (
                                                                            <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 w-48 p-3 bg-gray-900 border border-white/20 rounded-xl shadow-2xl z-[60] pointer-events-none animate-in fade-in slide-in-from-right-2">
                                                                                <p className="text-[10px] font-medium text-gray-200 leading-relaxed text-center">
                                                                                    {op.description}
                                                                                </p>
                                                                                <div className="absolute top-1/2 -right-1.5 w-3 h-3 bg-gray-900 border-t border-r border-white/20 transform rotate-45 -translate-y-1/2"></div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
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
                <div className="flex-1 glass-panel p-6 rounded-2xl border-white/5 flex flex-col overflow-hidden h-full shadow-lg relative">
                    <div className="flex items-center justify-between mb-4 shrink-0 px-1">
                        <div className="flex items-center gap-2">
                            <Layers size={14} className="text-purple-500" />
                            <h2 className="text-sm font-semibold text-gray-400 tracking-wide leading-none">Stream Analysis</h2>
                        </div>

                        <div className="flex items-center gap-3">
                            <select
                                value={previewLimit}
                                onChange={(e) => setPreviewLimit(Number(e.target.value))}
                                className="bg-black/40 border border-white/10 rounded-lg py-1 px-2 text-[10px] font-bold text-gray-400 outline-none focus:ring-1 focus:ring-purple-500/50"
                            >
                                <option value={50}>Limit: 50 Rows</option>
                                <option value={100}>Limit: 100 Rows</option>
                                <option value={500}>Limit: 500 Rows</option>
                                <option value={100000}>Show All</option>
                            </select>
                            {preview && (
                                <span className="text-xs font-semibold text-gray-500 bg-white/5 px-2 py-1 rounded border border-white/5">
                                    {preview.columns.length} Features • {preview.total_rows} Records
                                </span>
                            )}
                        </div>
                    </div>

                    {Object.keys(pendingEdits).length > 0 && (
                        <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[#0F172A] border border-yellow-500/30 px-3 py-1.5 rounded-xl shadow-2xl z-40 animate-in fade-in slide-in-from-top-4">
                            <span className="text-xs font-bold text-yellow-500">{Object.keys(pendingEdits).length} Pending Changes</span>
                            <div className="h-4 w-px bg-white/10 mx-1"></div>
                            <button
                                onClick={handleDiscardEdits}
                                className="text-xs font-bold text-gray-400 hover:text-white transition-colors"
                            >
                                Discard
                            </button>
                            <button
                                onClick={handleSaveEdits}
                                className="bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold px-3 py-1 rounded-lg transition-colors ml-1"
                            >
                                Save
                            </button>
                        </div>
                    )}

                    <div className="flex-1 min-h-0 bg-black/40 rounded-xl border border-white/5 overflow-hidden flex flex-col">
                        {preview ? (
                            <DataGrid
                                columns={preview.columns}
                                data={preview.data}
                                datasetId={selectedId || undefined}
                                onCellEdit={handleCellEdit}
                                pendingChanges={pendingEdits}
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
