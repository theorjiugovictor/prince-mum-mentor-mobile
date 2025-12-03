"use client";

import { colors, fontFamilies, spacing } from "@/src/core/styles";
import { ms, rfs, vs } from "@/src/core/styles/scaling";
import React from "react";
import {
  Image,
  type ImageSourcePropType,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";

type ImageSource = ImageSourcePropType;

interface CreatePostModalProps {
  visible: boolean;
  title: string;
  content: string;
  image?: ImageSource;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onTitleChange: (text: string) => void;
  onContentChange: (text: string) => void;
  onAddPhoto?: () => void;
}

const avatar = require("@/src/assets/images/profile-image.png");

const CreatePostModal: React.FC<CreatePostModalProps> = ({
  visible,
  title,
  content,
  image,
  isSubmitting,
  onClose,
  onSubmit,
  onTitleChange,
  onContentChange,
  onAddPhoto,
}) => {
  const canSubmit = (content.trim() || title.trim()) && !isSubmitting;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Create Post</Text>
          <TouchableOpacity disabled={!canSubmit} onPress={onSubmit}>
            <Text
              style={[
                styles.modalPostButton,
                !canSubmit && styles.modalPostButtonDisabled,
              ]}
            >
              {isSubmitting ? "Posting..." : "Post"}
            </Text>
          </TouchableOpacity>
        </View>

        <KeyboardAwareScrollView
          style={styles.modalBody}
          contentContainerStyle={{ paddingBottom: vs(40) }}
        >
          <View style={styles.createRow}>
            <Image source={avatar} style={styles.avatar} />
            <Text style={styles.createAuthor}>Posting as You</Text>
          </View>

          <TextInput
            style={styles.textInput}
            value={title}
            onChangeText={onTitleChange}
            placeholder="Title (optional)"
            placeholderTextColor={colors.textGrey2}
          />

          <TextInput
            style={[styles.textInput, { minHeight: 100 }]}
            value={content}
            onChangeText={onContentChange}
            placeholder="Write something..."
            placeholderTextColor={colors.textGrey2}
            multiline
          />

          {image && (
            <Image
              source={image}
              style={styles.selectedImage}
              resizeMode="cover"
            />
          )}
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: colors.backgroundMain,
    paddingVertical: vs(16),
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: ms(spacing.lg),
    paddingVertical: vs(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outlineVariant,
  },
  modalCancel: {
    fontFamily: fontFamilies.regular,
    fontSize: rfs(14),
    color: colors.textGrey2,
  },
  modalTitle: {
    fontFamily: fontFamilies.semiBold,
    fontSize: rfs(16),
    color: colors.textPrimary,
  },
  modalPostButton: {
    fontFamily: fontFamilies.semiBold,
    fontSize: rfs(14),
    color: colors.primary,
  },
  modalPostButtonDisabled: {
    color: colors.textGrey2,
  },
  modalBody: {
    flex: 1,
  },
  createRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: vs(12),
    marginBottom: vs(12),
    paddingHorizontal: ms(spacing.lg),
  },
  avatar: {
    width: ms(32),
    height: ms(32),
    borderRadius: ms(16),
    marginRight: ms(8),
  },
  createAuthor: {
    fontFamily: fontFamilies.medium,
    fontSize: rfs(14),
    color: colors.textPrimary,
  },
  textInput: {
    minHeight: vs(40),
    textAlignVertical: "top",
    fontFamily: fontFamilies.regular,
    fontSize: rfs(14),
    color: colors.textPrimary,
    paddingHorizontal: ms(spacing.lg),
    marginBottom: vs(12),
    borderRadius: ms(8),
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  selectedImage: {
    marginTop: vs(12),
    borderRadius: ms(12),
    width: "100%",
    height: vs(200),
    marginHorizontal: ms(spacing.lg),
  },
});

export default CreatePostModal;
