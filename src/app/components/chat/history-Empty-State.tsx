import {useDebounce} from "@/src/core/hooks/useDebounce";
import {colors, typography} from "@/src/core/styles";
import {rbr, s, vs} from "@/src/core/styles/scaling";
import {showToast} from "@/src/core/utils/toast";
import React, {useCallback, useMemo, useState} from "react";
import {FlatList, Image, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View,} from "react-native";
import {useKeyboardState} from "react-native-keyboard-controller";

/* -------------------------------------------------------------------------- */
/*                                Types                                        */
/* -------------------------------------------------------------------------- */

interface ChatItem {
  id: string;
  title: string;
  created_at: string;
}

interface HistoryEmptyStateProps {
  visible: boolean;
  onClose: () => void;
  onNewChat: () => void;
  chats: ChatItem[];
  onChatPress: (chatId: string) => void;
  onRenameChat: (chatId: string, newTitle: string) => Promise<void>;
  onDeleteChat: (chatId: string) => Promise<void>;
}

type ModalView = "list" | "rename" | "delete" | "success";

/* -------------------------------------------------------------------------- */
/*                        Keyboard-aware Modal Container                       */
/* -------------------------------------------------------------------------- */

const ModalContainer = React.memo(
  ({
    children,
    keyboardHeight,
  }: {
    children: React.ReactNode;
    keyboardHeight: number;
  }) => (
    <TouchableOpacity
      activeOpacity={1}
      style={styles.container}
      onPress={(e) => e.stopPropagation()}
    >
      <View style={styles.dragHandle} />
      {children}
      <View style={{ height: keyboardHeight }} />
    </TouchableOpacity>
  )
);

ModalContainer.displayName = "ModalContainer";

/* -------------------------------------------------------------------------- */
/*                               Utilities                                    */
/* -------------------------------------------------------------------------- */

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
  });
};

/* -------------------------------------------------------------------------- */
/*                            LIST VIEW (Memoized)                             */
/* -------------------------------------------------------------------------- */

const ListView = React.memo(
  ({
    searchQuery,
    setSearchQuery,
    filteredChats,
    onChatPress,
    onClose,
    onNewChat,
    startRenaming,
    startDeleting,
  }: {
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    filteredChats: ChatItem[];
    onChatPress: (id: string) => void;
    onClose: () => void;
    onNewChat: () => void;
    startRenaming: (id: string, title: string) => void;
    startDeleting: (id: string) => void;
  }) => {
    const renderChatItem = useCallback(
      ({ item }: { item: ChatItem }) => (
        <TouchableOpacity
          style={styles.chatItem}
          onPress={() => {
            onChatPress(item.id);
            onClose();
          }}
          activeOpacity={0.7}
        >
          <View style={styles.chatItemRow}>
            <View style={styles.chatTextContainer}>
              <Text style={styles.chatTitle}>{item.title}</Text>
              <Text style={styles.chatDate}>{formatDate(item.created_at)}</Text>
            </View>

            <View style={styles.chatActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={(e) => {
                  e.stopPropagation();
                  startRenaming(item.id, item.title);
                }}
              >
                <Image
                  source={require("../../assets/images/ai-chat/edit-2.png")}
                  style={styles.actionIcon}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={(e) => {
                  e.stopPropagation();
                  startDeleting(item.id);
                }}
              >
                <Image
                  source={require("../../assets/images/ai-chat/delete.png")}
                  style={styles.actionIcon}
                />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      ),
      [onChatPress, onClose, startRenaming, startDeleting]
    );

    return (
      <>
        <View style={styles.searchWrapper}>
          <Image
            source={require("../../assets/images/ai-chat/search-normal.png")}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor={colors.textGrey1}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <TouchableOpacity
          style={styles.newChatButton}
          onPress={() => {
            onNewChat();
            onClose();
          }}
          activeOpacity={0.7}
        >
          <Image
            source={require("../../assets/images/ai-chat/edit.png")}
            style={styles.newChatIcon}
          />
          <Text style={styles.newChatText}>New Chat</Text>
        </TouchableOpacity>

        {filteredChats.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Image
              source={require("../../assets/images/ai-chat/message-remove.png")}
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyText}>
              {searchQuery ? "No chats match your search" : "No recent chats"}
            </Text>
          </View>
        ) : (
          <View style={styles.chatsBlock}>
            <Text style={styles.chatsLabel}>Chats</Text>

            <FlatList
              data={filteredChats}
              keyExtractor={(item) => item.id}
              renderItem={renderChatItem}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}
      </>
    );
  }
);

ListView.displayName = "ListView";

/* -------------------------------------------------------------------------- */
/*                        RENAME VIEW (Memoized)                               */
/* -------------------------------------------------------------------------- */

const RenameView = React.memo(
  ({
    renameTitle,
    setRenameTitle,
    onCancel,
    onSave,
  }: {
    renameTitle: string;
    setRenameTitle: (v: string) => void;
    onCancel: () => void;
    onSave: () => void;
  }) => (
    <>
      <Text style={styles.actionTitle}>Rename Title</Text>
      <Text style={styles.actionSubtitle}>Edit your title name</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Title Name</Text>

        <View style={styles.inputWrapper}>
          <Image
            source={require("../../assets/images/ai-chat/edit-2.png")}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            value={renameTitle}
            onChangeText={setRenameTitle}
            placeholder="Conversation Title"
            placeholderTextColor={colors.textGrey1}
            autoFocus
          />
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.primaryButton} onPress={onSave}>
          <Text style={styles.primaryButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
    </>
  )
);

RenameView.displayName = "RenameView";

/* -------------------------------------------------------------------------- */
/*                        DELETE VIEW (Memoized)                               */
/* -------------------------------------------------------------------------- */

const DeleteView = React.memo(
  ({
    onConfirm,
    onCancel,
  }: {
    onConfirm: () => void;
    onCancel: () => void;
  }) => (
    <>
      <Text style={styles.actionTitle}>Delete Conversation?</Text>
      <Text style={styles.actionSubtitle}>
        This will permanently delete this conversation. This action cannot be
        undone.
      </Text>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.deleteButton} onPress={onConfirm}>
          <Text style={styles.primaryButtonText}>Delete</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </>
  )
);

DeleteView.displayName = "DeleteView";
/* -------------------------------------------------------------------------- */
/*                        SUCCESS VIEW (Memoized)                              */
/* -------------------------------------------------------------------------- */

const SuccessView = React.memo(({ onDone }: { onDone: () => void }) => (
  <View style={styles.successWrapper}>
    <View style={styles.successIconBox}>
      <Image
        source={require("../../../assets/images/success-icon.png")}
        style={styles.successIcon}
      />
    </View>

    <Text style={styles.successTitle}>Conversation deleted successfully</Text>

    <TouchableOpacity style={styles.primaryButton} onPress={onDone}>
      <Text style={styles.primaryButtonText}>Done</Text>
    </TouchableOpacity>
  </View>
));
SuccessView.displayName = "SuccessView";

/* -------------------------------------------------------------------------- */
/*                               MAIN COMPONENT                                */
/* -------------------------------------------------------------------------- */

export const HistoryEmptyState = ({
  visible,
  onClose,
  onNewChat,
  chats,
  onChatPress,
  onRenameChat,
  onDeleteChat,
}: HistoryEmptyStateProps) => {
  /* Search --------------------------------------------------------- */
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery);

  /* Modal View ----------------------------------------------------- */
  const [currentView, setCurrentView] = useState<ModalView>("list");
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  /* Rename ---------------------------------------------------------- */
  const [renameTitle, setRenameTitle] = useState("");

  const keyboard = useKeyboardState();

  /* Derived Chats --------------------------------------------------- */
  const filteredChats = useMemo(() => {
    return [...chats]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .filter((chat) =>
          chat.title?.toLowerCase().includes(debouncedSearch?.toLowerCase())
      );
  }, [chats, debouncedSearch]);

  /* Actions --------------------------------------------------------- */

  const startRenaming = useCallback((id: string, title: string) => {
    setSelectedChatId(id);
    setRenameTitle(title);
    setCurrentView("rename");
  }, []);

  const startDeleting = useCallback((id: string) => {
    setSelectedChatId(id);
    setCurrentView("delete");
  }, []);

  const cancelAction = useCallback(() => {
    setCurrentView("list");
    setSelectedChatId(null);
    setRenameTitle("");
  }, []);

  const saveRename = useCallback(async () => {
    try {
      if (selectedChatId) {
        await onRenameChat(selectedChatId, renameTitle.trim());
        cancelAction();
      }
    } catch (err) {
      showToast.error("Error", "Failed to rename chat");
    }
  }, [selectedChatId, renameTitle, onRenameChat, cancelAction]);

  const confirmDelete = useCallback(async () => {
    if (!selectedChatId) return;

    try {
      await onDeleteChat(selectedChatId);
      setCurrentView("success");

      setTimeout(() => {
        setCurrentView("list");
        setSelectedChatId(null);
      }, 2000);
    } catch {
      showToast.error("Error", "Failed to delete chat");
      cancelAction();
    }
  }, [selectedChatId, onDeleteChat, cancelAction]);

  /* Render ---------------------------------------------------------- */

  const renderScreen = () => {
    switch (currentView) {
      case "rename":
        return (
          <RenameView
            renameTitle={renameTitle}
            setRenameTitle={setRenameTitle}
            onCancel={cancelAction}
            onSave={saveRename}
          />
        );

      case "delete":
        return <DeleteView onCancel={cancelAction} onConfirm={confirmDelete} />;

      case "success":
        return <SuccessView onDone={cancelAction} />;

      default:
        return (
          <ListView
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filteredChats={filteredChats}
            onChatPress={onChatPress}
            onClose={onClose}
            onNewChat={onNewChat}
            startRenaming={startRenaming}
            startDeleting={startDeleting}
          />
        );
    }
  };

  /* Modal ----------------------------------------------------------- */

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} onPress={onClose}>
        <ModalContainer keyboardHeight={keyboard.height}>
          {renderScreen()}
        </ModalContainer>
      </TouchableOpacity>
    </Modal>
  );
};

/* -------------------------------------------------------------------------- */
/*                                  STYLES                                     */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: colors.textWhite,
    borderTopLeftRadius: rbr(24),
    borderTopRightRadius: rbr(24),
    paddingTop: vs(12),
    paddingHorizontal: s(20),
    paddingBottom: vs(40),
  },
  dragHandle: {
    width: s(40),
    height: vs(4),
    backgroundColor: colors.outlineVariant,
    borderRadius: rbr(2),
    alignSelf: "center",
    marginBottom: vs(20),
  },

  /* List */
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: rbr(12),
    paddingHorizontal: s(16),
    paddingVertical: vs(12),
    borderWidth: 1,
    borderColor: "#D5D5D5",
    marginBottom: vs(8),
  },
  searchIcon: {
    width: s(20),
    height: s(20),
    marginRight: s(10),
  },
  searchInput: {
    flex: 1,
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  newChatButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: vs(16),
    borderBottomWidth: 1,
    borderBottomColor: colors.disabledBorder,
    marginBottom: vs(8),
  },
  newChatIcon: {
    width: s(20),
    height: s(20),
    marginRight: s(12),
  },
  newChatText: {
    ...typography.labelLarge,
    color: colors.textPrimary,
  },
  emptyContainer: {
    paddingVertical: vs(32),
    flexDirection: "row",
    alignItems: "center",
  },
  emptyIcon: {
    width: s(20),
    height: s(20),
    opacity: 0.5,
    marginRight: s(12),
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.textGrey1,
  },
  chatsBlock: {
    marginTop: vs(8),
    maxHeight: vs(300),
  },
  chatsLabel: {
    ...typography.labelMedium,
    color: colors.textGrey1,
    marginBottom: vs(12),
  },
  chatItem: {
    paddingVertical: vs(12),
    borderBottomWidth: 1,
    borderBottomColor: colors.disabledBorder,
  },
  chatItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  chatTextContainer: { flex: 1 },
  chatTitle: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    marginBottom: vs(2),
  },
  chatDate: {
    ...typography.bodySmall,
    color: colors.textGrey1,
    fontSize: s(12),
  },
  chatActions: {
    flexDirection: "row",
    gap: s(8),
  },
  actionButton: {
    padding: s(4),
  },
  actionIcon: {
    width: s(20),
    height: s(20),
  },

  /* Rename / Delete / Success */
  actionTitle: {
    ...typography.heading3,
    textAlign: "center",
    marginBottom: vs(8),
    color: colors.textPrimary,
  },
  actionSubtitle: {
    ...typography.bodyMedium,
    textAlign: "center",
    color: colors.textGrey1,
    marginBottom: vs(32),
    lineHeight: vs(20),
  },
  inputContainer: {
    marginBottom: vs(32),
  },
  inputLabel: {
    ...typography.labelMedium,
    marginBottom: vs(12),
    color: colors.textPrimary,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.backgroundMain,
    borderRadius: rbr(12),
    paddingHorizontal: s(16),
    borderWidth: 1.5,
    borderColor: colors.textSecondary,
  },
  inputIcon: {
    width: s(20),
    height: s(20),
    marginRight: s(12),
  },
  input: {
    flex: 1,
    paddingVertical: vs(14),
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },

  actionButtons: {
    gap: vs(16),
  },
  primaryButton: {
    paddingVertical: vs(16),
    borderRadius: rbr(14),
    backgroundColor: colors.primary,
    alignItems: "center",
  },
  primaryButtonText: {
    ...typography.buttonText,
    color: colors.textWhite,
  },
  cancelButton: {
    paddingVertical: vs(16),
    borderRadius: rbr(14),
    backgroundColor: colors.textWhite,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
  },
  cancelButtonText: {
    ...typography.buttonText,
    color: colors.textPrimary,
  },
  deleteButton: {
    paddingVertical: vs(16),
    borderRadius: rbr(14),
    backgroundColor: "#E53E3E",
    alignItems: "center",
  },

  /* Success */
  successWrapper: {
    alignItems: "center",
    paddingVertical: vs(24),
  },
  successIconBox: {
    width: s(80),
    height: s(80),
    borderRadius: rbr(40),
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: vs(24),
  },
  successIcon: {
    width: s(40),
    height: s(40),
    tintColor: "#10B981",
  },
  successTitle: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: vs(32),
  },
});
