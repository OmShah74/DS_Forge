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
    color: "from-purple-900 to-purple-700"
  },
  {
    title: "Cleaning",
    desc: "Pre-processing and quality control",
    href: "/cleaning",
    icon: Eraser,
    color: "from-purple-800 to-purple-600"
  },
  {
    title: "Feature Eng",
    desc: "Generate and selection features",
    href: "/features",
    icon: FlaskConical,
    color: "from-purple-700 to-purple-500"
  },
  {
    title: "Training",
    desc: "Model architecture and training",
    href: "/training",
    icon: BrainCircuit,
    color: "from-purple-600 to-purple-400"
  },
  {
    title: "Evaluation",
    desc: "Performance metrics and analysis",
    href: "/evaluation",
    icon: Activity,
    color: "from-purple-500 to-purple-300"
  },
  {
    title: "Deployment",
    desc: "Production inference and API",
    href: "/deployment",
    icon: Rocket,
    color: "from-purple-400 to-purple-200"
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
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
        <div className="space-y-4">
          <h2 className="text-[10px] font-black text-purple-500 uppercase tracking-[0.4em] leading-none">Command Center Dashboard</h2>
          <h1 className="text-4xl md:text-6xl font-black tracking-[0.02em] text-white italic leading-none">
            DS-FORGE <span className="text-purple-600">SYSTEM</span>
          </h1>
          <p className="text-gray-500 max-w-lg text-xs font-medium leading-relaxed">
            Your end-to-end environment for professional data science workflows.
            Everything from ingestion to production deployment in one unified OS.
          </p>
        </div>

        <div className="glass-panel px-6 py-4 rounded-2xl flex items-center gap-6 border-white/5 bg-black/40">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">System Health</span>
            <div className="flex items-center gap-2 mt-2">
              {status === "online" ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)] animate-pulse"></div>
                  <span className="text-emerald-400 font-black text-[10px] tracking-widest uppercase">CORE ONLINE</span>
                </>
              ) : status === "error" ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]"></div>
                  <span className="text-rose-400 font-black text-[10px] tracking-widest uppercase">CONNECTION ERROR</span>
                </>
              ) : (
                <>
                  <Loader2 size={12} className="text-purple-500 animate-spin" />
                  <span className="text-purple-400 font-black text-[10px] tracking-widest uppercase">SCANNING...</span>
                </>
              )}
            </div>
          </div>
          <div className="w-px h-8 bg-white/5"></div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Latency</span>
            <span className="text-white font-black text-[10px] mt-2 uppercase tracking-widest">12ms • CLOUD</span>
          </div>
        </div>
      </header>

      {/* Pipeline Visualization */}
      <section className="space-y-8">
        <div className="flex items-center gap-4 px-1">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] leading-none">Pipeline Architecture</h3>
          <div className="h-px flex-1 bg-gradient-to-r from-white/5 to-transparent"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {phases.map((phase, i) => (
            <Link key={phase.title} href={phase.href}>
              <div className="glass-card p-8 rounded-3xl group relative overflow-hidden bg-black/20 hover:bg-black/40 border-white/5 hover:border-purple-500/20 transition-all duration-500 shadow-2xl">
                {/* Phase Number */}
                <span className="absolute top-6 right-8 text-5xl font-black text-white/[0.02] group-hover:text-purple-500/10 transition-colors duration-700">
                  {i + 1}
                </span>

                <div className={`p-4 rounded-2xl bg-gradient-to-br ${phase.color} w-fit shadow-2xl shadow-black/40 group-hover:scale-110 transition-transform duration-500`}>
                  <phase.icon size={28} className="text-white" />
                </div>

                <div className="mt-8 flex items-center justify-between">
                  <h4 className="text-lg font-black text-white/90 group-hover:text-purple-400 transition-colors duration-300 uppercase tracking-tight">{phase.title}</h4>
                  <ArrowRight size={20} className="text-gray-800 group-hover:text-purple-500 transition-all transform translate-x-[-10px] opacity-0 group-hover:translate-x-0 group-hover:opacity-100 duration-500" />
                </div>
                <p className="text-[11px] font-medium text-gray-500 mt-3 leading-relaxed tracking-tight group-hover:text-gray-400 transition-colors">
                  {phase.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick Start Card */}
      <footer className="glass-panel p-10 rounded-[2.5rem] border-purple-500/10 bg-purple-600/[0.02] overflow-hidden relative group shadow-2xl">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/[0.03] blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="space-y-4">
            <h3 className="text-3xl font-black text-white leading-tight">Ready to initiate your <br /><span className="text-purple-500">first data mutation?</span></h3>
            <p className="text-gray-500 max-w-md text-xs font-medium leading-relaxed">
              Start by ingesting your raw data artifacts into the system registry.
              Securely supports CSV, JSON, and XLSX protocols.
            </p>
          </div>
          <Link href="/datasets">
            <button className="bg-purple-600 hover:bg-purple-500 text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center gap-4 transition-all shadow-2xl shadow-purple-950/40 hover:shadow-purple-500/20 transform hover:-translate-y-1 active:scale-95 duration-300">
              Initiate Ingestion <ArrowRight size={18} />
            </button>
          </Link>
        </div>
      </footer>
    </div>
  );
}