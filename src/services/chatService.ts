import type {
    ChatMessageCreateRequest,
    ChatMessageListResponse,
    ChatMessageResponse,
    ChatSessionCreateRequest,
    ChatSessionResponse,
    MessageResponse,
} from "@/types/type.ts";
import instance from "./instance";

const ChatService = {
    createSession: async (payload?: ChatSessionCreateRequest): Promise<ChatSessionResponse> => {
        const { data } = await instance.post<ChatSessionResponse>("/chat/sessions", payload, { silent: true });
        return data;
    },

    listSessionMessages: async (
        sessionId: string,
        params?: { limit?: number; cursor?: string | null },
    ): Promise<ChatMessageListResponse> => {
        const queryParams =
            params &&
            (params.limit !== undefined ||
                (params.cursor !== undefined && params.cursor !== null))
                ? {
                      params: {
                          ...(params.limit !== undefined ? { limit: params.limit } : {}),
                          ...(params.cursor !== undefined && params.cursor !== null
                              ? { cursor: params.cursor }
                              : {}),
                      },
                  }
                : undefined;

        const { data } = await instance.get<ChatMessageListResponse>(
            `/chat/sessions/${sessionId}/messages`,
            { ...queryParams, silent: true },
        );
        return data;
    },

    sendSessionMessage: async (
        sessionId: string,
        payload: ChatMessageCreateRequest,
    ): Promise<ChatMessageResponse> => {
        const { data } = await instance.post<ChatMessageResponse>(
            `/chat/sessions/${sessionId}/messages`,
            payload,
            { silent: true },
        );
        return data;
    },

    deleteSession: async (sessionId: string): Promise<MessageResponse> => {
        const { data } = await instance.delete<MessageResponse>(`/chat/sessions/${sessionId}`, { silent: true });
        return data;
    },
};

export default ChatService;
