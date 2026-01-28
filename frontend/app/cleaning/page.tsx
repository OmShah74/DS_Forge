"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Dataset } from "@/lib/types";
import { ArrowRight, Play, RefreshCw, Table as TableIcon } from "lucide-react";

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
    const [params, setParams] = useState("{}"); // JSON string for flexibility
    const [loading, setLoading] = useState(false);

    // Load Datasets
    useEffect(() => {
        api.get("/datasets/").then((res) => setDatasets(res.data));
    }, []);

    // Load Preview when selection changes
    useEffect(() => {
        if (selectedId) {
            loadPreview(selectedId);
        }
    }, [selectedId]);

    const loadPreview = async (id: number) => {
        const res = await api.get(`/cleaning/preview/${id}`);
        setPreview(res.data);
    };

    const handleApply = async () => {
        if (!selectedId) return;
        setLoading(true);
        try {
            let parsedParams = {};
            try {
                parsedParams = JSON.parse(params);
            } catch (e) {
                alert("Invalid JSON parameters");
                setLoading(false);
                return;
            }

            await api.post("/cleaning/apply", {
                dataset_id: selectedId,
                operation: operation,
                params: parsedParams
            });

            alert("Operation successful! New dataset version created.");
            // Reload datasets list
            const res = await api.get("/datasets/");
            setDatasets(res.data);
            
        } catch (error: any) {
            alert(error.response?.data?.detail || "Operation failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-slate-900 text-white p-6 flex gap-6">
            
            {/* LEFT SIDEBAR: Dataset Selection */}
            <div className="w-1/4 bg-gray-800 p-4 rounded-xl border border-gray-700 h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <TableIcon className="text-blue-500"/> Datasets
                </h2>
                <div className="space-y-2">
                    {datasets.map(ds => (
                        <div 
                            key={ds.id}
                            onClick={() => setSelectedId(ds.id)}
                            className={`p-3 rounded-lg cursor-pointer transition-all ${selectedId === ds.id ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                        >
                            <p className="font-semibold truncate">{ds.filename}</p>
                            <p className="text-xs text-gray-300 mt-1">ID: {ds.id} • {ds.row_count} rows</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* CENTER: Preview & Operations */}
            <div className="flex-1 flex flex-col gap-6">
                
                {/* Operation Control Panel */}
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <RefreshCw className="text-green-500"/> Apply Cleaning
                    </h2>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Operation</label>
                            <select 
                                className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white"
                                value={operation}
                                onChange={(e) => setOperation(e.target.value)}
                            >
                                <option value="drop_missing">Drop Missing Rows</option>
                                <option value="fill_missing">Fill Missing Values</option>
                                <option value="drop_duplicates">Drop Duplicates</option>
                                <option value="drop_columns">Drop Columns</option>
                                <option value="rename_columns">Rename Columns</option>
                                <option value="convert_type">Convert Data Type</option>
                                <option value="remove_outliers_zscore">Remove Outliers (Z-Score)</option>
                                <option value="text_clean">Text Cleaning</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Parameters (JSON)</label>
                            <input 
                                type="text" 
                                className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white font-mono"
                                value={params}
                                onChange={(e) => setParams(e.target.value)}
                                placeholder='{"axis": 0}'
                            />
                            <p className="text-xs text-gray-500 mt-1">Ex: {"{ \"axis\": 0 }"} or {"{ \"method\": \"mean\", \"columns\": [\"age\"] }"}</p>
                        </div>
                    </div>

                    <button 
                        onClick={handleApply}
                        disabled={loading || !selectedId}
                        className="mt-4 bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50"
                    >
                        {loading ? "Processing..." : <><Play size={18} /> Run Operation</>}
                    </button>
                </div>

                {/* Data Preview Table */}
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex-1 overflow-auto">
                    <h2 className="text-xl font-bold mb-4">Data Preview</h2>
                    {preview ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr>
                                        {preview.columns.map(col => (
                                            <th key={col} className="bg-gray-900 p-3 border-b border-gray-700 text-gray-300 font-mono text-sm">
                                                {col}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {preview.data.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-gray-700/50">
                                            {preview.columns.map(col => (
                                                <td key={col} className="p-3 border-b border-gray-700 text-gray-400 text-sm">
                                                    {row[col] !== null ? String(row[col]) : <span className="text-red-500 italic">NaN</span>}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <p className="mt-4 text-sm text-gray-500">Showing first 10 rows of {preview.total_rows} total.</p>
                        </div>
                    ) : (
                        <p className="text-gray-500 italic">Select a dataset to preview.</p>
                    )}
                </div>
            </div>
        </main>
    );
}