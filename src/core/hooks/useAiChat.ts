import { auth } from "@/src/lib/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetch } from "expo/fetch";
import { authApi } from "../../lib/api";

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  user_id: string;
}

interface ChatData {
  conversations: ChatSession[];
  pagination: {
    next: number | null;
    page: number;
    per_page: number;
    prev: number | null;
    total_count: number;
    total_pages: number;
  };
}

interface ApiMessage {
  id: string;
  sender: "user" | "ai";
  message: string;
  created_at: string;
}

interface ApiChatResponse {
  conversation: ChatSession;
  messages: ApiMessage[];
  pagination: {
    page: number;
    per_page: number;
    total_count: number;
    total_pages: number;
    next: number | null;
    prev: number | null;
  };
}

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
  link?: { url: string; title: string };
}

interface SendMessageParams {
  session_id: string;
  message: string;
  onChunk?: (chunk: string) => void;
  onComplete?: (messageId: string) => void;
  abortSignal?: AbortSignal;
}

const CHAT_KEYS = {
  all: ["ai-chats"] as const,
  session: (id: string) => ["ai-chats", id] as const,
};

export const useChatList = () => {
  return useQuery({
    queryKey: CHAT_KEYS.all,
    queryFn: async () => {
      const res = await authApi.get("/api/v1/ai-chat/chats/");
      return res.data.data as ChatData;
    },
  });
};

export const useCreateChat = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await authApi.post("/api/v1/ai-chat/chats/");
      return res.data.data as ChatSession;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CHAT_KEYS.all });
    },
  });
};

export const useChatMessages = (sessionId?: string) => {
  return useQuery({
    queryKey: CHAT_KEYS.session(sessionId || ""),
    queryFn: async () => {
      if (!sessionId) return { messages: [] };

      const res = await authApi.get(`/api/v1/ai-chat/chats/${sessionId}`);
      const data = res.data.data as ApiChatResponse;

      const transformedMessages: Message[] = data.messages.map((msg) => ({
        id: msg.id,
        text: msg.message,
        isUser: msg.sender === "user",
        timestamp: msg.created_at,
      }));

      return {
        conversation: data.conversation,
        messages: transformedMessages,
        pagination: data.pagination,
      };
    },
    enabled: !!sessionId,
  });
};

export const useSendAiMessage = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      session_id,
      message,
      onChunk,
      onComplete,
      abortSignal,
    }: SendMessageParams) => {
      const baseURL = authApi.defaults.baseURL || "";
      const token = await auth.getAccessToken();

      const response = await fetch(
        `${baseURL}/api/v1/ai-chat/chats/${session_id}/message`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message }),
          signal: abortSignal, // Add abort signal here
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let messageId = "";

      if (!reader) {
        throw new Error("No response body");
      }

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.type === "start") {
                  messageId = data.message_id;
                } else if (data.type === "chunk" && onChunk) {
                  onChunk(data.content);
                } else if (data.type === "done") {
                  messageId = data.message_id;
                  if (onComplete) {
                    onComplete(messageId);
                  }
                }
              } catch (e) {
                console.error("❌ Failed to parse SSE data:", e, "Line:", line);
              }
            }
          }
        }
      } catch (error: any) {
        // Handle abort differently from other errors
        if (error.name === "AbortError") {
          console.log("Stream aborted by user");
          // Still call onComplete if we have a messageId
          if (messageId && onComplete) {
            onComplete(messageId);
          }
          throw error; // Re-throw to let mutation know it was aborted
        }
        throw error;
      } finally {
        reader.releaseLock();
      }

      return { messageId };
    },
    onMutate: async ({ session_id, message }) => {
      await qc.cancelQueries({ queryKey: CHAT_KEYS.session(session_id) });
      const previousMessages = qc.getQueryData(CHAT_KEYS.session(session_id));

      qc.setQueryData(CHAT_KEYS.session(session_id), (old: any) => {
        if (!old) return old;

        const newUserMessage: Message = {
          id: `temp-${Date.now()}`,
          text: message,
          isUser: true,
          timestamp: new Date().toISOString(),
        };

        return {
          ...old,
          messages: [...(old.messages || []), newUserMessage],
        };
      });

      return { previousMessages };
    },
    onError: (err: any, { session_id }, context) => {
      // Don't show error for user-initiated abort
      if (err?.name !== "AbortError") {
        console.error("❌ Mutation error:", err);
      }
      if (context?.previousMessages) {
        qc.setQueryData(
          CHAT_KEYS.session(session_id),
          context.previousMessages
        );
      }
    },
    onSettled: (_, __, { session_id }) => {
      qc.invalidateQueries({ queryKey: CHAT_KEYS.session(session_id) });
      qc.invalidateQueries({ queryKey: CHAT_KEYS.all });
    },
  });
};

export const useDeleteConversation = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (conversation_id: string) => {
      try {
        const res = await authApi.delete(
          `/api/v1/ai-chat/chats/${conversation_id}`
        );

        if (res.status < 200 || res.status >= 300) {
          throw new Error(`Delete failed with status ${res.status}`);
        }

        if (res.data?.success === false) {
          throw new Error(res.data?.message || "Delete failed");
        }

        return res.data;
      } catch (err: any) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Unable to delete conversation";

        throw new Error(message);
      }
    },

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CHAT_KEYS.all });
    },
  });
};

export const useRenameConversation = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversation_id,
      newTitle,
    }: {
      conversation_id: string;
      newTitle: string;
    }) => {
      const res = await authApi.patch(
        `/api/v1/ai-chat/chats/${conversation_id}/title`,
        { title: newTitle }
      );
      return res.data;
    },
    onSuccess: (_, { conversation_id }) => {
      qc.invalidateQueries({ queryKey: CHAT_KEYS.all });
      qc.invalidateQueries({ queryKey: CHAT_KEYS.session(conversation_id) });
    },
  });
};
