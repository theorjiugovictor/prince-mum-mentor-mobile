"use client";

import { colors, fontFamilies, spacing } from "@/src/core/styles";
import { ms, rfs, vs } from "@/src/core/styles/scaling";
import React from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import PrimaryButton from "../PrimaryButton";
import SecondaryButton from "../SecondaryButton";

interface DeleteConfirmModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  visible,
  onCancel,
  onConfirm,
  isDeleting = false,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.centerOverlay}>
        <View style={styles.confirmCard}>
          <Text style={styles.confirmTitle}>Delete post?</Text>
          <Text style={styles.confirmText}>
            Are you sure you want to delete this post? This action cannot be
            undone.
          </Text>

          <View style={styles.confirmButtons}>
            <SecondaryButton
              title="Cancel"
              onPress={onCancel}
              style={styles.confirmButton}
              disabled={isDeleting}
            />
            <PrimaryButton
              title={isDeleting ? "Deleting..." : "Delete"}
              onPress={onConfirm}
              style={styles.confirmDeleteButton}
              disabled={isDeleting}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centerOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  confirmCard: {
    width: "80%",
    backgroundColor: colors.textWhite,
    borderRadius: ms(16),
    padding: ms(spacing.xl),
  },
  confirmTitle: {
    fontFamily: fontFamilies.semiBold,
    fontSize: rfs(16),
    color: colors.textPrimary,
    marginBottom: vs(12),
  },
  confirmText: {
    fontFamily: fontFamilies.regular,
    fontSize: rfs(13),
    color: colors.textGrey2,
    marginBottom: vs(20),
    lineHeight: rfs(18),
  },
  confirmButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: ms(10),
  },
  confirmButton: {
    flex: 1,
  },
  confirmDeleteButton: {
    flex: 1,
  },
});

export default DeleteConfirmModal;
