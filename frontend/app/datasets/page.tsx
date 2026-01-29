"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Dataset } from "@/lib/types";
import FileUpload from "@/components/forms/FileUpload";
import DataGrid from "@/components/DataGrid";
import { Trash2, Database, FileText, BarChart3, Clock, ArrowRight, Loader2 } from "lucide-react";

export default function DatasetsPage() {
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [loading, setLoading] = useState(true);

    // Inspection State
    const [inspectingId, setInspectingId] = useState<number | null>(null);
    const [previewData, setPreviewData] = useState<{ columns: string[], data: any[] } | null>(null);
    const [isFetchingPreview, setIsFetchingPreview] = useState(false);

    // Resizable State
    const [size, setSize] = useState({ width: 1200, height: 800 });
    const [isResizing, setIsResizing] = useState(false);

    const handleResizeStart = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = size.width;
        const startHeight = size.height;

        const onMouseMove = (moveEvent: MouseEvent) => {
            const newWidth = Math.max(600, Math.min(window.innerWidth - 100, startWidth + (moveEvent.clientX - startX)));
            const newHeight = Math.max(400, Math.min(window.innerHeight - 100, startHeight + (moveEvent.clientY - startY)));
            setSize({ width: newWidth, height: newHeight });
        };

        const onMouseUp = () => {
            setIsResizing(false);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    };

    const fetchDatasets = async () => {
        try {
            const res = await api.get("/datasets/");
            setDatasets(res.data);
        } catch (error) {
            console.error("Failed to fetch datasets", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInspect = async (id: number) => {
        setInspectingId(id);
        setIsFetchingPreview(true);
        try {
            const res = await api.get(`/datasets/${id}/preview`);
            setPreviewData(res.data);
        } catch (error) {
            console.error("Failed to fetch preview", error);
            alert("Could not load preview");
            setInspectingId(null);
        } finally {
            setIsFetchingPreview(false);
        }
    };

    const deleteDataset = async (id: number) => {
        if (!confirm("Are you sure you want to delete this dataset?")) return;
        try {
            await api.delete(`/datasets/${id}`);
            fetchDatasets();
        } catch (error) {
            alert("Failed to delete dataset");
        }
    };

    useEffect(() => {
        fetchDatasets();
    }, []);

    return (
        <div className="max-w-6xl mx-auto space-y-10 relative">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-white flex items-center gap-3 italic">
                        <Database className="text-blue-500" /> DATASET <span className="text-blue-500">MANAGER</span>
                    </h1>
                    <p className="text-gray-400 mt-1">Upload, manage and inspect your data sources.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Upload Panel */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="glass-panel p-6 rounded-2xl border-white/5">
                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            Ingest Data
                        </h2>
                        <FileUpload onUploadSuccess={fetchDatasets} />
                        <div className="mt-6 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                            <p className="text-xs text-blue-300 leading-relaxed">
                                <strong>Pro Tip:</strong> Ensure your headers are clean and data types are consistent for the best results during training.
                            </p>
                        </div>
                    </div>
                </div>

                {/* List Panel */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-lg font-bold text-white">Your Repository</h2>
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{datasets.length} Objects</span>
                    </div>

                    {loading ? (
                        <div className="glass-panel p-20 rounded-2xl border-white/5 flex flex-col items-center justify-center text-gray-500 italic">
                            <Clock className="animate-spin mb-4 text-blue-500" />
                            Loading your repository...
                        </div>
                    ) : datasets.length === 0 ? (
                        <div className="glass-panel p-20 rounded-2xl border-white/5 flex flex-col items-center justify-center text-gray-500 border-dashed">
                            <FileText size={48} className="mb-4 opacity-20" />
                            <p>No datasets found. Start by uploading a file.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {datasets.map((ds) => (
                                <div key={ds.id} className="glass-card p-5 rounded-2xl border-white/5 flex flex-col md:flex-row justify-between items-center group">
                                    <div className="flex items-center gap-5 w-full md:w-auto">
                                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
                                            <FileText className="text-blue-400" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors truncate max-w-[200px] md:max-w-xs">{ds.filename}</h3>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                                                    <BarChart3 size={10} /> {ds.row_count} rows
                                                </span>
                                                <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                                                <span className="text-[10px] font-bold text-gray-500 uppercase">{(ds.size_bytes / 1024).toFixed(1)} KB</span>
                                                <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                                                <span className="px-1.5 py-0.5 rounded bg-white/5 text-[9px] font-black text-gray-400 border border-white/5 uppercase">
                                                    {ds.source_type}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 mt-4 md:mt-0 w-full md:w-auto justify-end">
                                        <button
                                            onClick={() => deleteDataset(ds.id)}
                                            className="p-2.5 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                                            title="Delete Dataset"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                        <div className="w-px h-6 bg-white/5 mx-2 hidden md:block"></div>
                                        <button
                                            onClick={() => handleInspect(ds.id)}
                                            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl font-bold text-sm transition-all border border-white/5 active:scale-95"
                                        >
                                            Inspect <ArrowRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Inspector Overlay */}
            {inspectingId && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        onClick={() => setInspectingId(null)}
                    ></div>
                    <div
                        className="relative glass-panel rounded-3xl border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300 pointer-events-auto"
                        style={{
                            width: `${size.width}px`,
                            height: `${size.height}px`,
                            minWidth: '600px',
                            minHeight: '400px',
                            maxWidth: '95vw',
                            maxHeight: '90vh'
                        }}
                    >
                        <div className="flex-1 p-8 flex flex-col overflow-hidden">
                            {isFetchingPreview ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-emerald-400">
                                    <Loader2 size={48} className="animate-spin mb-4" />
                                    <p className="text-xs font-black uppercase tracking-[0.3em]">Synching Data Stream...</p>
                                </div>
                            ) : previewData ? (
                                <DataGrid
                                    columns={previewData.columns}
                                    data={previewData.data}
                                    datasetId={inspectingId}
                                    onClose={() => setInspectingId(null)}
                                />
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-gray-500 uppercase font-black tracking-widest">
                                    Failed to load preview
                                </div>
                            )}
                        </div>

                        {/* Resize Handle */}
                        <div
                            className="absolute bottom-0 right-0 w-8 h-8 cursor-nwse-resize flex items-end justify-end p-1 group z-[70]"
                            onMouseDown={handleResizeStart}
                        >
                            <div className="w-4 h-4 border-r-2 border-b-2 border-emerald-500/30 group-hover:border-emerald-500 transition-colors rounded-br"></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

