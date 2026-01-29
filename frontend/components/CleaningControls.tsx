"use client";
import React, { useState, useEffect } from 'react';
import { Settings2, Plus, X, HelpCircle, ArrowRightLeft } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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

    // Reset params when operation changes
    useEffect(() => {
        const defaults: any = {
            drop_missing: { axis: 0, threshold: null, subset: [] },
            fill_missing: { method: 'value', value: '', columns: [] },
            drop_duplicates: { subset: [], keep: 'first' },
            drop_columns: { columns: [] },
            rename_columns: { mapping: {} },
            convert_type: { column: '', type: 'numeric' },
            remove_outliers_zscore: { columns: [], threshold: 3.0 },
            remove_outliers_iqr: { columns: [] },
            text_clean: { column: '', action: 'lower' },
        };
        const newParams = defaults[operation] || {};
        setParams(newParams);
        onParamsChange(newParams);
    }, [operation, onParamsChange]);

    const updateParam = (key: string, value: any) => {
        const newParams = { ...params, [key]: value };
        setParams(newParams);
        onParamsChange(newParams);
    };

    const toggleColumnInList = (listKey: string, column: string) => {
        const currentList = params[listKey] || [];
        const newList = currentList.includes(column)
            ? currentList.filter((c: string) => c !== column)
            : [...currentList, column];
        updateParam(listKey, newList);
    };

    // Special handler for renaming
    const updateRenameMapping = (oldName: string, newName: string) => {
        const newMapping = { ...(params.mapping || {}), [oldName]: newName };
        if (newName === "" || newName === oldName) {
            delete newMapping[oldName];
        }
        updateParam('mapping', newMapping);
    };

    const renderMultiSelect = (label: string, listKey: string) => (
        <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                {label} <span className="text-[9px] text-gray-600 font-bold lowercase italic">(Select multiple)</span>
            </label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1 custom-scrollbar">
                {columns.map(col => (
                    <button
                        key={col}
                        onClick={() => toggleColumnInList(listKey, col)}
                        className={cn(
                            "px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all active:scale-95",
                            params[listKey]?.includes(col)
                                ? "bg-purple-500/20 border-purple-500/50 text-purple-300"
                                : "bg-white/5 border-white/10 text-gray-500 hover:border-white/20 hover:text-gray-300"
                        )}
                    >
                        {col}
                    </button>
                ))}
            </div>
        </div>
    );

    const renderDropdown = (label: string, key: string, options: { value: string, label: string }[]) => (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{label}</label>
            <select
                value={params[key] || ''}
                onChange={(e) => updateParam(key, e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-xs focus:ring-2 focus:ring-purple-500/30 outline-none transition-all"
            >
                {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
        </div>
    );

    const renderInput = (label: string, key: string, type: string = "text", placeholder: string = "") => (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{label}</label>
            <input
                type={type}
                value={params[key] ?? ''}
                onChange={(e) => updateParam(key, type === 'number' ? parseFloat(e.target.value) : e.target.value)}
                placeholder={placeholder}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-xs focus:ring-2 focus:ring-purple-500/30 outline-none transition-all placeholder:text-gray-700 font-mono"
            />
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
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                Threshold <span title="Keep rows/cols with at least this many non-NaN values"><HelpCircle size={10} className="text-purple-400 cursor-help" /></span>
                            </label>
                            <input
                                type="number"
                                value={params['threshold'] ?? ''}
                                onChange={(e) => updateParam('threshold', e.target.value === '' ? null : parseInt(e.target.value))}
                                placeholder="Min non-NaN cells..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-xs focus:ring-2 focus:ring-purple-500/30 outline-none transition-all placeholder:text-gray-700 font-mono"
                            />
                        </div>
                        <div className="md:col-span-2">
                            {renderMultiSelect("Filter by Columns", "subset")}
                        </div>
                    </>
                )}

                {operation === "fill_missing" && (
                    <>
                        {renderDropdown("Method", "method", [
                            { value: "value", label: "Fixed Value" },
                            { value: "mean", label: "Mean (Numeric)" },
                            { value: "median", label: "Median (Numeric)" },
                            { value: "mode", label: "Mode (Frequent)" },
                            { value: "ffill", label: "Forward Fill" },
                            { value: "bfill", label: "Backward Fill" }
                        ])}
                        {params.method === 'value' && renderInput("Value to fill", "value", "text", "Enter value...")}
                        <div className="md:col-span-2">
                            {renderMultiSelect("Columns to Fill", "columns")}
                        </div>
                    </>
                )}

                {operation === "drop_duplicates" && (
                    <>
                        {renderDropdown("Keep", "keep", [{ value: "first", label: "Keep First" }, { value: "last", label: "Keep Last" }, { value: "False", label: "Drop All" }])}
                        <div className="md:col-span-2">
                            {renderMultiSelect("Columns to check for Duplication", "subset")}
                        </div>
                    </>
                )}

                {operation === "drop_columns" && (
                    <div className="md:col-span-2">
                        {renderMultiSelect("Select Columns to Remove", "columns")}
                    </div>
                )}

                {operation === "rename_columns" && (
                    <div className="md:col-span-2 space-y-6">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            Map Column Names <HelpCircle size={10} className="text-gray-600" />
                        </label>
                        <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                            {columns.map(col => (
                                <div key={col} className="flex items-center gap-4 bg-white/[0.03] p-3 rounded-xl border border-white/5 group hover:border-purple-500/30 transition-all">
                                    <div className="w-1/2 font-mono text-xs text-gray-400 p-2 bg-black/20 rounded-lg truncate border border-white/5">
                                        {col}
                                    </div>
                                    <ArrowRightLeft size={14} className="text-gray-600 group-hover:text-purple-400 transition-colors shrink-0" />
                                    <input
                                        type="text"
                                        placeholder="New name..."
                                        value={params.mapping?.[col] || ""}
                                        onChange={(e) => updateRenameMapping(col, e.target.value)}
                                        className="w-1/2 bg-purple-500/5 border border-white/10 rounded-lg p-2 text-white text-xs focus:ring-1 focus:ring-purple-500/50 outline-none transition-all placeholder:text-gray-700 font-bold"
                                    />
                                </div>
                            ))}
                        </div>
                        {Object.keys(params.mapping || {}).length > 0 && (
                            <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-[9px] font-black text-emerald-400/80 uppercase tracking-widest">
                                {Object.keys(params.mapping).length} Renaming Rules Active
                            </div>
                        )}
                    </div>
                )}

                {operation === "convert_type" && (
                    <>
                        {renderDropdown("Select Column", "column", [
                            { value: "", label: "-- Choose Column --" },
                            ...columns.map(c => ({ value: c, label: c }))
                        ])}
                        {renderDropdown("Target Type", "type", [
                            { value: "numeric", label: "Numeric (Float64)" },
                            { value: "datetime", label: "Date & Time" },
                            { value: "string", label: "Plain Text" },
                            { value: "category", label: "Categorical" }
                        ])}
                    </>
                )}

                {(operation === "remove_outliers_zscore" || operation === "remove_outliers_iqr") && (
                    <>
                        {operation === "remove_outliers_zscore" && renderInput("Z-Score Threshold", "threshold", "number", "Default is 3.0")}
                        <div className="md:col-span-2">
                            {renderMultiSelect("Columns to Analyze", "columns")}
                        </div>
                    </>
                )}

                {operation === "text_clean" && (
                    <>
                        {renderDropdown("Select Column", "column", [
                            { value: "", label: "-- Choose Column --" },
                            ...columns.map(c => ({ value: c, label: c }))
                        ])}
                        {renderDropdown("Action", "action", [
                            { value: "lower", label: "Lowercase" },
                            { value: "upper", label: "Uppercase" },
                            { value: "strip", label: "Trim Whitespace" }
                        ])}
                    </>
                )}
            </div>
        </div>
    );
}
