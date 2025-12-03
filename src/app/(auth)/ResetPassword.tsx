import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { z } from "zod";

// --- Theme and Utilities ---
import { defaultTheme, spacing } from "../../core/styles/index";
import { ms, vs } from "../../core/styles/scaling";

// --- Components ---
import CustomInput from "../components/CustomInput";
import PrimaryButton from "../components/PrimaryButton";

// --- API Service ---
import { AxiosError } from "axios";
import {
  ApiErrorResponse,
  resetPassword,
} from "../../core/services/authService";
import { showToast } from "../../core/utils/toast";

// Destructure theme values outside component to prevent re-renders
const { colors, typography } = defaultTheme;

// --- Validation Schema ---
const resetPasswordSchema = z
  .object({
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
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const params = useLocalSearchParams<{
    verificationToken: string;
    email: string;
  }>();
  const verificationToken = params.verificationToken;
  const email = params.email;

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });

  const newPassword = watch("newPassword");
  const confirmPassword = watch("confirmPassword");

  // Password strength indicators
  const passwordChecks = {
    length: newPassword?.length >= 8,
    uppercase: /[A-Z]/.test(newPassword || ""),
    lowercase: /[a-z]/.test(newPassword || ""),
    number: /[0-9]/.test(newPassword || ""),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword || ""),
  };

  // ✅ Check for verification token on mount
  useEffect(() => {
    if (!verificationToken) {
      Alert.alert(
        "Error",
        "Verification token is missing. Please restart the password reset process.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/(auth)/ForgotPasswordScreen"),
          },
        ]
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!verificationToken) {
      Alert.alert("Error", "Verification token is missing. Please try again.");
      return;
    }

    try {
      const payload = {
        new_password: data.newPassword,
        confirm_password: data.confirmPassword,
        token: verificationToken,
      };

      await resetPassword(payload);
      setShowSuccessModal(true);
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const errorMessage =
        axiosError.response?.data?.message ||
        axiosError.response?.data?.detail ||
        "Failed to reset password. Please try again.";

      console.error("Server error details:", axiosError.response?.data);
      showToast.error(
        "Reset Failed",
        typeof errorMessage === "string"
          ? errorMessage
          : "Failed to reset password. Please try again."
      );
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    router.replace("/(auth)/SignInScreen");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              router.back();
            }}
          >
            <Image
              source={require("../../assets/images/arrow.png")}
              style={styles.arrowImage}
            />
          </TouchableOpacity>
          <Text style={styles.title}>Reset Password</Text>
        </View>
        <Text style={styles.subtitle}>
          Create a new password for {email || "your account"}
        </Text>

        <View style={styles.inputWrapper}>
          <Controller
            control={control}
            name="newPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <CustomInput
                label="New Password"
                placeholder="Enter new password"
                value={value ?? ""}
                onChangeText={onChange}
                onBlur={onBlur}
                iconName="lock-closed-outline"
                isPassword={true}
                isError={!!errors.newPassword}
                errorMessage={errors.newPassword?.message}
                isValid={(value ?? "").length >= 8 && !errors.newPassword}
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

        <View style={styles.inputWrapper}>
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <CustomInput
                label="Confirm Password"
                placeholder="Re-enter new password"
                value={value ?? ""}
                onChangeText={onChange}
                onBlur={onBlur}
                iconName="lock-closed-outline"
                isPassword={true}
                isError={!!errors.confirmPassword}
                errorMessage={errors.confirmPassword?.message}
                isValid={
                  (value ?? "").length > 0 &&
                  newPassword === value &&
                  !errors.confirmPassword
                }
              />
            )}
          />

          {/* Confirm Password Indicator */}
          {confirmPassword && confirmPassword.length > 0 && (
            <View style={styles.strengthIndicator}>
              {confirmPassword === newPassword ? (
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

        <View style={styles.buttonWrapper}>
          <PrimaryButton
            title="Reset Password"
            onPress={handleSubmit(onSubmit)}
            isLoading={isSubmitting}
            disabled={isSubmitting}
          />
        </View>
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
            <View style={styles.successIcon}>
              <Ionicons
                name="checkmark"
                size={ms(48)}
                color={colors.textWhite}
              />
            </View>
            <Text style={styles.modalTitle}>Password reset successful!</Text>
            <Text style={styles.modalSubtitle}>
              Your password has been successfully reset. You can now log in with
              your new password.
            </Text>
            <PrimaryButton
              title="Back to Login"
              onPress={handleSuccessModalClose}
              style={styles.modalButton}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// Styles created outside component with destructured theme values
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundMain,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: ms(24),
    paddingTop: vs(60),
    paddingBottom: vs(40),
  },
  title: {
    ...typography.heading1,
    color: colors.textPrimary,
    marginBottom: vs(8),
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textGrey1,
    marginBottom: vs(32),
  },
  inputWrapper: {
    marginBottom: vs(20),
  },
  passwordStrengthContainer: {
    marginTop: ms(8),
    marginBottom: ms(12),
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
    fontSize: ms(12),
    color: colors.textGrey1,
  },
  strengthIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: vs(4),
    marginBottom: vs(12),
  },
  strengthIcon: {
    marginRight: ms(6),
  },
  weakPasswordText: {
    fontSize: ms(12),
    color: colors.error,
  },
  strongPasswordText: {
    fontSize: ms(12),
    color: colors.success,
  },
  buttonWrapper: {
    marginTop: vs(24),
  },
  // Success Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: colors.textWhite,
    borderRadius: ms(16),
    padding: ms(24),
    alignItems: "center",
    width: "85%",
    maxWidth: ms(400),
  },
  successIcon: {
    width: ms(80),
    height: ms(80),
    borderRadius: ms(40),
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: vs(16),
  },
  modalTitle: {
    ...typography.heading2,
    color: colors.textPrimary,
    marginBottom: vs(8),
    textAlign: "center",
  },
  modalSubtitle: {
    ...typography.bodyMedium,
    color: colors.textGrey1,
    textAlign: "center",
    marginBottom: vs(24),
  },
  modalButton: {
    width: "100%",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  backButton: {
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xs,
  },
  arrowImage: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
});
