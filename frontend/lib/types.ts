export interface Dataset {
    id: number;
    filename: string;
    source_type: string;
    row_count: number;
    column_count: number;
    size_bytes: number;
    created_at: string;
}