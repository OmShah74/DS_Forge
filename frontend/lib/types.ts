export interface Dataset {
    id: number;
    filename: string;
    source_type: string;
    row_count: number;
    column_count: number;
    size_bytes: number;
    created_at: string;
}
export interface ModelOption {
    key: string;
    name: string;
    type: string;
    default_params: Record<string, any>;
}

export interface TrainingRun {
    id: number;
    model_name: string;
    status: "pending" | "running" | "completed" | "failed";
    metrics: Record<string, number> | null;
    error_message: string | null;
    created_at: string;
}