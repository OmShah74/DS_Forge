"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Dataset } from "@/lib/types";
import FileUpload from "@/components/forms/FileUpload";
import { Trash2, Database, FileText } from "lucide-react";

export default function DatasetsPage() {
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [loading, setLoading] = useState(true);

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

    const deleteDataset = async (id: number) => {
        if(!confirm("Are you sure you want to delete this dataset?")) return;
        try {
            await api.delete(`/datasets/${id}`);
            fetchDatasets(); // Refresh list
        } catch (error) {
            alert("Failed to delete dataset");
        }
    };

    useEffect(() => {
        fetchDatasets();
    }, []);

    return (
        <main className="min-h-screen p-8 bg-slate-900 text-white">
            <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Database className="text-blue-500" /> Dataset Manager
                    </h1>
                </div>

                {/* Upload Section */}
                <div className="mb-12 bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h2 className="text-xl font-semibold mb-4">Ingest New Data</h2>
                    <FileUpload onUploadSuccess={fetchDatasets} />
                </div>

                {/* List Section */}
                <h2 className="text-xl font-semibold mb-4">Your Datasets</h2>
                {loading ? (
                    <p className="text-gray-400">Loading...</p>
                ) : datasets.length === 0 ? (
                    <p className="text-gray-500 italic">No datasets found. Upload one above.</p>
                ) : (
                    <div className="grid gap-4">
                        {datasets.map((ds) => (
                            <div key={ds.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex justify-between items-center hover:border-blue-500 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="bg-blue-900/50 p-3 rounded-md">
                                        <FileText className="text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">{ds.filename}</h3>
                                        <p className="text-sm text-gray-400">
                                            {ds.row_count} rows • {ds.column_count} cols • {(ds.size_bytes / 1024).toFixed(2)} KB
                                        </p>
                                        <p className="text-xs text-gray-500 uppercase mt-1 badge bg-gray-900 px-2 py-1 rounded inline-block">
                                            {ds.source_type}
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => deleteDataset(ds.id)}
                                    className="p-2 text-red-400 hover:bg-red-900/20 rounded-full transition-colors"
                                    title="Delete Dataset"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}