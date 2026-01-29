"use client";
import React from 'react';
import { Settings, Shield, Bell, Database, Monitor, Cpu, ChevronRight } from 'lucide-react';

export default function SettingsPage() {
    const sections = [
        {
            title: "System Core",
            icon: Cpu,
            desc: "Engine and compute performance metrics",
            settings: [
                { name: "Computation Engine", value: "CPU-FORGE-V1", type: "status" },
                { name: "Max Memory Allocation", value: "8GB / 16GB", type: "toggle" }
            ]
        },
        {
            title: "Security & Access",
            icon: Shield,
            desc: "API credentials and data encryption",
            settings: [
                { name: "API Registry Protocol", value: "Secure SSL", type: "status" },
                { name: "Key Rotation", value: "Every 30 Days", type: "action" }
            ]
        },
        {
            title: "Notifications",
            icon: Bell,
            desc: "Override system and UI alert settings",
            settings: [
                { name: "OS-Level Notifications", value: "Enabled", type: "toggle" },
                { name: "Toast Duration", value: "5000ms", type: "input" }
            ]
        },
        {
            title: "Data Registry",
            icon: Database,
            desc: "Storage and persistence configuration",
            settings: [
                { name: "Storage Driver", value: "Local SQLite + FS", type: "status" },
                { name: "Auto-Cleanup", value: "Enabled", type: "toggle" }
            ]
        }
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col gap-2 px-1">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center">
                        <Settings className="text-purple-500" size={20} />
                    </div>
                    <div>
                        <h2 className="text-[10px] font-black text-purple-500 uppercase tracking-[0.4em] leading-none">OS Configuration</h2>
                        <h1 className="text-3xl font-black text-white italic mt-1 font-mono uppercase">System <span className="text-purple-600">Settings</span></h1>
                    </div>
                </div>
                <p className="text-gray-500 text-xs font-medium max-w-lg mt-2">
                    Manage your DS-FORGE environment parameters, security protocols, and hardware acceleration settings.
                </p>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {sections.map((section) => (
                    <div key={section.title} className="glass-panel p-8 rounded-[2rem] border-white/5 bg-black/20 hover:bg-black/40 transition-all group shadow-2xl">
                        <div className="flex items-start justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/10 group-hover:scale-110 transition-transform duration-500">
                                    <section.icon size={20} className="text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-tight">{section.title}</h3>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter mt-1">{section.desc}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {section.settings.map((s) => (
                                <div key={s.name} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 group/row hover:border-purple-500/20 transition-all">
                                    <span className="text-[11px] font-bold text-gray-400 group-hover/row:text-gray-200 transition-colors uppercase tracking-tight">{s.name}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/10 uppercase tracking-widest">{s.value}</span>
                                        <ChevronRight size={12} className="text-gray-700 group-hover/row:text-purple-500 transition-colors" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer Action */}
            <div className="glass-panel p-8 rounded-3xl border-purple-500/10 bg-purple-600/[0.02] flex items-center justify-between">
                <div className="space-y-1">
                    <h4 className="text-sm font-black text-white uppercase italic">Factory Reset Registry</h4>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Wipe all datasets, models, and session logs</p>
                </div>
                <button className="px-8 py-3 rounded-xl bg-rose-600/10 text-rose-500 border border-rose-500/20 font-black text-[10px] uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all active:scale-95 shadow-2xl">
                    Purge System
                </button>
            </div>
        </div>
    );
}
