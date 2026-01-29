"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { TrainingRun } from "@/lib/types";
import { Rocket, Code, Play } from "lucide-react";

export default function DeploymentPage() {
    const [runs, setRuns] = useState<TrainingRun[]>([]);
    const [selectedRunId, setSelectedRunId] = useState<string>("");
    const [inputJson, setInputJson] = useState<string>("[\n  {\n    \"feature1\": 0.5,\n    \"feature2\": 1.0\n  }\n]");
    const [response, setResponse] = useState<any>(null);

    useEffect(() => {
        api.get("/training/runs").then(res => setRuns(res.data.filter((r: any) => r.status === 'completed')));
    }, []);

    const handlePredict = async () => {
        try {
            const payload = JSON.parse(inputJson);
            const res = await api.post(`/deployment/${selectedRunId}/predict`, payload);
            setResponse(res.data);
        } catch (error: any) {
            setResponse({ error: error.response?.data?.detail || "Invalid JSON or Server Error" });
        }
    };

    return (
        <main className="min-h-screen bg-slate-900 text-white p-8">
            <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
                <Rocket className="text-red-500" /> Deployment Center
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* LEFT: Test Interface */}
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h2 className="text-xl font-semibold mb-6">Test Live Inference</h2>
                    
                    <div className="mb-4">
                        <label className="block text-sm text-gray-400 mb-2">Select Active Model</label>
                        <select 
                            className="w-full bg-gray-900 border border-gray-600 rounded p-3"
                            value={selectedRunId}
                            onChange={(e) => setSelectedRunId(e.target.value)}
                        >
                            <option value="">-- Select Model --</option>
                            {runs.map(r => (
                                <option key={r.id} value={r.id}>{r.model_name} (#{r.id})</option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm text-gray-400 mb-2">Input JSON (Array of Objects)</label>
                        <textarea 
                            className="w-full h-48 bg-gray-900 border border-gray-600 rounded p-3 font-mono text-sm"
                            value={inputJson}
                            onChange={(e) => setInputJson(e.target.value)}
                        />
                    </div>

                    <button 
                        onClick={handlePredict}
                        disabled={!selectedRunId}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50"
                    >
                        <Play size={18} /> Send Prediction Request
                    </button>

                    {response && (
                        <div className="mt-6 bg-black p-4 rounded-lg border border-gray-700">
                            <pre className="text-green-400 font-mono text-sm overflow-x-auto">
                                {JSON.stringify(response, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>

                {/* RIGHT: API Documentation */}
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <Code className="text-yellow-500" /> API Integration
                    </h2>
                    
                    <p className="text-gray-400 mb-4">
                        Use this CURL command to integrate the model into your application.
                    </p>

                    <div className="bg-black p-4 rounded-lg border border-gray-700 mb-6 group relative">
                        <pre className="text-gray-300 font-mono text-sm overflow-x-auto whitespace-pre-wrap">
{`curl -X 'POST' \\
  'http://localhost:8000/api/v1/deployment/${selectedRunId || "{ID}"}/predict' \\
  -H 'Content-Type: application/json' \\
  -d '[
  {
    "feature1": "value",
    "feature2": "value"
  }
]'`}
                        </pre>
                    </div>

                    <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-500/30">
                        <h3 className="font-bold text-blue-400 mb-2">Production Note</h3>
                        <p className="text-sm text-gray-300">
                            This API runs locally. To deploy to production, push this Docker container to Railway/AWS and use the public URL.
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}