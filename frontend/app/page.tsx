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
      {/* Header Section */}
      <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text">
        DS-Forge
      </h1>
      <p className="text-xl text-gray-400 mb-8">
        Self-Contained Data Science Operating System (CPU-Only)
      </p>
      
      {/* System Status Card */}
      <div className="p-6 border border-gray-700 rounded-lg bg-gray-800 shadow-xl mb-12 min-w-[300px] text-center">
        <h2 className="text-2xl font-semibold mb-4 text-gray-200">System Status</h2>
        <div className="flex items-center justify-center gap-3">
          <div className={`w-3 h-3 rounded-full ${status === 'Backend unreachable' ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`}></div>
          <span className="text-gray-300 font-mono">
            {status}
          </span>
        </div>
      </div>

      {/* Main Navigation Buttons */}
      <div className="flex flex-wrap justify-center gap-6">
        <Link href="/datasets">
          <button className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-blue-500/20 flex flex-col items-center gap-2 min-w-[200px]">
            <span>📂 Manage Datasets</span>
            <span className="text-xs text-blue-200 font-normal">Upload, View & Delete</span>
          </button>
        </Link>

        <Link href="/cleaning">
          <button className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-purple-500/20 flex flex-col items-center gap-2 min-w-[200px]">
            <span>🧹 Data Cleaning</span>
            <span className="text-xs text-purple-200 font-normal">Clean, Filter & Transform</span>
          </button>
        </Link>
      </div>
    </main>
  );
}