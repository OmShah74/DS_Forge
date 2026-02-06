"use client";
import { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";
import { Dataset } from "@/lib/types";
import DataGrid from "@/components/DataGrid";
import {
    FlaskConical, Play, Sparkles, Filter,
    Settings, ListChecks, Wand2, Info, HelpCircle,
    Database, ChevronDown, Search, Table as TableIcon, Layers, Zap, Star
} from "lucide-react";
import { useExplainabilityStore } from "@/store/explainabilityStore";
import { useNotificationStore } from "@/store/notificationStore";

const FEATURE_OPS = [
    { value: "standard_scaler", label: "Standard Scaler (Z-Score)", description: "Scale features to zero mean and unit variance. Good for normal distributions.", category: "Scaling & Distribution" },
    { value: "minmax_scaler", label: "MinMax Scaler (0-1)", description: "Scale features to a fixed range [0, 1]. Preserves zero values.", category: "Scaling & Distribution" },
    { value: "robust_scaler", label: "Robust Scaler (Outliers)", description: "Scale features using statistics that are robust to outliers (IQR).", category: "Scaling & Distribution" },
    { value: "maxabs_scaler", label: "MaxAbs Scaler", description: "Scale each feature by its maximum absolute value. Preserves sparsity.", category: "Scaling & Distribution" },
    { value: "l2_normalization", label: "L2 Normalization", description: "Scale input vectors individually to unit norm (L2). Good for text classification.", category: "Scaling & Distribution" },

    { value: "log_transform", label: "Log Transform (Log1p)", description: "Apply natural logarithm to reduce right skewness. Handles zeros via log(1+x).", category: "Transformations" },
    { value: "sqrt_transform", label: "Square Root", description: "Apply square root to stabilize variance. Weaker than Log transform.", category: "Transformations" },
    { value: "yeo_johnson", label: "Yeo-Johnson Power", description: "Power transform to make data more Gaussian-like. Supports positive and negative values.", category: "Transformations" },
    { value: "box_cox", label: "Box-Cox Power", description: "Power transform for strictly positive data to normality.", category: "Transformations" },
    { value: "quantile_normal", label: "Quantile (Gaussian)", description: "Transform features to follow a normal distribution. Robust to outliers.", category: "Transformations" },
    { value: "quantile_uniform", label: "Quantile (Uniform)", description: "Transform features to follow a uniform distribution.", category: "Transformations" },
    { value: "sigmoid_transform", label: "Sigmoid Activation", description: "Map values to (0, 1) using logistic function. Good for neural networks.", category: "Transformations" },
    { value: "percentile_rank", label: "Percentile Rank", description: "Replace values with their percentile rank. Robust to outliers.", category: "Transformations" },

    { value: "label_encoding", label: "Label Encoding", description: "Encode target labels with value between 0 and n_classes-1.", category: "Encoding (Categorical)" },
    { value: "one_hot_encoding", label: "One-Hot Encoding", description: "Encode categorical features as a one-hot numeric array.", category: "Encoding (Categorical)" },
    { value: "frequency_encoding", label: "Frequency Encoding", description: "Replace categories with their frequency counts.", category: "Encoding (Categorical)" },
    { value: "hash_encoding", label: "Hash Encoding", description: "Map categories to indices using a hash function. Good for high cardinality.", category: "Encoding (Categorical)" },

    { value: "binarizer", label: "Binarizer (Threshold)", description: "Threshold numerical features to binary (0/1).", category: "Discretization" },
    { value: "kbins_uniform", label: "Binning (Uniform)", description: "Discretize into k bins of equal width.", category: "Discretization" },
    { value: "kbins_quantile", label: "Binning (Quantile)", description: "Discretize into k bins of equal frequency.", category: "Discretization" },
    { value: "kbins_kmeans", label: "Binning (KMeans)", description: "Discretize into k bins using K-Means clustering.", category: "Discretization" },

    { value: "polynomial_features", label: "Polynomial Features (Deg 2)", description: "Generate polynomial and interaction features. captures non-linearities.", category: "Generation & Interaction" },
    { value: "interaction_only", label: "Interaction Only (Deg 2)", description: "Generate only interaction features (products of distinct features).", category: "Generation & Interaction" },
    { value: "date_extraction", label: "Date Parts Extraction", description: "Extract Year, Month, Day, Hour from datetime columns.", category: "Generation & Interaction" },

    { value: "pca", label: "PCA (Dim Reduction)", description: "Principal Component Analysis for dimensionality reduction.", category: "Dimensionality" },
];

export default function FeatureEngineeringPage() {
    const { addToast, notifySystem } = useNotificationStore();
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [preview, setPreview] = useState<any>(null);
    const [columns, setColumns] = useState<string[]>([]);
    const [previewLimit, setPreviewLimit] = useState(100);

    // Recommendations
    const [recommendations, setRecommendations] = useState<string[]>([]);

    // Wizard State
    const [operation, setOperation] = useState("standard_scaler");
    const [selectedCols, setSelectedCols] = useState<string[]>([]);
    const [pcaComponents, setPcaComponents] = useState(2);
    const [binarizerThreshold, setBinarizerThreshold] = useState(0.0);
    const [loading, setLoading] = useState(false);
    const { openHelp } = useExplainabilityStore();

    // Dropdown State
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [hoveredOp, setHoveredOp] = useState<string | null>(null);

    useEffect(() => {
        loadDatasets();
    }, []);

    const loadDatasets = () => {
        api.get("/datasets/").then((res) => setDatasets(res.data));
    };

    useEffect(() => {
        if (selectedId) {
            loadPreview(selectedId);
            loadRecommendations(selectedId);
        }
    }, [selectedId, previewLimit]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const loadPreview = async (id: number) => {
        const res = await api.get(`/datasets/${id}/preview?limit=${previewLimit}`);
        setPreview(res.data);
        setColumns(res.data.columns);
        setSelectedCols([]);
    };

    const loadRecommendations = async (id: number) => {
        try {
            const res = await api.get(`/features/recommend/${id}`);
            setRecommendations(res.data.recommendations || []);
        } catch (error) {
            console.error("Failed to load recommendations", error);
            setRecommendations([]); // Default to empty
        }
    };

    const toggleColumn = (col: string) => {
        if (selectedCols.includes(col)) {
            setSelectedCols(prev => prev.filter(c => c !== col));
        } else {
            setSelectedCols(prev => [...prev, col]);
        }
    };

    const handleApply = async () => {
        if (!selectedId || selectedCols.length === 0) return;
        setLoading(true);
        try {
            const finalParams: any = { columns: selectedCols };
            if (operation === 'pca') {
                finalParams.n_components = pcaComponents;
            }
            if (operation === 'binarizer') {
                finalParams.threshold = binarizerThreshold;
            }

            await api.post("/features/apply", {
                dataset_id: selectedId,
                operation: operation,
                params: finalParams
            });
            addToast("Mutation Successful: Features computed", "success");
            notifySystem("Pipeline Complete", `Feature engineering (${operation}) successful.`);
            loadDatasets();
        } catch (error: any) {
            const msg = error.response?.data?.detail || "Operation failed";
            addToast(msg, "error");
        } finally {
            setLoading(false);
        }
    };

    const isRecommended = (op: string) => recommendations.includes(op);
    const selectedOpDetails = FEATURE_OPS.find(o => o.value === operation);

    // Filter ops for dropdown
    const filteredOps = FEATURE_OPS.filter(op =>
        op.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        op.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const groupedOps = filteredOps.reduce((groups, op) => {
        const category = op.category;
        if (!groups[category]) groups[category] = [];
        groups[category].push(op);
        return groups;
    }, {} as Record<string, typeof FEATURE_OPS>);

    return (
        <main className="max-w-[1600px] mx-auto h-[calc(100vh-80px)] flex gap-8 animate-in fade-in duration-700">
            {/* LEFT: Controls */}
            <div className="w-96 flex flex-col gap-8 shrink-0">

                {/* Dataset Selector */}
                <div className="glass-panel p-6 rounded-[2rem] flex flex-col h-[35%] border-white/5 overflow-hidden shadow-2xl bg-black/20">
                    <div className="flex items-center justify-between px-1 mb-6 shrink-0">
                        <div className="flex items-center gap-2">
                            <FlaskConical size={14} className="text-purple-500" />
                            <h2 className="text-sm font-semibold text-gray-400 tracking-wide leading-none">Source Registry</h2>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                        {datasets.map(ds => (
                            <div
                                key={ds.id}
                                onClick={() => setSelectedId(ds.id)}
                                className={`
                                    p-5 rounded-2xl cursor-pointer transition-all border group relative overflow-hidden
                                    ${selectedId === ds.id
                                        ? 'bg-purple-500/10 border-purple-500/20 shadow-xl'
                                        : 'bg-white/[0.01] border-white/5 text-gray-500 hover:bg-white/5 hover:text-gray-300'}
                                `}
                            >
                                {selectedId === ds.id && (
                                    <div className="absolute left-0 top-0 w-1 h-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
                                )}
                                <p className={`font-bold text-base truncate ${selectedId === ds.id ? 'text-purple-400' : 'text-gray-300'}`}>{ds.filename}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-xs font-semibold opacity-50 tracking-wide bg-black/40 px-2 py-0.5 rounded border border-white/5">{ds.row_count} Vectors</span>
                                    <span className="text-xs font-semibold opacity-50 tracking-wide bg-black/40 px-2 py-0.5 rounded border border-white/5">{ds.column_count} Features</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Mutation Wizard */}
                <div className="glass-panel p-8 rounded-[2rem] flex flex-col h-[65%] border-white/5 shadow-2xl bg-black/40 relative">
                    <div className="flex flex-col gap-1 mb-8">
                        <h1 className="text-2xl font-bold text-white flex items-center gap-3 tracking-tight">
                            Mutation <span className="text-purple-600">Wizard</span>
                            <button
                                onClick={() => openHelp('features')}
                                className="p-1.5 hover:bg-white/10 rounded-full text-gray-500 hover:text-purple-400 transition-colors"
                            >
                                <HelpCircle size={18} />
                            </button>
                        </h1>
                        <p className="text-xs font-medium text-gray-500 italic">Evolve raw columns into high-signal feature vectors</p>
                    </div>

                    {/* Technique Select - MOVED OUTSIDE OF SCROLLABLE CONTAINER */}
                    <div className="mb-6 relative z-50" ref={dropdownRef}>
                        <label className="text-sm font-semibold text-purple-500 tracking-wide px-1 flex items-center gap-2 mb-2">
                             Transformation Protocol
                            {isRecommended(operation) && (
                                <Star size={12} className="text-yellow-400 fill-yellow-400 ml-auto" />
                            )}
                        </label>
                        
                        <div className="relative">
                            {/* Custom Select Trigger */}
                            <button 
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="w-full bg-[#0F172A] border border-white/20 rounded-xl p-3 text-white text-base focus:ring-2 focus:ring-purple-500/30 outline-none transition-all font-bold shadow-sm flex items-center justify-between"
                            >
                                <span className="truncate">{selectedOpDetails?.label || "Select Operation"}</span>
                                <ChevronDown size={14} className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown Menu */}
                            {isDropdownOpen && (
                                <div className="absolute top-full left-0 w-full mt-1 bg-[#0F172A] border border-white/20 rounded-xl shadow-2xl z-50 max-h-[600px] overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2">
                                    <div className="p-3 border-b border-white/10 flex items-center gap-2 bg-black/20">
                                        <Search size={14} className="text-gray-500" />
                                        <input
                                            autoFocus
                                            type="text"
                                            placeholder="Search protocols..."
                                            className="bg-transparent text-sm text-white font-medium outline-none w-full placeholder:text-gray-600"
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    <div className="overflow-y-auto flex-1 p-2 custom-scrollbar">
                                        {Object.entries(groupedOps).map(([cat, ops]) => (
                                            <div key={cat} className="mb-4">
                                                <div className="px-2 py-1 text-[10px] uppercase font-black tracking-widest text-gray-500 sticky top-0 bg-[#0F172A] z-10 opacity-90 backdrop-blur-sm">{cat}</div>
                                                <div className="space-y-1">
                                                    {ops.map(op => (
                                                        <div
                                                            key={op.value}
                                                            className={`
                                                                group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all
                                                                ${operation === op.value ? 'bg-purple-600 text-white' : 'hover:bg-white/5 text-gray-300'}
                                                            `}
                                                            onClick={() => {
                                                                setOperation(op.value);
                                                                setIsDropdownOpen(false);
                                                            }}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-sm tracking-tight">{op.label}</span>
                                                                {isRecommended(op.value) && (
                                                                    <Star size={10} className="text-yellow-400 fill-yellow-400" />
                                                                )}
                                                            </div>
                                                            {/* Tooltip trigger - Question mark */}
                                                            <div
                                                                className="relative px-2 py-1"
                                                                onMouseEnter={() => setHoveredOp(op.value)}
                                                                onMouseLeave={() => setHoveredOp(null)}
                                                            >
                                                                <HelpCircle size={14} className={`opacity-40 group-hover:opacity-100 transition-opacity ${operation === op.value ? 'text-white' : 'text-gray-400'}`} />

                                                                {/* Tooltip (Inside dropdown context) */}
                                                                {hoveredOp === op.value && (
                                                                    <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 w-48 p-3 bg-gray-900 border border-white/20 rounded-xl shadow-2xl z-[60] pointer-events-none animate-in fade-in slide-in-from-right-2">
                                                                        <p className="text-[10px] font-medium text-gray-200 leading-relaxed text-center">
                                                                            {op.description}
                                                                        </p>
                                                                        <div className="absolute top-1/2 -right-1.5 w-3 h-3 bg-gray-900 border-t border-r border-white/20 transform rotate-45 -translate-y-1/2"></div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-8 pr-2 custom-scrollbar pb-6 relative z-10">

                        {/* Feature Selection Pills */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <ListChecks size={10} className="text-purple-500" /> target vectors
                                </label>
                                <span className="text-[9px] font-black text-purple-400 italic">{selectedCols.length} Selected</span>
                            </div>

                            {!selectedId ? (
                                <div className="p-6 border border-dashed border-white/5 rounded-2xl flex flex-col items-center gap-2 justify-center text-gray-700">
                                    <Filter size={14} className="opacity-50" />
                                    <span className="text-[8px] font-black uppercase tracking-widest">Select Source Artifact</span>
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {columns.map(col => (
                                        <button
                                            key={col}
                                            onClick={() => toggleColumn(col)}
                                            className={`
                                                px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all
                                                ${selectedCols.includes(col)
                                                    ? 'bg-purple-600/20 border-purple-500/40 text-purple-400'
                                                    : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10'}
                                            `}
                                        >
                                            {col}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Extra Params */}
                        {operation === 'pca' && (
                            <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                                    <Info size={10} className="text-purple-500" /> PCA Components
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    max={columns.length}
                                    value={pcaComponents}
                                    onChange={(e) => setPcaComponents(Number(e.target.value))}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-xs font-mono font-bold focus:ring-2 focus:ring-purple-500/30 outline-none"
                                />
                            </div>
                        )}
                        {operation === 'binarizer' && (
                            <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                                    <Info size={10} className="text-purple-500" /> Threshold
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={binarizerThreshold}
                                    onChange={(e) => setBinarizerThreshold(Number(e.target.value))}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-xs font-mono font-bold focus:ring-2 focus:ring-purple-500/30 outline-none"
                                />
                            </div>
                        )}
                    </div>

                    <div className="pt-4 mt-auto relative z-20">
                        <button
                            onClick={handleApply}
                            disabled={loading || !selectedId || selectedCols.length === 0}
                            className={`
                                w-full p-4 rounded-xl font-bold text-sm tracking-wide flex justify-center items-center gap-3 transition-all shadow-2xl active:scale-95
                                ${loading || !selectedId || selectedCols.length === 0
                                    ? 'bg-white/5 text-gray-700'
                                    : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/40'}
                            `}
                        >
                            {loading ? "Syncing Logic..." : <><Sparkles size={16} /> Commit Mutation</>}
                        </button>
                    </div>

                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/[0.02] blur-[80px] rounded-full pointer-events-none"></div>
                </div>
            </div>

            {/* RIGHT: Data Grid */}
            <div className="flex-1 glass-panel p-2 rounded-[2.5rem] overflow-hidden flex flex-col border-white/5 shadow-2xl relative bg-black/40">
                {preview ? (
                    <div className="flex-1 flex flex-col animate-in fade-in duration-1000 overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 shrink-0 border-b border-white/5">
                            <div className="flex items-center gap-2">
                                <TableIcon size={14} className="text-purple-500" />
                                <h3 className="text-sm font-bold text-gray-400 tracking-wide uppercase">Stream Analysis</h3>
                            </div>
                            <div className="flex items-center gap-3">
                                <select
                                    value={previewLimit}
                                    onChange={(e) => setPreviewLimit(Number(e.target.value))}
                                    className="bg-black/40 border border-white/10 rounded-lg py-1.5 px-3 text-[10px] font-bold text-gray-400 outline-none focus:ring-1 focus:ring-purple-500/50 cursor-pointer uppercase tracking-wider"
                                >
                                    <option value={50}>50 Rows</option>
                                    <option value={100}>100 Rows</option>
                                    <option value={500}>500 Rows</option>
                                    <option value={1000000}>Show All</option>
                                </select>
                                <span className="text-[10px] font-bold text-gray-600 bg-white/5 px-2 py-1 rounded border border-white/5">
                                    {preview.total_rows} Records
                                </span>
                            </div>
                        </div>
                        <div className="flex-1 overflow-hidden p-2">
                            <DataGrid
                                columns={preview.columns}
                                data={preview.data}
                                datasetId={selectedId!}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-700 opacity-20">
                        <FlaskConical size={100} className="mb-8" />
                        <div className="text-center space-y-2">
                            <h2 className="text-xl font-black uppercase tracking-[0.8em] text-white/50">Core Engine Idle</h2>
                            <p className="text-[10px] font-bold uppercase tracking-[0.4em]">Select active logic from the registry to inspect telemetry</p>
                        </div>
                    </div>
                )}
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/[0.01] blur-[150px] rounded-full pointer-events-none translate-y-1/2 translate-x-1/2"></div>
            </div>
        </main>
    );
}
