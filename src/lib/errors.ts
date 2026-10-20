import type { AxiosError } from "axios"

// Surface backend messages such as "usage limit reached" instead of a generic failure
export const getErrorMessage = (error: unknown, fallback: string): string => {
    const detail = (error as AxiosError<{ detail?: unknown }> | undefined)?.response?.data?.detail
    return typeof detail === "string" && detail ? detail : fallback
}
