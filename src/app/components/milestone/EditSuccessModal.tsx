import ModalAnimationWrapper from "@/src/app/components/milestone/ModalAnimationWrapper";
import { colors, typography } from "@/src/core/styles";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import {
  getMilestoneStates,
  onToggleEditSuccessModal,
} from "@/src/store/milestoneSlice";
import React from "react";

import { Image, Pressable, StyleSheet, Text, View } from "react-native";

export default function EditSuccessModal() {
  const { isEditSuccessModalOpen } = useAppSelector(getMilestoneStates);
  const dispatch = useAppDispatch();

  const onCloseModal = () => dispatch(onToggleEditSuccessModal(false));

  return (
    <ModalAnimationWrapper
      isVisible={isEditSuccessModalOpen}
      onBackdropPress={onCloseModal}
    >
      <View style={styles.modalTextBox}>
        <View style={styles.modalHeader}>
          <Image source={require("../../../assets/images/green-success.png")} />
          <Text style={styles.successHeaderText}>
            Milestone updated successfully
          </Text>
        </View>

        <Pressable
          style={[styles.button, styles.buttonSave]}
          onPress={onCloseModal}
        >
          <Text style={styles.buttonText}>Done</Text>
        </Pressable>
      </View>
    </ModalAnimationWrapper>
  );
}

const styles = StyleSheet.create({
  buttonText: {
    ...typography.buttonText,
    color: "white",
    fontWeight: "500",
  },
  successHeaderText: {
    ...typography.heading3,
    color: "black",
    fontWeight: "600",
    textAlign: "center",
  },

  successIcon: {
    width: 57.52,
    height: 52.52,
  },

  modalHeader: {
    marginBottom: 12,
    alignItems: "center",
    gap: 12,
  },

  modalTextBox: {
    gap: 6,
  },

  buttonSave: {
    backgroundColor: colors.primary,
    ...typography.buttonText,
    color: "white",
    fontWeight: "500",
  },

  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
});
