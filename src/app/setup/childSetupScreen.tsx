// src/screens/setup/childSetupScreen.tsx

import { useAuth } from "@/src/core/services/authContext";
import { colors, spacing, typography } from "@/src/core/styles";
import { ms, vs } from "@/src/core/styles/scaling";
import { showToast } from "@/src/core/utils/toast";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSetup } from "../../core/hooks/setupContext";
import ChildSetupItem, { ChildData } from "../components/ChildSetupItem";
import PrimaryButton from "../components/PrimaryButton";
import SecondaryButton from "../components/SecondaryButton";
import { SuccessModal, useSuccessModal } from "../components/SuccessModal";
import { completeSetupFlow } from "../../core/services/setupService";

const ChildSetupScreen = () => {
  const { momSetupData } = useSetup();
  const { user } = useAuth();

  const [children, setChildren] = useState<ChildData[]>([
    { fullName: "", age: "", dob: "", gender: "" },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const { visible, show, hide } = useSuccessModal();

  useEffect(() => {
    console.log('='.repeat(80));
    console.log('📱 CHILD SETUP SCREEN - Component mounted');
    console.log('='.repeat(80));
    
    if (!user) {
      console.warn('⚠️ User not loaded in ChildSetupScreen');
    } else {
      console.log('✅ User loaded:', user.id, user.email);
    }
    
    if (!momSetupData) {
      console.warn('⚠️ Mom setup data not found');
    } else {
      console.log('✅ Mom setup data loaded:', JSON.stringify(momSetupData, null, 2));
    }
  }, [user, momSetupData]);

  const addChild = useCallback(() => {
    console.log('➕ Adding new child entry');
    setChildren((prevChildren) => [
      ...prevChildren,
      { fullName: "", age: "", dob: "", gender: "" },
    ]);
  }, []);

  const updateChild = useCallback((index: number, updatedChild: ChildData) => {
    console.log(`✏️ Updating child at index ${index}:`, updatedChild);
    setChildren((prevChildren) => {
      const newChildren = [...prevChildren];
      newChildren[index] = updatedChild;
      return newChildren;
    });
  }, []);

  const removeChild = useCallback((index: number) => {
    console.log(`🗑️ Removing child at index ${index}`);
    setChildren((prevChildren) => prevChildren.filter((_, i) => i !== index));
  }, []);

  const canceled = useCallback(() => {
    Alert.alert(
      "Cancel Setup",
      "Are you sure you want to cancel? Your progress will be lost.",
      [
        { text: "No", style: "cancel" },
        { text: "Yes", style: "destructive", onPress: () => router.back() },
      ]
    );
  }, []);

  /**
   * Check if at least one child has all fields filled
   * Returns true if there's at least one complete child entry
   */
  const hasAtLeastOneCompleteChild = useCallback(() => {
    return children.some(
      (child) =>
        child.fullName?.trim() &&
        child.age?.trim() &&
        child.dob?.trim() &&
        child.gender?.trim()
    );
  }, [children]);

  /**
   * Check if ALL filled children have complete data
   * Empty children are ignored
   */
  const areAllFilledChildrenComplete = useCallback(() => {
    const filledChildren = children.filter(
      (child) =>
        child.fullName?.trim() ||
        child.age?.trim() ||
        child.dob?.trim() ||
        child.gender?.trim()
    );

    if (filledChildren.length === 0) {
      // No children filled - this is OK (pregnant mom)
      return true;
    }

    // All filled children must be complete
    return filledChildren.every(
      (child) =>
        child.fullName?.trim() &&
        child.age?.trim() &&
        child.dob?.trim() &&
        child.gender?.trim()
    );
  }, [children]);

  /**
   * Get only the children that are fully filled out
   */
  const getCompleteChildren = useCallback(() => {
    return children.filter(
      (child) =>
        child.fullName?.trim() &&
        child.age?.trim() &&
        child.dob?.trim() &&
        child.gender?.trim()
    );
  }, [children]);

  /**
   * Check if form can be submitted
   * Requirements:
   * - Mom setup data must exist (CRITICAL)
   * - Either no children OR all filled children are complete
   */
  const canSubmit = useCallback(() => {
    const hasMomData = !!momSetupData;
    const allFilledChildrenComplete = areAllFilledChildrenComplete();
    
    console.log('🔍 Checking if can submit:');
    console.log('  - Has mom data:', hasMomData);
    console.log('  - All filled children complete:', allFilledChildrenComplete);
    console.log('  - Result:', hasMomData && allFilledChildrenComplete);
    
    return hasMomData && allFilledChildrenComplete;
  }, [momSetupData, areAllFilledChildrenComplete]);

  const handleDone = async () => {
    console.log('='.repeat(80));
    console.log('🟢 CHILD SETUP SCREEN - handleDone called');
    console.log('='.repeat(80));

    // Validate mom setup data exists
    if (!momSetupData) {
      console.error('❌ Mom setup data missing');
      showToast.error(
        "Error",
        "Mom setup data is missing. Please go back and complete mom setup first."
      );
      router.back();
      return;
    }

    console.log('✅ Mom setup data verified');

    // Check if any partially filled children exist
    if (!areAllFilledChildrenComplete()) {
      console.log('❌ Some children are partially filled');
      Alert.alert(
        "Incomplete Form",
        "Please complete all child details or remove partially filled entries before continuing."
      );
      return;
    }

    console.log('✅ All filled children are complete');

    // Check authentication
    if (!user || !user.id) {
      console.error('❌ User not authenticated');
      Alert.alert(
        "Authentication Error",
        "User session not found. Please log in again."
      );
      router.replace("/(auth)/SignInScreen");
      return;
    }

    console.log('✅ User authenticated:', user.id);

    // Get only complete children
    const completeChildren = getCompleteChildren();
    console.log(`📊 Complete children count: ${completeChildren.length}`);
    console.log('📦 Complete children data:', JSON.stringify(completeChildren, null, 2));

    // Map children data to API format
    const childrenForAPI = completeChildren.map((child) => ({
      fullName: child.fullName,
      dob: child.dob, // Already in ISO format from picker
      gender: child.gender.toLowerCase() as 'male' | 'female' | 'other',
    }));

    console.log('🔄 Mapped children for API:', JSON.stringify(childrenForAPI, null, 2));

    setIsLoading(true);

    try {
      console.log('🌐 Calling completeSetupFlow...');
      
      // CRITICAL: Only this function sets isSetupComplete = true on success
      const result = await completeSetupFlow(momSetupData, childrenForAPI);
      
      if (result.success) {
        console.log('='.repeat(80));
        console.log('✅ SETUP FLOW COMPLETED SUCCESSFULLY!');
        console.log('='.repeat(80));
        console.log('🔑 Profile setup ID:', result.profile_setup_id);
        console.log('👶 Children created:', result.childrenCreated || 0);
        console.log('❌ Children failed:', result.childrenFailed || 0);
        console.log('🎉 isSetupComplete flag is now TRUE (set by service)');
        console.log('='.repeat(80));
        
        // Show success modal
        // Note: isSetupComplete is already set to true by the service
        show();
      } else {
        console.log('='.repeat(80));
        console.error('❌ SETUP FLOW FAILED');
        console.log('='.repeat(80));
        console.error('Error:', result.error);
        console.log('🔒 isSetupComplete flag is FALSE (set by service)');
        console.log('='.repeat(80));
        
        throw result.error || new Error('Setup failed');
      }
      
    } catch (error: any) {
      console.log('='.repeat(80));
      console.error('❌ ERROR IN handleDone');
      console.log('='.repeat(80));
      console.error('Error:', error);
      console.error('Error message:', error?.message);
      console.error('Error response:', error?.response?.data);
      console.error('Error status:', error?.response?.status);
      
      // CRITICAL: Ensure setup is NOT marked as complete on error
      // The service already does this, but we double-check here for safety
      try {
        await AsyncStorage.setItem('isSetupComplete', 'false');
        console.log('✅ Double-checked: isSetupComplete = false');
      } catch (storageError) {
        console.error('❌ Failed to update AsyncStorage:', storageError);
      }
      
      // Show user-friendly error message
      let errorMessage = "Failed to complete setup. Please try again.";
      let shouldRedirect = false;
      
      if (error?.response?.status === 422) {
        errorMessage = "Invalid data format. Please check all fields and try again.";
      } else if (error?.response?.status === 401) {
        errorMessage = "Session expired. Please log in again.";
        shouldRedirect = true;
      } else if (error?.response?.status === 409) {
        // Profile already exists - this might be OK
        console.log('ℹ️ 409 Conflict: Profile already exists');
        errorMessage = "Profile setup already exists. Redirecting...";
        
        // Mark as complete since profile exists on backend
        await AsyncStorage.setItem('isSetupComplete', 'true');
        setTimeout(() => {
          router.replace("/(tabs)/Home");
        }, 1500);
        return;
      } else if (error?.message?.includes('Failed to create profile setup')) {
        errorMessage = "Could not create your profile. Please check your internet connection and try again.";
      } else if (error?.message?.includes('Failed to create any children')) {
        // Profile was created but children failed
        errorMessage = "Your profile was created but children could not be added. You can add them later from the app.";
        
        // Profile exists, so mark as complete
        await AsyncStorage.setItem('isSetupComplete', 'true');
        setTimeout(() => {
          router.replace("/(tabs)/Home");
        }, 1500);
        return;
      } else if (!error?.response && error?.message?.includes('Network')) {
        errorMessage = "Network error. Please check your internet connection and try again.";
      }
      
      Alert.alert("Setup Error", errorMessage);
      
      if (shouldRedirect) {
        setTimeout(() => {
          router.replace("/(auth)/SignInScreen");
        }, 2000);
      }
      
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccessClose = useCallback(() => {
    console.log('✅ Success modal closed - navigating to Home');
    hide();
    router.replace("/(tabs)/Home");
  }, [hide]);

  return (
    <>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Set Up Children</Text>
          
          <Text style={styles.subtitle}>
            {children.length === 1 && !hasAtLeastOneCompleteChild()
              ? "Add your children below, or skip if you're pregnant or prefer to add them later."
              : "Fill in the details for each child. You can skip this step if needed."}
          </Text>

          {children.map((child, index) => (
            <ChildSetupItem
              key={index}
              index={index}
              childData={child}
              onUpdate={updateChild}
              onDelete={() => removeChild(index)}
            />
          ))}

          <TouchableOpacity style={styles.addBtn} onPress={addChild}>
            <Text style={styles.addBtnText}>＋ Add Another Child</Text>
          </TouchableOpacity>
        </ScrollView>

        <SuccessModal
          visible={visible}
          onClose={handleSuccessClose}
          title="Setup Successful!"
          message="Your profile is ready. Let's get started!"
          iconComponent={
            <Image
              source={require("../../assets/images/success-icon.png")}
              style={styles.successIcon}
            />
          }
        />

        <View style={styles.bottomButtons}>
          <PrimaryButton
            title="Done"
            onPress={handleDone}
            disabled={!canSubmit() || isLoading}
            isLoading={isLoading}
          />
          <SecondaryButton
            title="Cancel"
            onPress={canceled}
            disabled={isLoading}
          />
        </View>
      </View>
    </>
  );
};

export default ChildSetupScreen;

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundMain,
    flex: 1,
  },
  scrollView: {
    paddingHorizontal: ms(spacing.lg),
    paddingTop: vs(60),
    paddingBottom: vs(180),
  },
  title: {
    ...typography.heading1,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: vs(spacing.sm),
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.textGrey1,
    textAlign: "center",
    marginBottom: vs(spacing.xl),
    paddingHorizontal: ms(spacing.md),
  },
  addBtn: {
    alignSelf: "center",
    marginVertical: vs(spacing.lg),
  },
  addBtnText: {
    ...typography.labelLarge,
    color: colors.primary,
  },
  bottomButtons: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: ms(spacing.lg),
    paddingBottom: vs(spacing.xl),
    gap: vs(spacing.sm),
    backgroundColor: colors.backgroundMain,
    borderTopWidth: 1,
    borderTopColor: colors.backgroundSubtle,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  successIcon: {
    width: ms(60),
    height: ms(60),
  },
});