import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";

// --- Imports from Core Components and Styles ---
import { colors, spacing, typography } from "../../core/styles/index";
import { ms, rfs, vs } from "../../core/styles/scaling";
import CustomInput from "../components/CustomInput";
import PrimaryButton from "../components/PrimaryButton";

// --- API Service and Types ---
import {
  isAppleAuthAvailable,
  signInWithApple,
} from "@/src/core/services/appleAuthService";
import { signInWithGoogle } from "@/src/core/services/googleAuthservice";
import { showToast } from "@/src/core/utils/toast";
import { ApiErrorResponse, register } from "../../core/services/authService";
import { getProfileSetup } from "../../core/services/profileSetup.service";

// --- Validation Schema ---
const signUpSchema = z
  .object({
    fullName: z.string().min(1, "Full Name is required"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address"),
    password: z
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
    isAgreed: z.boolean().refine((v) => v === true, {
      message: "You must agree to the Terms & Conditions",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignUpFormData = z.infer<typeof signUpSchema>;

export default function SignUpScreen() {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [isAppleAvailable, setIsAppleAvailable] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      isAgreed: false,
    },
    mode: "onChange",
  });

  const password = watch("password");
  const isAgreed = watch("isAgreed");

  // Password strength indicators
  const passwordChecks = {
    length: password?.length >= 8,
    uppercase: /[A-Z]/.test(password || ""),
    lowercase: /[a-z]/.test(password || ""),
    number: /[0-9]/.test(password || ""),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password || ""),
  };

  const allPasswordRequirementsMet = Object.values(passwordChecks).every(
    (check) => check
  );

  // Check if Apple Sign-In is available
  useEffect(() => {
    const checkAppleAuth = async () => {
      const available = await isAppleAuthAvailable();
      setIsAppleAvailable(available);
    };
    checkAppleAuth();
  }, []);

  const redirectAfterLogin = async () => {
    try {
      const profile = await getProfileSetup();
      if (profile?.mom_status) {
        router.replace("/Home");
      } else router.replace("/setup/Mum");
    } catch (err) {
      console.error("Error fetching profile setup:", err);
      router.replace("/setup/Mum");
    }
  };

  const onSubmit = async (data: SignUpFormData) => {
    setGeneralError(null);

    const payload = {
      full_name: data.fullName.trim(),
      email: data.email.toLowerCase(),
      password: data.password,
      confirm_password: data.confirmPassword,
    };

    try {
      await register(payload);

      showToast.success(
        "Success!",
        "Account created. Please check your email."
      );

      router.replace({
        pathname: "/(auth)/SignInScreen",
        params: {
          context: "register",
          email: data.email,
        },
      });
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const errorMessage =
        axiosError.response?.data?.message ||
        axiosError.response?.data?.detail ||
        "Signup Failed. Please try again.";

      showToast.error(
        "Signup Failed",
        typeof errorMessage === "string"
          ? errorMessage
          : "Signup Failed. Please try again."
      );
    }
  };

  const handleGooglePress = async () => {
    setIsGoogleLoading(true);
    setGeneralError(null);

    try {
      const result = await signInWithGoogle();

      if (result.success) {
        showToast.success(
          "Welcome Back!",
          result.user
            ? `Signed in as ${result.user.name}`
            : "Google login successful."
        );

        await redirectAfterLogin();
      } else {
        setGeneralError(
          result.error || "Google sign in failed. Please try again."
        );
      }
    } catch (error) {
      console.error("Google sign in error:", error);
      setGeneralError("Google sign in failed. Please try again.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleApplePress = async () => {
    setIsAppleLoading(true);
    setGeneralError(null);

    try {
      const result = await signInWithApple();

      if (result.success) {
        showToast.success(
          "Welcome Back!",
          result.user?.name
            ? `Signed in as ${result.user.name}`
            : "Apple login successful."
        );
        router.replace("/(tabs)/Home");
      } else {
        setGeneralError(
          result.error || "Apple sign in failed. Please try again."
        );
      }
    } catch (error) {
      console.error("Apple sign in error:", error);
      setGeneralError("Apple sign in failed. Please try again.");
    } finally {
      setIsAppleLoading(false);
    }
  };

  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.backgroundMain}
      />
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.backgroundMain }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.innerContainer}>
              <Text style={styles.header}>Sign up</Text>

              {generalError && (
                <Text style={styles.generalErrorText}>{generalError}</Text>
              )}

              <Controller
                control={control}
                name="fullName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <CustomInput
                    label="Full Name"
                    placeholder="Enter Full Name"
                    value={value || ""}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    isError={!!errors.fullName}
                    errorMessage={errors.fullName?.message}
                    iconName="person-outline"
                    isValid={
                      (value || "").trim().length > 0 && !errors.fullName
                    }
                  />
                )}
              />

              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <CustomInput
                    label="Email Address"
                    placeholder="Enter Email Address"
                    value={value || ""}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="email-address"
                    isError={!!errors.email}
                    errorMessage={errors.email?.message}
                    iconName="mail-outline"
                    isValid={
                      value?.includes("@") &&
                      value?.includes(".") &&
                      !errors.email
                    }
                  />
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <CustomInput
                    label="Choose Password"
                    placeholder="Minimum 8 characters"
                    value={value || ""}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    isPassword
                    iconName="lock-outline"
                    isError={!!errors.password}
                    errorMessage={errors.password?.message}
                    isValid={allPasswordRequirementsMet && !errors.password}
                  />
                )}
              />

              {password && password.length > 0 && (
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
                      ? "Weak Password"
                      : Object.values(passwordChecks).filter(Boolean).length < 5
                        ? "Medium Password"
                        : "Strong Password"}
                  </Text>
                </View>
              )}

              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <CustomInput
                    label="Confirm Password"
                    placeholder="Enter same password"
                    value={value || ""}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    isPassword
                    iconName="lock-outline"
                    isError={!!errors.confirmPassword}
                    errorMessage={errors.confirmPassword?.message}
                    isValid={
                      (value || "").length > 0 &&
                      value === password &&
                      allPasswordRequirementsMet &&
                      !errors.confirmPassword
                    }
                  />
                )}
              />

              <Controller
                control={control}
                name="isAgreed"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.agreementContainer}>
                    <TouchableOpacity
                      onPress={() => onChange(!value)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons
                        name={value ? "checkbox" : "square-outline"}
                        size={rfs(24)}
                        color={
                          value
                            ? colors.success
                            : errors.isAgreed
                              ? colors.error
                              : colors.textPrimary
                        }
                      />
                    </TouchableOpacity>
                    <Text style={styles.agreementText}>
                      I agree to all the{" "}
                      <Text
                        style={styles.termsLink}
                        onPress={() => router.push("/TermsAndConditions")}
                      >
                        Terms & Conditions
                      </Text>
                    </Text>
                  </View>
                )}
              />

              <PrimaryButton
                title="Sign up"
                onPress={handleSubmit(onSubmit)}
                isLoading={isSubmitting}
                disabled={!isAgreed || isSubmitting}
              />

              <Text style={styles.loginText}>
                Already have an account?{" "}
                <Text
                  style={styles.loginLink}
                  onPress={() => router.replace("/(auth)/SignInScreen")}
                >
                  Login
                </Text>
              </Text>

              <Text style={styles.socialLoginText}>OR CONTINUE WITH</Text>

              <View style={styles.socialButtonsContainer}>
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={handleGooglePress}
                  disabled={isGoogleLoading}
                >
                  {isGoogleLoading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <>
                      <Image
                        source={require("../../assets/images/google.png")}
                        style={styles.socialButtonImage}
                        resizeMode="contain"
                      />
                      <Text style={styles.socialButtonText}>Google</Text>
                    </>
                  )}
                </TouchableOpacity>

                {isAppleAvailable && (
                  <TouchableOpacity
                    style={[
                      styles.socialButton,
                      { marginLeft: ms(spacing.md) },
                    ]}
                    onPress={handleApplePress}
                    disabled={isAppleLoading}
                  >
                    {isAppleLoading ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <>
                        <Image
                          source={require("../../assets/images/apple.png")}
                          style={styles.socialButtonImage}
                          resizeMode="contain"
                        />
                        <Text style={styles.socialButtonText}>Apple</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.backgroundMain,
  },
  innerContainer: {
    flex: 1,
    paddingHorizontal: ms(spacing.lg),
    paddingTop: ms(spacing.xl),
    paddingBottom: ms(spacing.xl),
  },
  header: {
    fontSize: rfs(typography.heading1.fontSize),
    fontFamily: typography.heading1.fontFamily,
    color: colors.textPrimary,
    marginBottom: ms(spacing.xl),
    textAlign: "center",
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
  agreementContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: ms(spacing.xl),
    marginTop: ms(spacing.sm),
    borderRadius: ms(15),
  },
  agreementText: {
    fontSize: rfs(typography.bodySmall.fontSize),
    fontFamily: typography.bodySmall.fontFamily,
    color: colors.textPrimary,
    marginLeft: ms(spacing.sm),
    flexShrink: 1,
  },
  termsLink: {
    color: colors.primary,
    textDecorationLine: "underline",
  },
  loginText: {
    fontSize: rfs(typography.bodyMedium.fontSize),
    fontFamily: typography.bodyMedium.fontFamily,
    color: colors.textPrimary,
    textAlign: "center",
    marginTop: ms(spacing.lg),
    marginBottom: ms(spacing.lg),
  },
  loginLink: {
    color: colors.primary,
    textDecorationLine: "underline",
    fontWeight: "bold",
  },
  socialLoginText: {
    fontSize: rfs(typography.caption.fontSize),
    fontFamily: typography.caption.fontFamily,
    color: colors.textGrey1,
    textAlign: "center",
    marginVertical: ms(spacing.md),
  },
  socialButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  socialButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.outline,
    paddingVertical: ms(spacing.sm),
    borderRadius: ms(spacing.sm),
    marginHorizontal: ms(spacing.xs),
    minHeight: ms(50),
  },
  socialButtonImage: {
    width: rfs(24),
    height: rfs(24),
    marginRight: ms(spacing.sm),
  },
  socialButtonText: {
    fontSize: rfs(typography.bodyMedium.fontSize),
    fontFamily: typography.bodyMedium.fontFamily,
    color: colors.textPrimary,
  },
  generalErrorText: {
    ...typography.bodyMedium,
    color: colors.error,
    textAlign: "center",
    marginBottom: ms(spacing.md),
  },
});
