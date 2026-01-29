"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { checkHealth } from "@/lib/api";

export default function Home() {
  const [status, setStatus] = useState<string>("Checking connection...");

  useEffect(() => {
    checkHealth().then((data) => {
      setStatus(data.message);
    });
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-slate-900 text-white">
      {/* Header */}
      <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text">
        DS-Forge
      </h1>
      <p className="text-xl text-gray-400 mb-8">
        Self-Contained Data Science Operating System (CPU-Only)
      </p>
      
      {/* Status */}
      <div className="p-6 border border-gray-700 rounded-lg bg-gray-800 shadow-xl mb-12 min-w-[300px] text-center">
        <h2 className="text-2xl font-semibold mb-4 text-gray-200">System Status</h2>
        <div className="flex items-center justify-center gap-3">
          <div className={`w-3 h-3 rounded-full ${status === 'Backend unreachable' ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`}></div>
          <span className="text-gray-300 font-mono">{status}</span>
        </div>
      </div>

      {/* Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
        
        <Link href="/datasets">
          <button className="w-full bg-blue-600 hover:bg-blue-500 text-white p-6 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-blue-500/20 flex flex-col items-center gap-2">
            <span>📂 1. Manage Datasets</span>
            <span className="text-xs text-blue-200 font-normal">Upload & Ingest</span>
          </button>
        </Link>

        <Link href="/cleaning">
          <button className="w-full bg-purple-600 hover:bg-purple-500 text-white p-6 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-purple-500/20 flex flex-col items-center gap-2">
            <span>🧹 2. Data Cleaning</span>
            <span className="text-xs text-purple-200 font-normal">Pre-processing Engine</span>
          </button>
        </Link>

        <Link href="/training">
          <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white p-6 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-emerald-500/20 flex flex-col items-center gap-2">
            <span>🧠 3. Train Models</span>
            <span className="text-xs text-emerald-200 font-normal">AutoML & Experiments</span>
          </button>
        </Link>

        {/* Phase 5 & 6 */}
        <Link href="/evaluation">
          <button className="w-full bg-yellow-600 hover:bg-yellow-500 text-white p-6 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-yellow-500/20 flex flex-col items-center gap-2">
            <span>📊 4. Evaluation</span>
            <span className="text-xs text-yellow-200 font-normal">Metrics & Analysis</span>
          </button>
        </Link>

        <Link href="/deployment">
          <button className="w-full bg-red-600 hover:bg-red-500 text-white p-6 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-red-500/20 flex flex-col items-center gap-2">
            <span>🚀 5. Deployment</span>
            <span className="text-xs text-red-200 font-normal">Inference API</span>
          </button>
        </Link>

      </div>
    </main>
  );
}