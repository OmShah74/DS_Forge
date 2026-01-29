"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Dataset } from "@/lib/types";
import DataGrid from "@/components/DataGrid";
import { FlaskConical, Play, Sparkles } from "lucide-react";

export default function FeatureEngineeringPage() {
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
            alert("Success!");
            loadDatasets(); // Refresh list to see new FE dataset
        } catch (error: any) {
            alert(error.response?.data?.detail || "Operation failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="p-6 h-screen flex gap-6 overflow-hidden">
            
            {/* LEFT: Controls */}
            <div className="w-1/4 flex flex-col gap-6">
                
                {/* Dataset Selector */}
                <div className="glass-panel p-5 rounded-xl">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-cyan-400">
                        <FlaskConical size={20}/> 1. Select Data
                    </h2>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                        {datasets.map(ds => (
                            <div 
                                key={ds.id}
                                onClick={() => setSelectedId(ds.id)}
                                className={`p-3 rounded-lg cursor-pointer text-sm transition-all border ${selectedId === ds.id ? 'bg-cyan-500/20 border-cyan-500 text-white' : 'bg-slate-800/50 border-transparent hover:bg-slate-700 text-gray-400'}`}
                            >
                                <p className="font-semibold truncate">{ds.filename}</p>
                                <p className="text-xs opacity-60">{ds.source_type} • {ds.row_count} rows</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Operation Config */}
                <div className="glass-panel p-5 rounded-xl flex-1 flex flex-col">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-purple-400">
                        <Sparkles size={20}/> 2. Transformation
                    </h2>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-400 uppercase font-bold">Technique</label>
                            <select 
                                className="w-full mt-2 bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm focus:border-cyan-500 outline-none"
                                value={operation}
                                onChange={(e) => setOperation(e.target.value)}
                            >
                                <optgroup label="Scaling">
                                    <option value="standard_scaler">Standard Scaler (Z-Score)</option>
                                    <option value="minmax_scaler">MinMax Scaler (0-1)</option>
                                </optgroup>
                                <optgroup label="Encoding">
                                    <option value="label_encoding">Label Encoding</option>
                                    <option value="one_hot_encoding">One-Hot Encoding</option>
                                </optgroup>
                                <optgroup label="Dimensionality">
                                    <option value="pca">PCA (Principal Component Analysis)</option>
                                </optgroup>
                            </select>
                        </div>

                        <div>
                            <label className="text-xs text-gray-400 uppercase font-bold">Parameters (JSON)</label>
                            <textarea 
                                className="w-full mt-2 h-32 bg-slate-900 border border-slate-700 rounded-lg p-3 font-mono text-xs focus:border-cyan-500 outline-none resize-none"
                                value={params}
                                onChange={(e) => setParams(e.target.value)}
                                placeholder='{ "columns": ["age", "salary"] }'
                            />
                            <p className="text-[10px] text-gray-500 mt-2">
                                Tip: Leave empty to apply to all applicable columns.
                            </p>
                        </div>

                        <button 
                            onClick={handleApply}
                            disabled={loading || !selectedId}
                            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white p-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-all shadow-lg shadow-cyan-900/20"
                        >
                            {loading ? "Processing..." : <><Play size={18} /> Apply Transformation</>}
                        </button>
                    </div>
                </div>
            </div>

            {/* RIGHT: Data Grid */}
            <div className="flex-1 glass-panel p-1 rounded-xl overflow-hidden flex flex-col">
                {preview ? (
                    <DataGrid 
                        columns={preview.columns} 
                        data={preview.data} 
                        datasetId={selectedId!}
                    />
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-600">
                        <FlaskConical size={64} className="mb-4 opacity-20"/>
                        <p>Select a dataset to begin feature engineering</p>
                    </div>
                )}
            </div>
        </main>
    );
}