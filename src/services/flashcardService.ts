import instance from "./instance";
import type {
    FlashcardGenerateRequest,
    FlashcardGenerateResponse,
    FlashcardListResponse,
} from "@/types/type.ts";

const FlashcardService = {
    generate: async (payload: FlashcardGenerateRequest): Promise<FlashcardGenerateResponse> => {
        const { data } = await instance.post<FlashcardGenerateResponse>("/flashcards/generate", payload, { silent: true });
        return data;
    },

    list: async (limit?: number): Promise<FlashcardListResponse> => {
        const { data } = await instance.get<FlashcardListResponse>("/flashcards", {
            params: limit !== undefined ? { limit } : undefined,
            silent: true,
        });
        return data;
    },
};

export default FlashcardService;
