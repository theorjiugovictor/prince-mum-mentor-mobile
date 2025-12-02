import { getCurrentUser } from "@/src/core/services/userService";
import { colors } from "@/src/core/styles";
import { rfs, s, vs } from "@/src/core/styles/scaling";
import { showToast } from "@/src/core/utils/toast";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useChatList,
  useChatMessages,
  useCreateChat,
  useDeleteConversation,
  useRenameConversation,
  useSendAiMessage,
} from "../../core/hooks/useAiChat";
import { ChatInput } from "../components/chat/chat-Input";
import { ChatMessage } from "../components/chat/chat-Message";
import { ChatWelcome } from "../components/chat/chat-Welcome";
import { HistoryEmptyState } from "../components/chat/history-Empty-State";
import { TypingIndicator } from "../components/chat/typing-Indicator";

export interface ChatInterface {
  id: string;
  title: string;
  created_at: string;
  user_id: string;
}

export interface StreamingMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
  isStreaming?: boolean;
}

export default function ChatScreen() {
  const [currentView, setCurrentView] = useState<"welcome" | "chat">("welcome");
  const { data: chats } = useChatList();
  const [currentChat, setCurrentChat] = useState<ChatInterface | null>(null);
  const [inputText, setInputText] = useState("");
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [showHistoryEmpty, setShowHistoryEmpty] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [user, setUser] = useState<any>(null);

  const flatListRef = useRef<FlatList>(null);
  const hasReceivedChunkRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const createChat = useCreateChat();
  const sendMessage = useSendAiMessage();
  const deleteConversation = useDeleteConversation();
  const renameConversation = useRenameConversation();
  const { data: chatMessages } = useChatMessages(currentChat?.id);

  const loadUser = useCallback(async () => {
    setIsLoadingUser(true);
    try {
      const response = await getCurrentUser();
      setUser(response || null);
    } catch (error) {
      console.log("User fetch error:", error);
    } finally {
      setIsLoadingUser(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (
      chatMessages?.conversation &&
      currentChat?.id === chatMessages.conversation.id
    ) {
      setCurrentChat(chatMessages.conversation);
    }
  }, [chatMessages?.conversation, currentChat?.id]);

  const displayMessages: StreamingMessage[] = [
    ...(chatMessages?.messages || []),
    ...(streamingText
      ? [
          {
            id: "streaming",
            text: streamingText,
            isUser: false,
            timestamp: new Date().toISOString(),
            isStreaming: true,
          },
        ]
      : []),
  ];

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsAiSpeaking(false);
      // Keep the streaming text that was already received
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || isAiSpeaking) return;

    const userMessage = inputText.trim();
    setInputText("");
    setIsAiSpeaking(true);
    setStreamingText("");

    hasReceivedChunkRef.current = false;

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      let chatId = currentChat?.id;

      if (!chatId) {
        const newChat = await createChat.mutateAsync();
        chatId = newChat.id;
        setCurrentChat(newChat);
      }

      await sendMessage.mutateAsync({
        session_id: chatId!,
        message: userMessage,
        abortSignal: abortControllerRef.current.signal,
        onChunk: (chunk: string) => {
          hasReceivedChunkRef.current = true;
          setStreamingText((prev) => prev + chunk);
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        },
        onComplete: () => {
          setStreamingText("");
          flatListRef.current?.scrollToEnd({ animated: true });
        },
      });
    } catch (error: any) {
      if (error?.name === "AbortError") {
        console.log("Request was aborted by user");
        // Don't show error toast for user-initiated stops
      } else {
        console.error(error);
      }
    } finally {
      setIsAiSpeaking(false);
      abortControllerRef.current = null;
    }
  };

  const handleCategoryPress = async (category: string) => {
    setInputText(category);
    setCurrentView("chat");

    if (!currentChat) {
      try {
        const newChat = await createChat.mutateAsync();
        setCurrentChat(newChat);
      } catch {
        showToast.error("Error", "Failed to start chat");
      }
    }
  };

  const handleNewChat = () => {
    setCurrentChat(null);
    setCurrentView("chat");
    setInputText("");
    setStreamingText("");
  };

  const handleAskAnything = () => {
    setShowHistoryEmpty(true);
  };

  const handleChatPress = (chatId: string) => {
    const chat = chats?.conversations.find((c) => c.id === chatId);
    if (chat) {
      setCurrentChat(chat);
      setCurrentView("chat");
      setStreamingText("");
    }
  };

  const handleRenameChat = async (chatId: string, newTitle: string) => {
    try {
      await renameConversation.mutateAsync({
        conversation_id: chatId,
        newTitle,
      });

      if (currentChat?.id === chatId) {
        setCurrentChat((prev) => (prev ? { ...prev, title: newTitle } : null));
      }

      showToast.success("Success", "Chat renamed successfully");
    } catch (error) {
      showToast.error("Error", "Failed to rename chat");
      console.error(error);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      await deleteConversation.mutateAsync(chatId);

      if (currentChat?.id === chatId) {
        setCurrentChat(null);
        setCurrentView("welcome");
      }
    } catch (error) {
      showToast.error("Error", "Failed to delete chat");
      console.error(error);
      throw error;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <SafeAreaView style={styles.header}>
        <TouchableOpacity
          onPress={() =>
            currentView === "welcome"
              ? router.back()
              : setCurrentView("welcome")
          }
          style={styles.backTouchable}
        >
          <Image
            source={require("../assets/images/ai-chat/Line-arrow-left.png")}
            style={styles.backButton}
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {currentView === "welcome"
            ? "NORA"
            : currentChat?.title || "New Chat"}
        </Text>

        <TouchableOpacity onPress={() => setShowHistoryEmpty(true)}>
          <Image
            source={require("../assets/images/ai-chat/menu.png")}
            style={styles.menuButton}
          />
        </TouchableOpacity>
      </SafeAreaView>

      <HistoryEmptyState
        visible={showHistoryEmpty}
        onClose={() => setShowHistoryEmpty(false)}
        onNewChat={handleNewChat}
        chats={chats?.conversations || []}
        onChatPress={handleChatPress}
        onRenameChat={handleRenameChat}
        onDeleteChat={handleDeleteChat}
      />

      {currentView === "welcome" && (
        <ChatWelcome
          userName={
            isLoadingUser ? "" : user?.full_name?.split(" ")[0] || "User"
          }
          onCategoryPress={handleCategoryPress}
          onAskAnything={handleAskAnything}
        />
      )}

      {currentView === "chat" && (
        <>
          <FlatList
            ref={flatListRef}
            data={displayMessages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ChatMessage
                message={item.text}
                isUser={item.isUser}
                link={item.link}
              />
            )}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }}
          />

          {isAiSpeaking && !streamingText && (
            <TypingIndicator isAiSpeaking={true} />
          )}

          <ChatInput
            value={inputText}
            onChangeText={setInputText}
            onSend={handleSend}
            onStop={handleStop}
            isAiSpeaking={isAiSpeaking}
          />
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.textWhite,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: s(8),
    paddingVertical: vs(12),
  },
  backTouchable: {
    paddingHorizontal: s(8),
    paddingVertical: vs(4),
  },
  backButton: {
    width: s(24),
    height: s(24),
  },
  headerTitle: {
    flex: 1,
    fontSize: rfs(18),
    fontWeight: "600",
    color: colors.textPrimary,
    textAlign: "left",
    marginLeft: s(8),
  },
  menuButton: {
    width: s(24),
    height: s(24),
  },
  messagesList: {
    paddingVertical: vs(16),
  },
});
