// src/screens/ChangePasswordScreen.tsx

import { useChangePassword } from "@/src/core/hooks/useChangePassword";
import { colors, spacing, typography } from "@/src/core/styles"; // Import spacing from core styles
import { ms, rfs, vs } from "@/src/core/styles/scaling";
import { showToast } from "@/src/core/utils/toast"; // Import showToast
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import CustomInput from "../components/CustomInput";
import PrimaryButton from "../components/PrimaryButton";

// Password Validation Types 
interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
  met: boolean;
}

const MIN_PASSWORD_LENGTH = 8;

interface ChangePasswordPayload {
  old_password: string;
  new_password: string;
  confirm_password: string;
}

const ChangePassword = () => {
  const { update: changePasswordMutation } = useChangePassword();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  //Password Requirements State 
  const [passwordRequirements, setPasswordRequirements] = useState<
    PasswordRequirement[]
  >([
    {
      label: "At least 8 characters",
      test: (pwd) => pwd.length >= MIN_PASSWORD_LENGTH,
      met: false,
    },
    {
      label: "At least one uppercase letter",
      test: (pwd) => /[A-Z]/.test(pwd),
      met: false,
    },
    {
      label: "At least one lowercase letter",
      test: (pwd) => /[a-z]/.test(pwd),
      met: false,
    },
    {
      label: "At least one number",
      test: (pwd) => /[0-9]/.test(pwd),
      met: false,
    },
    {
      label: "At least one special character (!@#$%^&*)",
      test: (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
      met: false,
    },
  ]);

  // Update Password Requirements on New Password Change
  useEffect(() => {
    const updatedRequirements = [
      {
        label: "At least 8 characters",
        test: (pwd: string) => pwd.length >= MIN_PASSWORD_LENGTH,
        met: newPassword.length >= MIN_PASSWORD_LENGTH,
      },
      {
        label: "At least one uppercase letter",
        test: (pwd: string) => /[A-Z]/.test(pwd),
        met: /[A-Z]/.test(newPassword),
      },
      {
        label: "At least one lowercase letter",
        test: (pwd: string) => /[a-z]/.test(pwd),
        met: /[a-z]/.test(newPassword),
      },
      {
        label: "At least one number",
        test: (pwd: string) => /[0-9]/.test(pwd),
        met: /[0-9]/.test(newPassword),
      },
      {
        label: "At least one special character (!@#$%^&*)",
        test: (pwd: string) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
        met: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
      },
    ];
    setPasswordRequirements(updatedRequirements);
  }, [newPassword]);

  const allPasswordRequirementsMet = useMemo(() => {
    return passwordRequirements.every((req) => req.met);
  }, [passwordRequirements]);


  // Client-Side Validation Logic 
  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    let isValid = true;

    if (!oldPassword) {
      newErrors.oldPassword = "Old password is required.";
      isValid = false;
    }

    if (!newPassword) {
      newErrors.newPassword = "New password is required.";
      isValid = false;
    } else if (!allPasswordRequirementsMet) {
      newErrors.newPassword = "Password does not meet all requirements.";
      isValid = false;
    }

    if (!confirmNewPassword) {
      newErrors.confirmNewPassword = "Please confirm your password.";
      isValid = false;
    } else if (confirmNewPassword !== newPassword) {
      newErrors.confirmNewPassword = "Passwords do not match.";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChangePassword = async () => {
    if (!validate()) return;

    setIsLoading(true);
    setErrors({}); 

    try {
      await changePasswordMutation.mutateAsync({
        data: {
          old_password: oldPassword,
          new_password: newPassword,
          confirm_password: confirmNewPassword,
        },
      });

      // Success handling
      showToast.success("Success", "Password changed successfully.");
      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setShowSuccessModal(true);
    } catch (err: any) {
      console.log("❌ Password change error:", err);

      const backend = err.response?.data;
      const statusCode = err.response?.status;
      let apiErrors: { [key: string]: string } = {};
      let errorMessage = "Failed to change password. Please try again.";

      //Error Handling Logic 
      if (statusCode === 401) {
        // Specific error for old password mismatch
        apiErrors.oldPassword = backend?.detail || "Old password is incorrect.";
        errorMessage = apiErrors.oldPassword;
      } else if (statusCode === 422) {
        // Handle 422 validation errors with loc, msg structure
        const errorsFromBackend = backend?.detail;

        if (Array.isArray(errorsFromBackend)) {
            errorsFromBackend.forEach((e: any) => {
                const field = e.loc?.[e.loc.length - 1];
                const message = e.msg;

                // Map API field names to state variable names
                if (field === "old_password") {
                  apiErrors.oldPassword = message;
                } else if (field === "new_password") {
                  apiErrors.newPassword = message;
                } else if (field === "confirm_password") {
                  apiErrors.confirmNewPassword = message;
                }
            });
             errorMessage = "Please check your highlighted inputs.";
        }
      } else if (backend?.message) {
        errorMessage = backend.message;
      } else if (backend?.detail) {
        errorMessage = typeof backend.detail === 'string' ? backend.detail : "A server error occurred.";
      }


      // Update specific input errors or show a general alert
      if (Object.keys(apiErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...apiErrors }));
      } else {
        showToast.error("Change Failed", errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={ms(24)} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Change Password</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        {/* General Error Message (Now handled by showToast or specific fields) */}
        {errors.general && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errors.general}</Text>
          </View>
        )}

        {/* Old Password */}
        <CustomInput
          label="Enter Old Password"
          placeholder="Enter Old Password"
          value={oldPassword}
          onChangeText={setOldPassword}
          iconName="lock-closed-outline"
          isPassword
          isError={!!errors.oldPassword}
          errorMessage={errors.oldPassword}
        />

        {/* New Password */}
        <View style={styles.inputWrapper}>
          <CustomInput
            label="Enter New Password"
            placeholder={`Minimum ${MIN_PASSWORD_LENGTH} characters`}
            value={newPassword}
            onChangeText={setNewPassword}
            iconName="lock-closed-outline"
            isPassword
            isError={!!errors.newPassword}
            errorMessage={errors.newPassword}
            isValid={allPasswordRequirementsMet && newPassword.length > 0}
          />
          
          {/* Password Requirements Display */}
          {newPassword.length > 0 && (
            <View style={styles.passwordRequirementsContainer}>
              <Text style={styles.requirementsTitle}>
                Password must contain:
              </Text>
              {passwordRequirements.map((req, index) => (
                <View key={index} style={styles.requirementRow}>
                  <View
                    style={[
                      styles.requirementIndicator,
                      req.met && styles.requirementIndicatorMet,
                    ]}
                  >
                    {req.met && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text
                    style={[
                      styles.requirementText,
                      req.met && styles.requirementTextMet,
                    ]}
                  >
                    {req.label}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Confirm New Password */}
        <View style={styles.inputWrapper}>
          <CustomInput
            label="Confirm New Password"
            placeholder="Enter New Password"
            value={confirmNewPassword}
            onChangeText={setConfirmNewPassword}
            iconName="lock-closed-outline"
            isPassword
            isError={!!errors.confirmNewPassword}
            errorMessage={errors.confirmNewPassword}
            isValid={
              confirmNewPassword.length > 0 &&
              confirmNewPassword === newPassword &&
              allPasswordRequirementsMet
            }
          />

          {/* Confirm Password Indicator (Simplified) */}
          {confirmNewPassword.length > 0 && (
            <View style={styles.strengthIndicator}>
              {confirmNewPassword === newPassword ? (
                <>
                  <Ionicons
                    name="checkmark-circle"
                    size={ms(16)}
                    color={colors.success}
                    style={styles.strengthIcon}
                  />
                  <Text style={styles.strongPasswordText}>Passwords match</Text>
                </>
              ) : (
                <>
                  <Ionicons
                    name="close-circle"
                    size={ms(16)}
                    color={colors.error}
                    style={styles.strengthIcon}
                  />
                  <Text style={styles.weakPasswordText}>
                    Passwords do not match
                  </Text>
                </>
              )}
            </View>
          )}
        </View>

        {/* Change Password Button */}
        <PrimaryButton
          title="Change Password"
          onPress={handleChangePassword}
          isLoading={isLoading}
          disabled={
            !oldPassword ||
            !newPassword ||
            !confirmNewPassword ||
            !allPasswordRequirementsMet ||
            (newPassword !== confirmNewPassword) ||
            isLoading
          }
        />
      </ScrollView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleSuccessModalClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Success Icon */}
            <View style={styles.successIconContainer}>
              <Ionicons
                name="checkmark-circle"
                size={ms(60)}
                color={colors.success}
              />
            </View>

            {/* Success Message */}
            <Text style={styles.successTitle}>
              Password changed successfully
            </Text>

            {/* Done Button */}
            <TouchableOpacity
              style={styles.doneButton}
              onPress={handleSuccessModalClose}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default ChangePassword;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundMain,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: ms(spacing.lg),
    paddingTop: vs(50),
    paddingBottom: vs(spacing.md),
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
    paddingHorizontal: ms(spacing.lg),
    paddingTop: vs(spacing.md),
    paddingBottom: vs(40),
  },
  errorContainer: {
    backgroundColor: colors.errorLight,
    borderRadius: ms(8),
    padding: ms(12),
    marginBottom: vs(16),
    borderWidth: 1,
    borderColor: colors.error,
  },
  errorText: {
    ...typography.bodyMedium,
    color: colors.error,
    textAlign: "center",
  },
  inputWrapper: {
    marginBottom: vs(spacing.sm),
  },
  // --- New/Updated Styles for Requirements Display ---
  passwordRequirementsContainer: {
    backgroundColor: colors.backgroundSoft,
    borderRadius: ms(8),
    padding: ms(spacing.md),
    marginTop: ms(-spacing.sm),
    marginBottom: ms(spacing.md),
  },
  requirementsTitle: {
    fontSize: rfs(typography.caption.fontSize),
    fontFamily: typography.bodyMedium.fontFamily,
    color: colors.textGrey1,
    marginBottom: vs(8),
  },
  requirementRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: vs(6),
  },
  requirementIndicator: {
    width: ms(18),
    height: ms(18),
    borderRadius: ms(9),
    borderWidth: 2,
    borderColor: colors.textGrey2,
    marginRight: ms(8),
    justifyContent: "center",
    alignItems: "center",
  },
  requirementIndicatorMet: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  checkmark: {
    color: colors.textWhite,
    fontSize: rfs(12),
    fontWeight: "bold",
  },
  requirementText: {
    fontSize: rfs(typography.caption.fontSize),
    fontFamily: typography.bodySmall.fontFamily,
    color: colors.textGrey2,
    flex: 1,
  },
  requirementTextMet: {
    color: colors.success,
  },
  // --- Existing/Modified Strength Indicator Styles ---
  strengthIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: vs(4),
    marginBottom: vs(12),
    paddingHorizontal: ms(8), // Add padding for alignment
  },
  strengthIcon: {
    marginRight: ms(6),
  },
  weakPasswordText: {
    ...typography.caption,
    color: colors.error, 
  },
  strongPasswordText: {
    ...typography.caption,
    color: colors.success,
  },
  // --- Modal Styles ---
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: colors.backgroundMain,
    borderRadius: ms(16),
    padding: ms(spacing.xl),
    alignItems: "center",
  },
  successIconContainer: {
    marginBottom: vs(20),
  },
  successTitle: {
    ...typography.heading3,
    color: colors.textPrimary,
    marginBottom: vs(30),
    textAlign: "center",
  },
  doneButton: {
    width: "100%",
    backgroundColor: colors.primary,
    paddingVertical: vs(12),
    borderRadius: ms(8),
  },
  doneButtonText: {
    ...typography.bodyLarge,
    color: colors.textWhite,
    textAlign: "center",
    fontWeight: "600",
  },
});