"use client";
import React from 'react';
import { Settings, Shield, Bell, Database, Monitor, Cpu, ChevronRight, Brain, Key, Eye, EyeOff } from 'lucide-react';
import { useConfigStore } from '@/store/configStore';

export default function SettingsPage() {
    const { llmProvider, apiKey, modelName, setProvider, setApiKey, setModelName } = useConfigStore();
    const [isVisible, setIsVisible] = React.useState(false);

    const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newProvider = e.target.value as any;
        setProvider(newProvider);
        if (newProvider === 'openai') setModelName('gpt-4o');
        if (newProvider === 'groq') setModelName('llama3-70b-8192');
        if (newProvider === 'gemini') setModelName('gemini-1.5-pro');
        if (newProvider === 'openrouter') setModelName('anthropic/claude-3-opus');
    };

    const handleReset = async () => {
        if (confirm("DANGER: This will delete ALL datasets, models, and training logs from the server. It cannot be undone.\n\nAre you sure?")) {
            try {
                // 1. Purge Backend
                await fetch('http://localhost:8000/api/v1/system/purge', { method: 'DELETE' });

                // 2. Clear Local Config
                localStorage.clear();

                alert("System Reset Complete.");
                window.location.reload();
            } catch (err) {
                alert("Failed to purge system: " + err);
            }
        }
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
                    Manage your DS-FORGE environment parameters. API Keys are stored <strong>locally</strong> in your browser and are never saved to the backend database.
                </p>
            </div>

            {/* AI Configuration Panel - Main Active Section */}
            <div className="glass-panel p-8 rounded-[2rem] border-purple-500/20 bg-black/40 shadow-2xl space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                <div className="flex items-start justify-between relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                            <Brain size={24} className="text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-white uppercase tracking-tight">AI Analyst Engine</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter mt-1">LLM Provider & Credentials</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                    {/* Provider Selection */}
                    <div className="space-y-3">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-tight ml-1">Provider Service</label>
                        <div className="relative group">
                            <select
                                value={llmProvider}
                                onChange={handleProviderChange}
                                className="w-full bg-[#0F172A] border border-white/10 rounded-xl p-4 text-white text-sm focus:ring-2 focus:ring-purple-500/30 outline-none transition-all appearance-none cursor-pointer font-bold shadow-lg"
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
                            className="w-full bg-[#0F172A] border border-white/10 rounded-xl p-4 text-white text-sm focus:ring-2 focus:ring-purple-500/30 outline-none transition-all placeholder:text-gray-600 font-mono shadow-lg focus:bg-black/60"
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
                                className="w-full bg-[#0F172A] border border-white/10 rounded-xl py-4 pl-12 pr-12 text-white text-sm focus:ring-2 focus:ring-purple-500/30 outline-none transition-all placeholder:text-gray-600 font-mono shadow-lg focus:bg-black/60"
                            />
                            <button
                                onClick={() => setIsVisible(!isVisible)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                            >
                                {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-500 font-medium ml-1 flex items-center gap-2">
                            <Shield size={10} className="text-emerald-500" />
                            Credentials are encrypted in local storage
                        </p>
                    </div>
                </div>
            </div>

            {/* Footer Action */}
            <div className="glass-panel p-8 rounded-3xl border-rose-500/10 bg-rose-950/[0.05] flex items-center justify-between">
                <div className="space-y-1">
                    <h4 className="text-sm font-black text-rose-500/80 uppercase italic">Danger Zone</h4>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Clear local configuration and keys</p>
                </div>
                <button
                    onClick={handleReset}
                    className="px-6 py-3 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 font-black text-[10px] uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all active:scale-95 shadow-xl"
                >
                    Reset Config
                </button>
            </div>
        </div>
    );
}
