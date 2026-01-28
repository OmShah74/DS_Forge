"use client";
import { useEffect, useState } from "react";
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
      <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text">
        DS-Forge
      </h1>
      <p className="text-xl text-gray-400 mb-8">
        Self-Contained Data Science Operating System (CPU-Only)
      </p>
      
      <div className="p-6 border border-gray-700 rounded-lg bg-gray-800 shadow-xl">
        <h2 className="text-2xl font-semibold mb-4 text-gray-200">System Status</h2>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${status === 'Backend unreachable' ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`}></div>
          <span className="text-gray-300 font-mono">
            {status}
          </span>
        </div>
      </div>
    </main>
  );
}