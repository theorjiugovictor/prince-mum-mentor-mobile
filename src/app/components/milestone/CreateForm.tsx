import FormInput from "@/src/app/components/milestone/FormInput";
import { createMilestone } from "@/src/core/services/milestoneService";
import { colors, spacing, typography } from "@/src/core/styles";
import { ms } from "@/src/core/styles/scaling";
import { showToast } from "@/src/core/utils/toast";
import { useMilestoneStore } from "@/src/store/useMilestone";
import { CreateMilestoneType, MilestoneDataType } from "@/src/types/milestones";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as Crypto from "expo-crypto";
import { useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import Modal from "react-native-modal";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

export default function CreateForm() {
  const isCreateFormOpen = useMilestoneStore((state) => state.isCreateFormOpen);
  const onToggleCreateForm = useMilestoneStore(
    (state) => state.onToggleCreateForm
  );
  const onAddMilestone = useMilestoneStore((state) => state.onAddMilestone);
  const onToggleSuccessModal = useMilestoneStore(
    (state) => state.onToggleSuccessModal
  );

  const [formData, setFormData] = useState({ name: "", description: "" });
  const queryClient = useQueryClient();
  const { categoryValue, ownerId, childId } = useLocalSearchParams();

  const validChildId = childId ? String(childId) : undefined;
  const isNameInputFilled = !!formData.name;

  const { mutate: createNewMilestone, isPending: isCreatingMilestone } =
    useMutation({
      mutationFn: (payload: CreateMilestoneType) => createMilestone(payload),
      onSuccess: () => {
        onToggleCreateForm(false);
        onToggleSuccessModal(true);
        queryClient.invalidateQueries({ queryKey: ["milestonesByCat"] });
      },
      onError: (error: any) => {
        showToast.error(error.message);
      },
    });

  function handleMilestoneCreation() {
    const currentDate = new Date().toISOString();
    const newMilestone: MilestoneDataType = {
      id: Crypto.randomUUID(),
      owner_id: ownerId as string,
      owner_type: validChildId ? "child" : "mother",
      status: "pending",
      category: categoryValue as string,
      created_at: currentDate,
      updated_at: currentDate,
      ...formData,
    };

    const serverNewMilestone = {
      ...formData,
      category: categoryValue as string,
      child_id: childId as string | undefined,
    };

    onAddMilestone(newMilestone);
    createNewMilestone(serverNewMilestone);
    setFormData({ name: "", description: "" });
  }

  // Handler to close the modal
  function onClose() {
    onToggleCreateForm(false);
  }

  return (
    <Modal
      isVisible={isCreateFormOpen}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      backdropOpacity={0.5}
      onBackdropPress={onClose}
      style={{ justifyContent: "flex-end", margin: 0 }}
      avoidKeyboard={false}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.modalContent}>
          <KeyboardAwareScrollView
            style={styles.formContainer}
            contentContainerStyle={styles.formContentContainer}
            // enableOnAndroid={true}
            // enableAutomaticScroll={true}
            // extraScrollHeight={20}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <ScrollView
              contentContainerStyle={{ flex: 1, justifyContent: "flex-end" }}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.milestoneFormContainer}>
                <View style={styles.formHeaderBox}>
                  <Text style={styles.formTitle}>create milestones</Text>
                  <Text style={styles.formDescription}>
                    Add Milestones to stay focused, celebrate progress
                  </Text>
                </View>

                <FormInput label="Milestone Name">
                  <TextInput
                    style={styles.input}
                    placeholder="e.g 5 Minutes Exercise"
                    placeholderTextColor={colors.textGrey2}
                    editable={!isCreatingMilestone}
                    autoCapitalize="none"
                    value={formData.name}
                    onChangeText={(text) =>
                      setFormData((cur) => ({ ...cur, name: text }))
                    }
                  />
                </FormInput>

                <FormInput label="Add Description">
                  <TextInput
                    style={styles.input}
                    placeholder="eg. Tried a 5 Minutes Exercise Plan..."
                    placeholderTextColor={colors.textGrey2}
                    editable={!isCreatingMilestone}
                    defaultValue=""
                    keyboardType="default"
                    autoCapitalize="none"
                    onChangeText={(text) =>
                      setFormData((cur) => ({ ...cur, description: text }))
                    }
                  />
                </FormInput>

                <View style={styles.buttonsContainer}>
                  <Pressable
                    style={[
                      styles.buttons,
                      styles.buttonSave,
                      (!isNameInputFilled || isCreatingMilestone) &&
                        styles.buttonDisabled,
                    ]}
                    onPress={handleMilestoneCreation}
                    disabled={!isNameInputFilled || isCreatingMilestone}
                  >
                    <Text style={styles.buttonText}>
                      {isCreatingMilestone ? "Saving..." : "Save"}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[styles.buttons, styles.buttonCancel]}
                    onPress={onClose}
                    disabled={isCreatingMilestone}
                  >
                    <Text style={styles.buttonCancelText}>Cancel</Text>
                  </Pressable>
                </View>
              </View>
            </ScrollView>
          </KeyboardAwareScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  buttonCancel: {
    backgroundColor: "white",
    borderWidth: 1.5,
    borderColor: colors.primary,
  },

  buttonSave: {
    backgroundColor: colors.primary,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    ...typography.buttonText,
    color: "white",
    fontWeight: "500",
  },

  buttonCancelText: {
    ...typography.buttonText,
    color: colors.primary,
    fontWeight: "500",
  },

  buttons: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },

  buttonsContainer: {
    gap: 16,
  },

  input: {
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.outline,
    ...typography.caption,
    height: 48,
    color: colors.textSecondary,
  },

  formDescription: {
    ...typography.bodySmall,
    color: colors.textGrey1,
    maxWidth: 271.62,
    textAlign: "center",
  },

  formTitle: {
    ...typography.heading3,
    fontWeight: "600",
    color: "black",
    textTransform: "capitalize",
    textAlign: "center",
  },

  formHeaderBox: {
    gap: 8,
    alignItems: "center",
  },

  milestoneFormContainer: {
    borderTopEndRadius: 8,
    borderTopLeftRadius: 8,
    backgroundColor: "white",
    padding: 24,
    gap: 24,
  },

  formContainer: {
    paddingTop: 10,
  } as ViewStyle,

  formContentContainer: {
    paddingBottom: Platform.OS === "ios" ? ms(spacing.xl) : ms(spacing.lg),
  } as ViewStyle,

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  } as ViewStyle,

  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  } as ViewStyle,

  modalContent: {
    backgroundColor: colors.backgroundMain,
    borderTopLeftRadius: ms(12),
    borderTopRightRadius: ms(12),
    paddingHorizontal: ms(spacing.md),
    width: "100%",
    maxHeight: "90%",
  } as ViewStyle,
});
