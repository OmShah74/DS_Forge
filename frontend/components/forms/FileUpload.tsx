"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { UploadCloud, Loader2 } from "lucide-react";

interface FileUploadProps {
    onUploadSuccess: () => void;
}

export default function FileUpload({ onUploadSuccess }: FileUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        setIsUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            await api.post("/datasets/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            onUploadSuccess();
        } catch (err: any) {
            setError(err.response?.data?.detail || "Upload failed");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {isUploading ? (
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    ) : (
                        <>
                            <UploadCloud className="w-8 h-8 mb-3 text-gray-400" />
                            <p className="mb-2 text-sm text-gray-400">
                                <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-gray-500">CSV, JSON, XLSX</p>
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
            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        </div>
    );
}