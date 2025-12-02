import { colors, typography } from "@/src/core/styles";
import { ms, vs } from "@/src/core/styles/scaling";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import CustomInput from "../components/CustomInput";
import DeleteConfirmModal from "../components/DeleteConfirmationModal";
import PrimaryButton from "../components/PrimaryButton";
import SuccessModal from "../components/SuccessModal";
import { useDeleteAccount } from "@/src/core/hooks/useDeleteAccount";
const CONFIRMATION_PHRASE = "DELETE MY ACCOUNT";

const ConfirmDelete = () => {
  const [password, setPassword] = useState("");
  const [confirmationText, setConfirmationText] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const deleteAccountMutation = useDeleteAccount();

  const validateInputs = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!confirmationText) {
      newErrors.confirmation = "Confirmation phrase is required";
    } else if (confirmationText !== CONFIRMATION_PHRASE) {
      newErrors.confirmation = `Please type exactly: ${CONFIRMATION_PHRASE}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirmPress = () => {
    if (validateInputs()) {
      setShowDeleteModal(true);
    }
  };

  const handleDelete = async () => {
    setShowDeleteModal(false);

    try {
      await deleteAccountMutation.mutateAsync({
        confirmation_phrase: confirmationText,
        password: password,
      });

      // Show success modal
      setShowSuccessModal(true);
    } catch (error: any) {
      // Show error alert
      Alert.alert(
        "Delete Failed",
        error.message || "Failed to delete account. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    // Navigate to signup screen
    router.replace("/(auth)/SignUpScreen");
  };

  const isConfirmDisabled =
    !password ||
    !confirmationText ||
    confirmationText !== CONFIRMATION_PHRASE ||
    deleteAccountMutation.isPending;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Delete Account</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {/* Warning Text */}
          <View style={styles.warningContainer}>
            <View style={styles.warningIconContainer}>
              <Ionicons name="warning" size={48} color={colors.error} />
            </View>
            <Text style={styles.warningTitle}>
              This action cannot be undone
            </Text>
            <Text style={styles.warningText}>
              Deleting your account will permanently remove all your data,
              including your profile, posts, and activity. This action is
              irreversible.
            </Text>
          </View>

          {/* Confirmation Phrase Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>
              Type{" "}
              <Text style={styles.highlightedText}>
                &quot;{CONFIRMATION_PHRASE}&quot;
              </Text>{" "}
              to confirm
            </Text>
            <CustomInput
              placeholder={`Type: ${CONFIRMATION_PHRASE}`}
              value={confirmationText}
              onChangeText={(text) => {
                setConfirmationText(text);
                if (errors.confirmation) {
                  setErrors({ ...errors, confirmation: "" });
                }
              }}
              isError={!!errors.confirmation}
              errorMessage={errors.confirmation}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Enter your password</Text>
            <CustomInput
              placeholder="Enter your password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) {
                  setErrors({ ...errors, password: "" });
                }
              }}
              secureTextEntry
              isError={!!errors.password}
              errorMessage={errors.password}
              iconName="lock-closed-outline"
            />
          </View>

          {/* Additional Warning */}
          <View style={styles.infoBox}>
            <Ionicons
              name="information-circle"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.infoText}>
              Make sure you&apos;ve backed up any important information before
              proceeding.
            </Text>
          </View>
        </ScrollView>

        {/* Confirm Button */}
        <View style={styles.buttonContainer}>
          <PrimaryButton
            title="Delete My Account"
            onPress={handleConfirmPress}
            isLoading={deleteAccountMutation.isPending}
            disabled={isConfirmDisabled}
            style={styles.deleteButton}
          />
        </View>

        {/* Delete Confirmation Modal */}
        <DeleteConfirmModal
          visible={showDeleteModal}
          onDelete={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
          title="Final Confirmation"
          message="Are you absolutely sure you want to delete your account? This cannot be undone."
        />

        {/* Success Modal */}
        <SuccessModal
          visible={showSuccessModal}
          title="Account Deleted"
          message="Your account has been permanently deleted. We're sorry to see you go."
          onClose={handleSuccessClose}
          buttonText="Done"
          iconComponent={
            <Image
              source={require("../../assets/images/success-icon.png")}
              style={styles.successIcon}
            />
          }
        />
      </View>
    </KeyboardAvoidingView>
  );
};

export default ConfirmDelete;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundMain,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: ms(20),
    paddingTop: vs(50),
    paddingBottom: vs(16),
    backgroundColor: colors.backgroundMain,
  },
  backButton: {
    width: ms(40),
    height: ms(40),
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerTitle: {
    ...typography.heading2,
    color: colors.textPrimary,
    flex: 1,
  },
  headerSpacer: {
    width: ms(40),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: ms(20),
    paddingBottom: vs(20),
  },
  warningContainer: {
    alignItems: "center",
    marginVertical: vs(24),
    paddingVertical: vs(20),
    paddingHorizontal: ms(16),
    backgroundColor: colors.errorLight || "#FEE2E2",
    borderRadius: ms(12),
    borderWidth: 1,
    borderColor: colors.error,
  },
  warningIconContainer: {
    marginBottom: vs(12),
  },
  warningTitle: {
    ...typography.heading3,
    color: colors.error,
    marginBottom: vs(8),
    textAlign: "center",
  },
  warningText: {
    ...typography.bodyMedium,
    color: colors.textGrey1,
    textAlign: "center",
    lineHeight: 22,
  },
  inputSection: {
    marginBottom: vs(24),
  },
  inputLabel: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    marginBottom: vs(8),
    fontWeight: "600",
  },
  highlightedText: {
    color: colors.error,
    fontWeight: "700",
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: colors.primaryLight || "#E0F2FE",
    padding: ms(12),
    borderRadius: ms(8),
    marginTop: vs(8),
    gap: ms(8),
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.textGrey1,
    flex: 1,
    lineHeight: 18,
  },
  buttonContainer: {
    paddingHorizontal: ms(20),
    paddingVertical: vs(16),
    backgroundColor: colors.backgroundMain,
  },
  deleteButton: {
    backgroundColor: colors.error,
  },
  successIcon: {
    width: ms(60),
    height: ms(60),
  },
});
