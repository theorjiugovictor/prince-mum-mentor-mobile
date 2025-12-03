// src/screens/ChangePasswordScreen.tsx

import {useChangePassword} from "@/src/core/hooks/useChangePassword";
import {colors, spacing, typography} from "@/src/core/styles";
import {ms, rfs, vs} from "@/src/core/styles/scaling";
import {showToast} from "@/src/core/utils/toast";
import {Ionicons} from "@expo/vector-icons";
import {zodResolver} from "@hookform/resolvers/zod";
import {router} from "expo-router";
import React, {useState} from "react";
import {Controller, useForm} from "react-hook-form";
import {Modal, StyleSheet, Text, TouchableOpacity, View,} from "react-native";
import {z} from "zod";
import CustomInput from "../components/CustomInput";
import PrimaryButton from "../components/PrimaryButton";
import {KeyboardAwareScrollView} from "react-native-keyboard-controller";

// --- Validation Schema ---
const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, "Old password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain an uppercase letter")
      .regex(/[a-z]/, "Password must contain a lowercase letter")
      .regex(/[0-9]/, "Password must contain a number")
      .regex(
        /[!@#$%^&*(),.?":{}|<>]/,
        "Password must contain a special character"
      ),
    confirmNewPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

const ChangePassword = () => {
  const { update: changePasswordMutation } = useChangePassword();
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
    mode: "onChange",
  });

  const newPassword = watch("newPassword");
  const confirmNewPassword = watch("confirmNewPassword");

  // Password strength indicators
  const passwordChecks = {
    length: newPassword?.length >= 8,
    uppercase: /[A-Z]/.test(newPassword || ""),
    lowercase: /[a-z]/.test(newPassword || ""),
    number: /[0-9]/.test(newPassword || ""),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword || ""),
  };

  const allPasswordRequirementsMet = Object.values(passwordChecks).every(
    (check) => check
  );

  const onSubmit = async (data: ChangePasswordFormData) => {
    try {
      await changePasswordMutation.mutateAsync({
        data: {
          old_password: data.oldPassword,
          new_password: data.newPassword,
          confirm_password: data.confirmNewPassword,
        },
      });

      reset();
      setShowSuccessModal(true);
    } catch (err: any) {
      console.log("❌ Password change error:", err);

      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        "Failed to change password. Please try again.";

      showToast.error("Change Failed", errorMessage);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    router.back();
  };

  return (
      <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={ms(24)}
            color={colors.textPrimary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Change Password</Text>
        <View style={styles.headerSpacer} />
      </View>

          <KeyboardAwareScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        {/* Old Password */}
        <Controller
          control={control}
          name="oldPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <CustomInput
              label="Enter Old Password"
              placeholder="Enter Old Password"
              value={value || ""}
              onChangeText={onChange}
              onBlur={onBlur}
              iconName="lock-closed-outline"
              isPassword
              isError={!!errors.oldPassword}
              errorMessage={errors.oldPassword?.message}
            />
          )}
        />

        {/* New Password */}
        <View style={styles.inputWrapper}>
          <Controller
            control={control}
            name="newPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <CustomInput
                label="Enter New Password"
                placeholder="Minimum 8 characters"
                value={value || ""}
                onChangeText={onChange}
                onBlur={onBlur}
                iconName="lock-closed-outline"
                isPassword
                isError={!!errors.newPassword}
                errorMessage={errors.newPassword?.message}
                isValid={allPasswordRequirementsMet && (value || "").length > 0}
              />
            )}
          />

          {/* Password Strength Indicator */}
          {newPassword && newPassword.length > 0 && (
            <View style={styles.passwordStrengthContainer}>
              <View style={styles.strengthBarsContainer}>
                {[
                  passwordChecks.length,
                  passwordChecks.uppercase || passwordChecks.lowercase,
                  passwordChecks.number,
                  passwordChecks.special,
                ].map((met, index) => (
                  <View
                    key={index}
                    style={[
                      styles.strengthBar,
                      met && styles.strengthBarActive,
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.strengthText}>
                {Object.values(passwordChecks).filter(Boolean).length < 3
                  ? "Weak"
                  : Object.values(passwordChecks).filter(Boolean).length < 5
                    ? "Medium"
                    : "Strong"}
              </Text>
            </View>
          )}
        </View>

        {/* Confirm New Password */}
        <View style={styles.inputWrapper}>
          <Controller
            control={control}
            name="confirmNewPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <CustomInput
                label="Confirm New Password"
                placeholder="Enter New Password"
                value={value || ""}
                onChangeText={onChange}
                onBlur={onBlur}
                iconName="lock-closed-outline"
                isPassword
                isError={!!errors.confirmNewPassword}
                errorMessage={errors.confirmNewPassword?.message}
                isValid={
                  (value || "").length > 0 &&
                  value === newPassword &&
                  allPasswordRequirementsMet
                }
              />
            )}
          />

          {/* Confirm Password Indicator */}
          {confirmNewPassword && confirmNewPassword.length > 0 && (
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
          onPress={handleSubmit(onSubmit)}
          isLoading={isSubmitting}
          disabled={isSubmitting}
        />
          </KeyboardAwareScrollView>

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
      </View>
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
  inputWrapper: {
    marginBottom: vs(spacing.sm),
  },
  passwordStrengthContainer: {
    marginTop: ms(-spacing.sm),
    marginBottom: ms(spacing.md),
  },
  strengthBarsContainer: {
    flexDirection: "row",
    gap: ms(6),
    marginBottom: vs(4),
  },
  strengthBar: {
    flex: 1,
    height: vs(4),
    backgroundColor: colors.backgroundSoft,
    borderRadius: ms(2),
  },
  strengthBarActive: {
    backgroundColor: colors.success,
  },
  strengthText: {
    fontSize: rfs(typography.caption.fontSize),
    fontFamily: typography.bodySmall.fontFamily,
    color: colors.textGrey1,
  },
  strengthIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: vs(4),
    marginBottom: vs(12),
    paddingHorizontal: ms(8),
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
