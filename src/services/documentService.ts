import instance from "./instance";
import type {
    DocumentResponse,
    DocumentListResponse,
    DocumentChunksResponse,
    BatchUploadResponse,
    HealthCheckResponse,
    UploadOptions,
} from "../types/type.ts";

const DocumentService = {
    upload: async (file: File, options: UploadOptions = {}): Promise<DocumentResponse> => {
        const formData = new FormData();
        formData.append("file", file);
        if (options.chunk_size !== undefined) formData.append("chunk_size", String(options.chunk_size));
        if (options.chunk_overlap !== undefined) formData.append("chunk_overlap", String(options.chunk_overlap));

        const {data} = await instance.post<DocumentResponse>("/documents/upload", formData, {
            headers: {"Content-Type": "multipart/form-data"},
            silent: true,
        });
        return data;
    },

    uploadBatch: async (files: File[], options: UploadOptions = {}): Promise<BatchUploadResponse> => {
        const formData = new FormData();
        files.forEach((file) => formData.append("files", file));
        if (options.chunk_size !== undefined) formData.append("chunk_size", String(options.chunk_size));
        if (options.chunk_overlap !== undefined) formData.append("chunk_overlap", String(options.chunk_overlap));

        const {data} = await instance.post<BatchUploadResponse>("/documents/upload/batch", formData, {
            headers: {"Content-Type": "multipart/form-data"},
        });
        return data;
    },

    list: async (): Promise<DocumentListResponse> => {
        const {data} = await instance.get<DocumentListResponse>("/documents", {silent: true});
        return data;
    },

    getById: async (documentId: string): Promise<DocumentResponse> => {
        const {data} = await instance.get<DocumentResponse>(`/documents/${documentId}`);
        return data;
    },

    delete: async (documentId: string): Promise<void> => {
        await instance.delete(`/documents/${documentId}`, {silent: true});
    },

    getChunks: async (documentId: string): Promise<DocumentChunksResponse> => {
        const {data} = await instance.get<DocumentChunksResponse>(`/documents/${documentId}/chunks`);
        return data;
    },

    healthCheck: async (): Promise<HealthCheckResponse> => {
        const {data} = await instance.get<HealthCheckResponse>("/documents/health/check");
        return data;
    },
};

export default DocumentService;