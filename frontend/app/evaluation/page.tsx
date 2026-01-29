"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { TrainingRun } from "@/lib/types";
import { BarChart, TrendingUp, Grid } from "lucide-react";

export default function EvaluationPage() {
    const [runs, setRuns] = useState<TrainingRun[]>([]);
    const [selectedRun, setSelectedRun] = useState<TrainingRun | null>(null);

    useEffect(() => {
        api.get("/training/runs").then(res => setRuns(res.data));
    }, []);

    // Helper to render Confusion Matrix
    const renderConfusionMatrix = (report: any) => {
        if (!report || !report.confusion_matrix) return null;
        const matrix = report.confusion_matrix;
        const classes = report.classes || [];

        return (
            <div className="mt-4">
                <h3 className="font-bold mb-2">Confusion Matrix</h3>
                <div className="overflow-x-auto">
                    <table className="text-center border-collapse">
                        <thead>
                            <tr>
                                <th className="p-2 border border-gray-600 bg-gray-900">Act \ Pred</th>
                                {classes.map((c: string) => <th key={c} className="p-2 border border-gray-600 bg-gray-900">{c}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {matrix.map((row: number[], i: number) => (
                                <tr key={i}>
                                    <td className="p-2 border border-gray-600 bg-gray-900 font-bold">{classes[i]}</td>
                                    {row.map((val, j) => (
                                        <td key={j} className={`p-2 border border-gray-600 ${i === j ? 'bg-green-900/50' : ''}`}>
                                            {val}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    // Helper for Regression Plots (Actual vs Predicted)
    const renderRegressionAnalysis = (report: any) => {
        if (!report || !report.actual) return null;
        return (
            <div className="mt-4">
                <h3 className="font-bold mb-2">Actual vs Predicted (Sample)</h3>
                <div className="bg-gray-900 p-4 rounded border border-gray-700 font-mono text-sm max-h-60 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4 border-b border-gray-600 pb-2 mb-2 font-bold text-gray-400">
                        <span>Actual</span>
                        <span>Predicted</span>
                    </div>
                    {report.actual.map((act: number, i: number) => (
                        <div key={i} className="grid grid-cols-2 gap-4 py-1 hover:bg-gray-800">
                            <span>{act.toFixed(2)}</span>
                            <span className={Math.abs(act - report.predicted[i]) > (act * 0.1) ? "text-red-400" : "text-green-400"}>
                                {report.predicted[i].toFixed(2)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <main className="min-h-screen bg-slate-900 text-white p-8 flex gap-6">
            {/* Sidebar List */}
            <div className="w-1/3 bg-gray-800 p-4 rounded-xl border border-gray-700 h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <BarChart className="text-yellow-500"/> Completed Models
                </h2>
                <div className="space-y-2">
                    {runs.filter(r => r.status === 'completed').map(run => (
                        <div 
                            key={run.id}
                            onClick={() => setSelectedRun(run)}
                            className={`p-4 rounded-lg cursor-pointer border border-transparent transition-all ${selectedRun?.id === run.id ? 'bg-blue-900/40 border-blue-500' : 'bg-gray-700 hover:bg-gray-600'}`}
                        >
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold">{run.model_name}</h3>
                                <span className="text-xs bg-gray-900 px-2 py-1 rounded">#{run.id}</span>
                            </div>
                            <div className="flex gap-2 mt-2 text-xs text-gray-300">
                                {run.metrics && Object.entries(run.metrics).map(([k, v]) => (
                                    <span key={k}>{k}: {typeof v === 'number' ? v.toFixed(3) : v}</span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-gray-800 p-8 rounded-xl border border-gray-700 overflow-y-auto h-[90vh]">
                {selectedRun ? (
                    <div>
                        <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
                            <TrendingUp className="text-green-500"/> Performance Report
                        </h1>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div className="bg-gray-900 p-6 rounded-lg border border-gray-600">
                                <h3 className="text-gray-400 text-sm uppercase mb-2">Primary Metrics</h3>
                                {selectedRun.metrics && Object.entries(selectedRun.metrics).map(([k, v]) => (
                                    <div key={k} className="flex justify-between border-b border-gray-700 py-2 last:border-0">
                                        <span className="capitalize">{k.replace('_', ' ')}</span>
                                        <span className="font-mono font-bold text-xl">{typeof v === 'number' ? v.toFixed(4) : v}</span>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="bg-gray-900 p-6 rounded-lg border border-gray-600">
                                <h3 className="text-gray-400 text-sm uppercase mb-2">Run Details</h3>
                                <p className="py-1"><span className="text-gray-500">Target:</span> {selectedRun.target_column || "N/A"}</p>
                                <p className="py-1"><span className="text-gray-500">Date:</span> {new Date(selectedRun.created_at).toLocaleString()}</p>
                            </div>
                        </div>

                        {/* Detailed Reports */}
                        <div className="bg-gray-900 p-6 rounded-lg border border-gray-600">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Grid size={20}/> Deep Analysis
                            </h3>
                            {/* @ts-ignore - detailed_report exists in backend but needs typing */}
                            {selectedRun.detailed_report?.type === 'classification' 
                                // @ts-ignore
                                ? renderConfusionMatrix(selectedRun.detailed_report) 
                                // @ts-ignore
                                : renderRegressionAnalysis(selectedRun.detailed_report)
                            }
                            {/* @ts-ignore */}
                            {!selectedRun.detailed_report && <p className="text-gray-500 italic">No detailed report available (Re-train model to generate).</p>}
                        </div>

                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500">
                        <BarChart size={64} className="mb-4 opacity-50"/>
                        <p className="text-xl">Select a model to view evaluation metrics</p>
                    </div>
                )}
            </div>
        </main>
    );
}