import type {
    MessageResponse,
    QuizAttemptRequest,
    QuizAttemptResponse,
    QuizDetail,
    QuizGenerateRequest,
    QuizListResponse,
} from "@/types/type.ts";
import instance from "./instance";

const QuizService = {
    generate: async (payload: QuizGenerateRequest): Promise<QuizDetail> => {
        const { data } = await instance.post<QuizDetail>("/quizzes/generate", payload, { silent: true });
        return data;
    },

    list: async (limit?: number): Promise<QuizListResponse> => {
        const { data } = await instance.get<QuizListResponse>("/quizzes", {
            params: limit !== undefined ? { limit } : undefined,
            silent: true,
        });
        return data;
    },

    get: async (quizId: string): Promise<QuizDetail> => {
        const { data } = await instance.get<QuizDetail>(`/quizzes/${quizId}`, { silent: true });
        return data;
    },

    submitAttempt: async (quizId: string, payload: QuizAttemptRequest): Promise<QuizAttemptResponse> => {
        const { data } = await instance.post<QuizAttemptResponse>(`/quizzes/${quizId}/attempts`, payload, { silent: true });
        return data;
    },

    remove: async (quizId: string): Promise<MessageResponse> => {
        const { data } = await instance.delete<MessageResponse>(`/quizzes/${quizId}`, { silent: true });
        return data;
    },
};

export default QuizService;
