"use client";
import React from 'react';
import { useExplainabilityStore } from '@/store/explainabilityStore';
import { DOCS } from '@/constants/docs';
import { X, BookOpen, ChevronRight, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function HelpPanel() {
    const { isHelpOpen, closeHelp, activeHelpSection } = useExplainabilityStore();
    const content = activeHelpSection ? DOCS[activeHelpSection] : null;

    if (!content) return null;

    return (
        <AnimatePresence>
            {isHelpOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeHelp}
                        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[220]"
                    />

                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        className="fixed right-0 top-0 h-full w-[450px] bg-[#0c0e14] border-l border-white/5 z-[230] flex flex-col shadow-2xl overflow-hidden"
                    >
                        <header className="p-8 border-b border-white/10 bg-purple-600/5 items-center flex justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-purple-600/20 text-purple-400">
                                    <BookOpen size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white tracking-tight">{content.title}</h2>
                                    <p className="text-xs text-purple-400 font-bold uppercase tracking-widest mt-0.5">Educational Module</p>
                                </div>
                            </div>
                            <button onClick={closeHelp} className="p-2 hover:bg-white/5 rounded-xl text-gray-500 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </header>

                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            <div className="prose prose-invert max-w-none">
                                <p className="text-gray-400 text-lg leading-relaxed mb-8 border-l-2 border-purple-500/30 pl-6 italic">
                                    "{content.description}"
                                </p>

                                <div className="space-y-6 text-gray-300">
                                    {content.guide.split('###').map((section, idx) => {
                                        if (!section.trim()) return null;
                                        const [title, ...body] = section.split('\n');
                                        return (
                                            <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                                                <h3 className="text-purple-400 font-bold text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
                                                    <ChevronRight size={14} /> {title.trim()}
                                                </h3>
                                                <div className="text-sm leading-7 space-y-4 whitespace-pre-wrap opacity-80">
                                                    {body.join('\n').trim()}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="mt-12 p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex gap-4">
                                <HelpCircle className="text-emerald-500 shrink-0" size={20} />
                                <div>
                                    <h4 className="text-emerald-500 font-bold text-sm mb-1">PRO TIP</h4>
                                    <p className="text-xs text-emerald-500/70 leading-normal">
                                        Each mutation you apply creates a new entry in your **Register**. This ensures your original data remains untouched.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <footer className="p-8 border-t border-white/5 bg-black/40">
                            <button
                                onClick={closeHelp}
                                className="w-full py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm transition-all"
                            >
                                Understood, Continue
                            </button>
                        </footer>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
