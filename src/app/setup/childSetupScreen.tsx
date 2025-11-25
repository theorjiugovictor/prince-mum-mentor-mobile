// src/screens/setup/childSetupScreen.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import ChildSetupItem, { ChildData } from '../components/ChildSetupItem';
import { colors, typography, spacing } from '@/src/core/styles';
import { ms, vs } from '@/src/core/styles/scaling';
import PrimaryButton from '../components/PrimaryButton';
import { SuccessModal, useSuccessModal } from '../components/SucessModal';
import SecondaryButton from '../components/SecondaryButton';
import { router } from 'expo-router';
import { useSetup } from '../../core/hooks/setupContext';
import { useAuth } from '@/src/core/services/authContext';

const ChildSetupScreen = () => {
  const { completeSetup, momSetupData } = useSetup();
  const { user } = useAuth();

  const [children, setChildren] = useState<ChildData[]>([
    { fullName: '', age: '', dob: '', gender: '' },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const { visible, show, hide } = useSuccessModal();

  useEffect(() => {
    if (!user) {
      console.warn('User not loaded in ChildSetupScreen');
    } else {
      console.log('User loaded:', user.id, user.email);
    }
  }, [user]);

  const addChild = () => {
    setChildren([...children, { fullName: '', age: '', dob: '', gender: '' }]);
  };

  const updateChild = (index: number, updatedChild: ChildData) => {
    const newChildren = [...children];
    newChildren[index] = updatedChild;
    setChildren(newChildren);
  };

  const removeChild = (index: number) => {
    const updated = children.filter((_, i) => i !== index);
    setChildren(updated);
  };

  const canceled = () => {
    Alert.alert(
      'Cancel Setup',
      'Are you sure you want to cancel? Your progress will be lost.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: () => router.back()
        },
      ]
    );
  };

  const isFormComplete = () => {
    return children.every(child =>
      child.fullName?.trim() &&
      child.age?.trim() &&
      child.dob?.trim() &&
      child.gender?.trim()
    );
  };

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

    if (!user) {
      Alert.alert('Authentication Error', 'User session not found. Please log in again.');
      router.replace('/(auth)/SignInScreen');
      return;
    }

    if (!user.id) {
      Alert.alert('Authentication Error', 'User ID is missing. Please log in again.');
      router.replace('/(auth)/SignInScreen');
      return;
    }

    setIsLoading(true);

    try {
      await completeSetup(children, user.id);

      console.log('Setup completed successfully!');
      show();
    } catch (error) {
      console.error('Error completing setup:', error);
      Alert.alert('Setup Error', 'Failed to complete setup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccessClose = () => {
    hide();
    router.replace('/(tabs)/Home');
  };

  return (
    <>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Set Up</Text>

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

        {/* Success Modal */}
        <SuccessModal
          visible={visible}
          onClose={handleSuccessClose}
          title="Setup Successful!"
          message="Your profile is ready. Let's get started!"
          iconComponent={
            <Image
              source={require('../../assets/images/success-icon.png')}
              style={styles.successIcon}
            />
          }
        />

        {/* Bottom Buttons */}
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
