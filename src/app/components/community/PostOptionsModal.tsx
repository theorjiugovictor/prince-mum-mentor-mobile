"use client";

import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, fontFamilies, spacing } from "@/src/core/styles";
import { ms, rfs, vs } from "@/src/core/styles/scaling";

interface PostOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const PostOptionsModal: React.FC<PostOptionsModalProps> = ({
  visible,
  onClose,
  onEdit,
  onDelete,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.bottomSheetOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Post options</Text>

          <TouchableOpacity style={styles.sheetButton} onPress={onEdit}>
            <Text style={styles.sheetButtonText}>Edit Post</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sheetButton, styles.sheetButtonDestructive]}
            onPress={onDelete}
          >
            <Text
              style={[styles.sheetButtonText, styles.sheetButtonTextDanger]}
            >
              Delete Post
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sheetCancel} onPress={onClose}>
            <Text style={styles.sheetCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  bottomSheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  bottomSheet: {
    backgroundColor: colors.textWhite,
    borderTopLeftRadius: ms(20),
    borderTopRightRadius: ms(20),
    paddingHorizontal: ms(spacing.lg),
    paddingTop: vs(16),
    paddingBottom: vs(30),
  },
  sheetHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.outlineVariant,
    marginBottom: vs(12),
  },
  sheetTitle: {
    fontFamily: fontFamilies.medium,
    fontSize: rfs(14),
    color: colors.textPrimary,
    marginBottom: vs(12),
  },
  sheetButton: {
    paddingVertical: vs(12),
  },
  sheetButtonDestructive: {
    marginTop: vs(8),
  },
  sheetButtonText: {
    fontFamily: fontFamilies.regular,
    fontSize: rfs(14),
    color: colors.textPrimary,
  },
  sheetButtonTextDanger: {
    color: colors.error,
  },
  sheetCancel: {
    marginTop: vs(16),
    paddingVertical: vs(8),
  },
  sheetCancelText: {
    fontFamily: fontFamilies.medium,
    fontSize: rfs(14),
    color: colors.textGrey2,
    textAlign: "center",
  },
});

export default PostOptionsModal;
