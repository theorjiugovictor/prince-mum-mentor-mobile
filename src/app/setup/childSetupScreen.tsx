import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
// Assuming the path to the ChildSetupItem and its ChildData interface is correct
import ChildSetupItem, { ChildData } from '../components/ChildSetupItem';
// Assuming core styles imports are correct
import { colors, typography, spacing } from '@/src/core/styles';
import { ms, vs } from '@/src/core/styles/scaling';
// Assuming custom component imports are correct
import PrimaryButton from '../components/PrimaryButton';
import SecondaryButton from '../components/SecondaryButton';
import { SuccessModal, useSuccessModal } from '../components/SuccessModal';
import { router } from 'expo-router';
// Assuming custom hook imports are correct
import { useSetup } from '../../core/hooks/setupContext';
import { useAuth } from '@/src/core/services/authContext';

/**
 * @fileoverview ChildSetupScreen component for handling child profile setup during onboarding.
 * @exports ChildSetupScreen
 */

const ChildSetupScreen = () => {
  // --- Context Hooks ---
  const { completeSetup, momSetupData } = useSetup();
  const { user } = useAuth();

  // --- State Variables ---
  const [children, setChildren] = useState<ChildData[]>([
    { fullName: "", age: "", dob: "", gender: "" },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const { visible, show, hide } = useSuccessModal();

  // --- Effects ---

  /** Effect to log user status on mount or when `user` changes. */
  useEffect(() => {
    if (!user) {
      console.warn('User not loaded in ChildSetupScreen');
    } else {
      console.log('User loaded:', user.id, user.email);
    }
  }, [user]);

  // --- Handlers ---

  /** Adds a new empty child profile object to the `children` state array. */
  const addChild = useCallback(() => {
    setChildren(prevChildren => [...prevChildren, { fullName: "", age: "", dob: "", gender: "" }]);
  }, []);

  /**
   * Updates a specific child's data in the state array.
   * @param {number} index - The index of the child to update.
   * @param {ChildData} updatedChild - The new data for the child.
   */
  const updateChild = useCallback((index: number, updatedChild: ChildData) => {
    setChildren(prevChildren => {
      const newChildren = [...prevChildren];
      newChildren[index] = updatedChild;
      return newChildren;
    });
  }, []);

  /**
   * Removes a child profile from the state array based on index.
   * @param {number} index - The index of the child to remove.
   */
  const removeChild = useCallback((index: number) => {
    setChildren(prevChildren => prevChildren.filter((_, i) => i !== index));
  }, []);

  /** Displays a confirmation alert before navigating back (canceling setup). */
  const canceled = useCallback(() => {
    Alert.alert(
      'Cancel Setup',
      'Are you sure you want to cancel? Your progress will be lost.',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', style: 'destructive', onPress: () => router.back() },
      ]
    );
  }, []);

  /**
   * Checks if all required fields for all children are completed.
   * @returns {boolean} True if all fields are non-empty, false otherwise.
   */
  const isFormComplete = useCallback(() => {
    return children.every(
      (child) =>
        child.fullName?.trim() &&
        child.age?.trim() &&
        child.dob?.trim() &&
        child.gender?.trim()
    );
  }, [children]);

  /** Handles the final submission of the child setup data. */
  const handleDone = async () => {
    if (!isFormComplete()) {
      Alert.alert('Incomplete Form', 'Please fill in all child details before continuing.');
      return;
    }

    if (!momSetupData) {
      Alert.alert('Error', 'Mom setup data is missing. Please go back and complete mom setup first.');
      router.back();
      return;
    }

    if (!user || !user.id) {
      Alert.alert('Authentication Error', 'User session not found. Please log in again.');
      router.replace('/(auth)/SignInScreen');
      return;
    }

    setIsLoading(true);
    try {
      await completeSetup(children, user.id);
      console.log('Setup completed successfully!');
      show(); // Show the success modal
    } catch (error) {
      console.error('Error completing setup:', error);
      Alert.alert('Setup Error', 'Failed to complete setup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /** Handles the closure of the success modal and navigates to the Home screen. */
  const handleSuccessClose = useCallback(() => {
    hide();
    router.replace('/(tabs)/Home');
  }, [hide]);

  // --- Render ---

  return (
    <>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Set Up Children</Text>

          {/* Map over children state to render setup items */}
          {children.map((child, index) => (
        <ChildSetupItem
          key={index}
          index={index}
          childData={child}
          onUpdate={updateChild}
          onDelete={() => removeChild(index)} // always a function
        />
          ))}

          {/* Button to add another child */}
          <TouchableOpacity style={styles.addBtn} onPress={addChild}>
            <Text style={styles.addBtnText}>＋ Add Another Child</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Success Modal */}
        <SuccessModal
          visible={visible}
          onClose={handleSuccessClose}
          title="Setup Successful!"
          message="Your profile is ready. Let's get started!"
          iconComponent={
            // NOTE: The image source path should be verified to work in the final project structure
            <Image
              source={require('../../assets/images/success-icon.png')}
              style={styles.successIcon}
              accessibilityLabel="Success Icon"
            />
          }
        />

        {/* Bottom Buttons (Fixed Position) */}
        <View style={styles.bottomButtons}>
          <PrimaryButton
            title="Done"
            onPress={handleDone}
            disabled={!isFormComplete() || isLoading || !user}
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

// --- Styles ---

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundMain,
    flex: 1,
  },
  scrollView: {
    paddingHorizontal: ms(spacing.lg),
    paddingTop: vs(60), // Space for header content
    paddingBottom: vs(180), // Space for fixed bottom buttons
  },
  title: {
    ...typography.heading1,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: vs(spacing.xl),
  },
  addBtn: {
    alignSelf: 'center',
    marginVertical: vs(spacing.lg),
  },
  addBtnText: {
    ...typography.labelLarge,
    color: colors.primary,
  },
  bottomButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: ms(spacing.lg),
    paddingBottom: vs(spacing.xl),
    gap: vs(spacing.sm),
    backgroundColor: colors.backgroundMain,
    borderTopWidth: 1,
    borderTopColor: colors.backgroundSubtle,
    shadowColor: '#000',
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