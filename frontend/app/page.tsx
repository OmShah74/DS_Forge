"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { checkHealth } from "@/lib/api";
import {
  Database, Eraser, BrainCircuit, Activity, Rocket,
  FlaskConical, CheckCircle2, AlertCircle, Loader2, ArrowRight
} from "lucide-react";

const phases = [
  {
    title: "Datasets",
    desc: "Ingest and manage raw data files",
    href: "/datasets",
    icon: Database,
    color: "from-blue-600 to-blue-400"
  },
  {
    title: "Cleaning",
    desc: "Pre-processing and quality control",
    href: "/cleaning",
    icon: Eraser,
    color: "from-purple-600 to-purple-400"
  },
  {
    title: "Feature Eng",
    desc: "Generate and selection features",
    href: "/features",
    icon: FlaskConical,
    color: "from-cyan-600 to-cyan-400"
  },
  {
    title: "Training",
    desc: "Model architecture and training",
    href: "/training",
    icon: BrainCircuit,
    color: "from-emerald-600 to-emerald-400"
  },
  {
    title: "Evaluation",
    desc: "Performance metrics and analysis",
    href: "/evaluation",
    icon: Activity,
    color: "from-amber-600 to-amber-400"
  },
  {
    title: "Deployment",
    desc: "Production inference and API",
    href: "/deployment",
    icon: Rocket,
    color: "from-rose-600 to-rose-400"
  },
];

export default function Home() {
  const [status, setStatus] = useState<string>("checking");

  useEffect(() => {
    checkHealth()
      .then((data) => setStatus(data.status === "ok" ? "online" : "error"))
      .catch(() => setStatus("error"));
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-blue-500 uppercase tracking-[0.3em]">Command Center</h2>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white italic">
            DS-FORGE <span className="text-blue-500">SYSTEM</span>
          </h1>
          <p className="text-gray-400 max-w-lg">
            Your end-to-end environment for professional data science workflows.
            Everything from ingestion to production deployment in one place.
          </p>
        </div>

        <div className="glass-panel px-6 py-4 rounded-2xl flex items-center gap-6 border-white/5">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">System Health</span>
            <div className="flex items-center gap-2 mt-1">
              {status === "online" ? (
                <>
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  <span className="text-emerald-400 font-bold text-sm">BACKEND CONNECTED</span>
                </>
              ) : status === "error" ? (
                <>
                  <AlertCircle size={16} className="text-rose-500" />
                  <span className="text-rose-400 font-bold text-sm">CONNECTION ERROR</span>
                </>
              ) : (
                <>
                  <Loader2 size={16} className="text-blue-500 animate-spin" />
                  <span className="text-blue-400 font-bold text-sm">PINGING CORE...</span>
                </>
              )}
            </div>
          </div>
          <div className="w-px h-8 bg-white/10"></div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Environment</span>
            <span className="text-white font-bold text-sm mt-1 uppercase">CPU-INF-01</span>
          </div>
        </div>
      </header>

      {/* Pipeline Visualization */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-bold text-white">Pipeline Overview</h3>
          <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {phases.map((phase, i) => (
            <Link key={phase.title} href={phase.href}>
              <div className="glass-card p-6 rounded-2xl group relative overflow-hidden">
                {/* Phase Number */}
                <span className="absolute top-4 right-4 text-4xl font-black text-white/5 group-hover:text-white/10 transition-colors">
                  {i + 1}
                </span>

                <div className={`p-3 rounded-xl bg-gradient-to-br ${phase.color} w-fit shadow-lg shadow-black/20 group-hover:scale-110 transition-transform duration-500`}>
                  <phase.icon size={24} className="text-white" />
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <h4 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{phase.title}</h4>
                  <ArrowRight size={18} className="text-gray-600 group-hover:text-white transition-all transform translate-x-[-10px] opacity-0 group-hover:translate-x-0 group-hover:opacity-100" />
                </div>
                <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                  {phase.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick Start Card */}
      <footer className="glass-panel p-8 rounded-3xl border-blue-500/20 bg-blue-600/5 overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 mt-[-50px]"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-white">Ready to begin your analysis?</h3>
            <p className="text-gray-400 max-w-md">
              Start by uploading your first dataset in the Dataset Manager.
              We support CSV, JSON, and XLSX formats.
            </p>
          </div>
          <Link href="/datasets">
            <button className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 transform hover:-translate-y-1">
              Upload Dataset <ArrowRight size={20} />
            </button>
          </Link>
        </div>
      </footer>
    </div>
  );
}