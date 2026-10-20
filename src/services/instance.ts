import axios, { type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios";
import { toast } from "sonner";
import type {RefreshTokenResponse} from "@/types/type.ts";

const API_PREFIX = (import.meta.env.VITE_API_PREFIX || "/api").trim();
const NORMALIZED_API_PREFIX = API_PREFIX.startsWith("/") ? API_PREFIX : `/${API_PREFIX}`;
const RAW_API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").trim().replace(/\/+$/, "");
const API_BASE_URL = import.meta.env.DEV
    ? NORMALIZED_API_PREFIX
    : RAW_API_BASE_URL
        ? `${RAW_API_BASE_URL}${NORMALIZED_API_PREFIX}`
        : NORMALIZED_API_PREFIX;

const instance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
});

// Request interceptor - Add token to requests
instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: unknown) => {
        toast.error("Request failed. Please try again.");
        return Promise.reject(error);
    }
);

// Token refresh queue management
let isRefreshing = false;

interface QueueEntry {
    resolve: (token: string) => void;
    reject: (error: unknown) => void;
}

let failedQueue: QueueEntry[] = [];

const processQueue = (error: unknown, token: string | null = null): void => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token!);
        }
    });
    failedQueue = [];
};

declare module "axios" {
    interface AxiosRequestConfig {
        // Set when the caller shows its own inline error, so the global toast doesn't duplicate it
        silent?: boolean;
    }
}

// Extend AxiosRequestConfig to support retry flag
interface RetryableRequestConfig extends AxiosRequestConfig {
    _retry?: boolean;
}

// Extract a readable message from error responses
const getErrorMessage = (err: {
    response?: { status: number; data?: { detail?: string; message?: string } };
}): string => {
    const detail = err.response?.data?.detail;
    const message = err.response?.data?.message;

    if (typeof detail === "string") return detail;
    if (typeof message === "string") return message;

    switch (err.response?.status) {
        case 400: return "Bad request. Please check your input.";
        case 403: return "You don't have permission to perform this action.";
        case 404: return "The requested resource was not found.";
        case 409: return "A conflict occurred. Please try again.";
        case 422: return "Validation failed. Please check your input.";
        case 429: return "Too many requests. Please slow down.";
        case 500: return "Server error. Please try again later.";
        case 503: return "Service unavailable. Please try again later.";
        default:  return "An unexpected error occurred.";
    }
};

// Response interceptor - Handle token refresh
instance.interceptors.response.use(
    (res) => res,
    async (err: {
        response?: { status: number; data?: { detail?: string; message?: string } };
        config: InternalAxiosRequestConfig & RetryableRequestConfig;
    }) => {
        const originalRequest = err.config;

        // Handle 401 errors (unauthorized)
        if (
            err.response &&
            err.response.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url?.includes("/auth/login") &&
            !originalRequest.url?.includes("/auth/refresh")
        ) {
            originalRequest._retry = true;

            // If already refreshing, queue this request
            if (isRefreshing) {
                return new Promise<string>(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers!.Authorization = "Bearer " + token;
                        return instance(originalRequest);
                    })
                    .catch((e: unknown) => Promise.reject(e));
            }

            isRefreshing = true;
            const refresh = localStorage.getItem("refresh_token");

            if (!refresh) {
                isRefreshing = false;
                localStorage.removeItem("access_token");
                localStorage.removeItem("refresh_token");
                toast.error("Session expired. Please log in again.");
                window.location.href = "/login";
                return Promise.reject(err);
            }

            try {
                const resp = await axios.post<RefreshTokenResponse>(
                    `${API_BASE_URL}/auth/refresh`,
                    { refresh_token: refresh }
                );

                const newAccess = resp.data.id_token;

                localStorage.setItem("access_token", newAccess);
                if (resp.data.refresh_token) {
                    localStorage.setItem("refresh_token", resp.data.refresh_token);
                }

                instance.defaults.headers.common.Authorization = "Bearer " + newAccess;
                processQueue(null, newAccess);
                isRefreshing = false;

                originalRequest.headers!.Authorization = "Bearer " + newAccess;
                return instance(originalRequest);

            } catch (refreshError: unknown) {
                processQueue(refreshError, null);
                isRefreshing = false;

                localStorage.removeItem("access_token");
                localStorage.removeItem("refresh_token");
                toast.error("Session expired. Please log in again.");
                window.location.href = "/login";

                return Promise.reject(refreshError);
            }
        }

        // Show error toast for all non-401 errors (and 401 on login/refresh)
        if (originalRequest?.silent) {
            return Promise.reject(err);
        }
        if (err.response) {
            toast.error(getErrorMessage(err));
        } else {
            // Network error / no response
            toast.error("Network error. Please check your connection.");
        }

        return Promise.reject(err);
    }
);

export default instance;
