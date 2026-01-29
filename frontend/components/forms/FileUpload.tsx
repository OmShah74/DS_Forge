"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { UploadCloud, Loader2, CheckCircle2 } from "lucide-react";

interface FileUploadProps {
    onUploadSuccess: () => void;
}

export default function FileUpload({ onUploadSuccess }: FileUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        setIsUploading(true);
        setError(null);
        setIsSuccess(false);

        const formData = new FormData();
        formData.append("file", file);

        try {
            await api.post("/datasets/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setIsSuccess(true);
            setTimeout(() => {
                onUploadSuccess();
                setIsSuccess(false);
            }, 1000);
        } catch (err: any) {
            setError(err.response?.data?.detail || "Upload failed");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="w-full">
            <label className={`
                flex flex-col items-center justify-center w-full h-40 
                border-2 border-dashed rounded-2xl cursor-pointer 
                transition-all duration-300
                ${isUploading ? 'bg-blue-500/5 border-blue-500/30' :
                    isSuccess ? 'bg-emerald-500/5 border-emerald-500/30' :
                        'bg-white/5 border-white/10 hover:bg-white/10 hover:border-blue-500/30'}
            `}>
                <div className="flex flex-col items-center justify-center p-6 text-center">
                    {isUploading ? (
                        <>
                            <Loader2 className="w-10 h-10 mb-3 text-blue-500 animate-spin" />
                            <p className="text-sm font-bold text-blue-400 uppercase tracking-widest">Uploading Core...</p>
                        </>
                    ) : isSuccess ? (
                        <>
                            <CheckCircle2 className="w-10 h-10 mb-3 text-emerald-500 animate-bounce" />
                            <p className="text-sm font-bold text-emerald-400 uppercase tracking-widest">Sync Complete</p>
                        </>
                    ) : (
                        <>
                            <UploadCloud className="w-10 h-10 mb-3 text-gray-500 group-hover:text-blue-400 transition-colors" />
                            <p className="mb-1 text-sm font-bold text-gray-300">
                                Click to upload <span className="text-blue-500">or drag-drop</span>
                            </p>
                            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-tighter">CSV, JSON, XLSX supported</p>
                        </>
                    )}
                </div>
                <input
                    type="file"
                    className="hidden"
                    accept=".csv,.json,.xlsx"
                    onChange={handleFileChange}
                    disabled={isUploading}
                />
            </label>
            {error && <p className="mt-3 text-[10px] font-bold text-rose-500 uppercase tracking-widest bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">{error}</p>}
        </div>
    );
}
