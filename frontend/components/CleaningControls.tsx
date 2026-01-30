"use client";
import React, { useEffect, useState } from "react";
import { Settings2, HelpCircle, ArrowRight, Trash2, Edit3, Type } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface CleaningControlsProps {
    operation: string;
    columns: string[];
    onParamsChange: (params: any) => void;
}

export default function CleaningControls({ operation, columns, onParamsChange }: CleaningControlsProps) {
    const [params, setParams] = useState<any>({});

    useEffect(() => {
        onParamsChange(params);
    }, [params, onParamsChange]);

    const updateParam = (key: string, value: any) => {
        setParams((prev: any) => ({ ...prev, [key]: value }));
    };

    const renderInput = (label: string, key: string, type: string = "text", placeholder: string = "") => (
        <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">{label}</label>
            <input
                type={type}
                value={params[key] ?? ""}
                onChange={(e) => updateParam(key, type === "number" ? (e.target.value === "" ? null : parseFloat(e.target.value)) : e.target.value)}
                placeholder={placeholder}
                className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-white text-sm focus:ring-2 focus:ring-purple-500/30 outline-none transition-all placeholder:text-gray-800 font-mono"
            />
        </div>
    );

    const renderDropdown = (label: string, key: string, options: { value: string, label: string }[]) => (
        <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">{label}</label>
            <select
                value={params[key] ?? ""}
                onChange={(e) => updateParam(key, e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-white text-sm focus:ring-2 focus:ring-purple-500/30 outline-none transition-all appearance-none cursor-pointer"
            >
                <option value="" className="bg-[#04060c]">Select...</option>
                {options.map(opt => (
                    <option key={opt.value} value={opt.value} className="bg-[#04060c]">{opt.label}</option>
                ))}
            </select>
        </div>
    );

    const renderMultiSelect = (label: string, key: string) => (
        <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">{label}</label>
            <div className="flex flex-wrap gap-2 p-4 bg-black/40 border border-white/5 rounded-2xl min-h-[60px]">
                {columns.map(col => {
                    const isSelected = params[key]?.includes(col);
                    return (
                        <button
                            key={col}
                            onClick={() => {
                                const current = params[key] || [];
                                const next = isSelected
                                    ? current.filter((c: string) => c !== col)
                                    : [...current, col];
                                updateParam(key, next);
                            }}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border",
                                isSelected
                                    ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
                                    : "bg-white/[0.02] border-white/5 text-gray-600 hover:border-white/10 hover:text-gray-400"
                            )}
                        >
                            {col}
                        </button>
                    );
                })}
            </div>
        </div>
    );

    const operationDescriptions: Record<string, string> = {
        drop_missing: "Removes rows/cols with missing (NaN) values. 'Threshold' specifies the minimum number of non-empty cells required to keep a row.",
        fill_missing: "Replaces NaN values with Mean, Median, or a fixed value. Essential for keeping data volume high.",
        drop_duplicates: "Deletes identical rows. Ensures your model doesn't learn from redundant data points.",
        drop_columns: "Removes selected features to simplify the data structure and prevent overfitting.",
        rename_columns: "Update column headers. Map old names to clean, standardized labels for better readability.",
        convert_type: "Changes data representation (e.g., String to Number). Critical for mathematical operations.",
        remove_outliers_zscore: "Eliminates rows with values that are statistically too far from the average.",
        remove_outliers_iqr: "Uses the 25th/75th percentiles to surgically remove anomalies from your dataset.",
        text_clean: "Standardizes strings by fixing casing or removing messy extra spaces.",
    };

    return (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Contextual Header - More Compact */}
            <div className="flex items-start gap-3 mb-4 p-3 rounded-xl bg-purple-500/5 border border-purple-500/10">
                <div className="w-6 h-6 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shrink-0 mt-0.5">
                    <Settings2 size={12} className="text-purple-400" />
                </div>
                <div className="flex-1">
                    <p className="text-[10px] font-bold text-gray-400 leading-relaxed">
                        <span className="text-white font-black uppercase tracking-widest mr-2">LOGIC:</span>
                        {operationDescriptions[operation] || "Configure parameters for the selected transformation."}
                    </p>
                </div>
            </div>

            {/* Dynamic Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-1">
                {operation === "drop_missing" && (
                    <>
                        {renderDropdown("Axis", "axis", [{ value: "0", label: "Rows (Any NaN drops row)" }, { value: "1", label: "Columns (Any NaN drops col)" }])}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 px-1">
                                Threshold <span title="Keep rows/cols with at least this many non-NaN values"><HelpCircle size={10} className="text-purple-400 cursor-help" /></span>
                            </label>
                            <input
                                type="number"
                                value={params['threshold'] ?? ''}
                                onChange={(e) => updateParam('threshold', e.target.value === '' ? null : parseInt(e.target.value))}
                                placeholder="Min non-NaN cells..."
                                className="w-full bg-black/40 border border-white/5 rounded-xl p-3.5 text-white text-xs focus:ring-2 focus:ring-purple-500/30 outline-none transition-all placeholder:text-gray-800 font-mono"
                            />
                        </div>
                        <div className="md:col-span-2">
                            {renderMultiSelect("Filter by Columns", "subset")}
                        </div>
                    </>
                )}

                {operation === "fill_missing" && (
                    <>
                        {renderDropdown("Strategy", "method", [
                            { value: "mean", label: "Statistical Mean" },
                            { value: "median", label: "Statistical Median" },
                            { value: "constant", label: "Fixed Value" }
                        ])}
                        {params['method'] === 'constant' && renderInput("Constant Value", "value")}
                        <div className="md:col-span-2">
                            {renderMultiSelect("Columns to Impute", "subset")}
                        </div>
                    </>
                )}

                {operation === "rename_columns" && (
                    <div className="md:col-span-2 space-y-4">
                        <div className="flex items-center gap-2 px-1 text-emerald-400 font-bold">
                            <Edit3 size={14} />
                            <span className="text-[10px] uppercase tracking-widest">Interactive Column Mapper</span>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {columns.map(col => (
                                <div key={col} className="flex items-center gap-4 bg-black/40 p-3 rounded-xl border border-white/5">
                                    <div className="flex-1 flex items-center gap-3">
                                        <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-[10px] font-black text-gray-500 uppercase tracking-tighter shrink-0 border border-white/5">
                                            SRC
                                        </div>
                                        <span className="text-xs font-bold text-gray-400 truncate">{col}</span>
                                    </div>
                                    <ArrowRight size={14} className="text-purple-500/40" />
                                    <div className="flex-[2] relative group">
                                        <input
                                            type="text"
                                            value={params['mapper']?.[col] ?? col}
                                            onChange={(e) => {
                                                const currentMapper = params['mapper'] || {};
                                                updateParam('mapper', { ...currentMapper, [col]: e.target.value });
                                            }}
                                            className="w-full bg-white/[0.03] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:ring-2 focus:ring-purple-500/30 outline-none placeholder:text-gray-800 font-mono transition-all"
                                            placeholder="Enter new name..."
                                        />
                                        <Type size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-purple-500/40" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {operation === "drop_columns" && (
                    <div className="md:col-span-2 space-y-4">
                        <div className="flex items-center gap-2 px-1 text-rose-400 font-bold">
                            <Trash2 size={14} />
                            <span className="text-[10px] uppercase tracking-widest">Select Features to Purge</span>
                        </div>
                        {renderMultiSelect("Columns to Drop", "columns")}
                    </div>
                )}

                {operation === "convert_type" && (
                    <>
                        {renderMultiSelect("Target Columns", "columns")}
                        {renderDropdown("Target Format", "dtype", [
                            { value: "int64", label: "Integer (Discrete Numbers)" },
                            { value: "float64", label: "Float (Decimal Numbers)" },
                            { value: "string", label: "String (Text Labels)" },
                            { value: "datetime64[ns]", label: "Temporal (Date/Time)" }
                        ])}
                    </>
                )}

                {(operation === "remove_outliers_zscore" || operation === "remove_outliers_iqr") && (
                    <>
                        {renderInput("Sensitivity (Threshold)", "threshold", "number", "e.g. 3.0 or 1.5")}
                        {renderMultiSelect("Feature Subset", "columns")}
                    </>
                )}

                {operation === "text_clean" && (
                    <>
                        {renderDropdown("Sanitization Strategy", "case_type", [
                            { value: "lower", label: "Force Lowercase" },
                            { value: "upper", label: "Force Uppercase" }
                        ])}
                        {renderMultiSelect("Target Columns", "columns")}
                    </>
                )}

                {operation === "drop_duplicates" && (
                    <div className="md:col-span-2">
                        {renderMultiSelect("Identity Verification Columns (Subset)", "subset")}
                        <p className="mt-4 text-[9px] text-gray-600 italic px-2">Leave empty to check complete row equality.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
