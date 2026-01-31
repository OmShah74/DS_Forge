"use client";
import React from 'react';
import { Settings, Shield, Bell, Database, Monitor, Cpu, ChevronRight, Brain, Key, Eye, EyeOff } from 'lucide-react';
import { useConfigStore } from '@/store/configStore';

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

    const { llmProvider, apiKey, modelName, setProvider, setApiKey, setModelName } = useConfigStore();
    const [isVisible, setIsVisible] = React.useState(false);

    const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newProvider = e.target.value as any;
        setProvider(newProvider);
        // Auto-set default model for convenience
        if (newProvider === 'openai') setModelName('gpt-4o');
        if (newProvider === 'groq') setModelName('llama3-70b-8192');
        if (newProvider === 'gemini') setModelName('gemini-1.5-pro');
        if (newProvider === 'openrouter') setModelName('anthropic/claude-3-opus');
    };

    return (
        <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Header */}
            <div className="flex flex-col gap-2 px-1">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center">
                        <Settings className="text-purple-500" size={20} />
                    </div>
                    <div>
                        <h2 className="text-[10px] font-black text-purple-500 uppercase tracking-[0.4em] leading-none">System Configuration</h2>
                        <h1 className="text-3xl font-black text-white italic mt-1 font-mono uppercase">Settings <span className="text-purple-600">& Secrets</span></h1>
                    </div>
                </div>
                <p className="text-gray-500 text-xs font-medium max-w-lg mt-2">
                    Configure your AI Analysis engine. API Keys are stored <strong>locally</strong> in your browser and are never saved to the backend database.
                </p>
            </div>

            {/* AI Configuration Panel */}
            <div className="glass-panel p-8 rounded-[2rem] border-white/5 bg-black/20 shadow-2xl space-y-8">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/10">
                            <Brain size={20} className="text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-tight">AI Analyst Engine</h3>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter mt-1">LLM Provider & Credentials</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Provider Selection */}
                    <div className="space-y-3">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-tight ml-1">Provider Service</label>
                        <div className="relative group">
                            <select
                                value={llmProvider}
                                onChange={handleProviderChange}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm focus:ring-2 focus:ring-purple-500/30 outline-none transition-all appearance-none cursor-pointer font-bold"
                            >
                                <option value="openai">OpenAI (GPT)</option>
                                <option value="groq">Groq (Llama/Mixtral)</option>
                                <option value="gemini">Google Gemini</option>
                                <option value="openrouter">OpenRouter (Aggregator)</option>
                            </select>
                            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none group-hover:text-purple-500 transition-colors" size={16} />
                        </div>
                    </div>

                    {/* Model Name */}
                    <div className="space-y-3">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-tight ml-1">Target Model ID</label>
                        <input
                            type="text"
                            value={modelName}
                            onChange={(e) => setModelName(e.target.value)}
                            placeholder="e.g. gpt-4-turbo"
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm focus:ring-2 focus:ring-purple-500/30 outline-none transition-all placeholder:text-gray-700 font-mono"
                        />
                    </div>

                    {/* API Key */}
                    <div className="space-y-3 md:col-span-2">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-tight ml-1">Secret API Key</label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                                <Key size={16} />
                            </div>
                            <input
                                type={isVisible ? "text" : "password"}
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="sk-..."
                                className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-12 text-white text-sm focus:ring-2 focus:ring-purple-500/30 outline-none transition-all placeholder:text-gray-700 font-mono"
                            />
                            <button
                                onClick={() => setIsVisible(!isVisible)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                            >
                                {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-600 font-medium ml-1">
                            Key is stored in <span className="text-gray-500">localStorage</span> only.
                        </p>
                    </div>
                </div>
            </div>

            {/* Other Settings (Legacy/Visual) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 opacity-60 pointer-events-none filter grayscale">
                {sections.map((section) => (
                    <div key={section.title} className="glass-panel p-8 rounded-[2rem] border-white/5 bg-black/20">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                                    <section.icon size={20} className="text-gray-500" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-tight">{section.title}</h3>
                                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-tighter mt-1">{section.desc}</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {section.settings.map((s) => (
                                <div key={s.name} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">{s.name}</span>
                                    <span className="text-[10px] font-black text-gray-500 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5 uppercase tracking-widest">{s.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
