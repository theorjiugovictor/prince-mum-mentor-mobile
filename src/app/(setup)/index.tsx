import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  StyleSheet
} from 'react-native';
import { colors, spacing, typography } from '@/src/core/styles';
import { ms, rbr, rfs, vs } from '@/src/core/styles/scaling';
import AddGoalModal from '../components/AddGoalModal';
import CustomInput from '../components/CustomInput';
import PrimaryButton from '../components/PrimaryButton';
import { router } from 'expo-router';

const momStatuses: string[] = ['Pregnant', 'New Mom', 'Toddler Mom', 'Mixed'];

const defaultGoals: string[] = [
  'Sleep',
  'Feeding',
  'Body Recovery',
  'Emotional Tracker',
  'Mental Wellness',
  'Routine Builder',
];

interface Errors {
  partnersName?: string;
  email?: string;
}

const MomSetupScreen: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(false);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newGoal, setNewGoal] = useState("");
  const [goals, setGoals] = useState<string[]>(defaultGoals);

  const [showInputs, setShowInputs] = useState<boolean>(false);
  const [partnersName, setPartnersName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [errors, setErrors] = useState<Errors>({});

  const toggleGoal = (goal: string) => {
    if (selectedGoals.includes(goal)) {
      setSelectedGoals(selectedGoals.filter(g => g !== goal));
    } else {
      setSelectedGoals([...selectedGoals, goal]);
    }
  };

  const handleAddGoal = () => {
  if (!newGoal.trim()) return;

  setGoals([...goals, newGoal]);
  setNewGoal("");
  setIsModalVisible(false);
};

const nextPage = () => {
  router.push('/childSetupScreen')
}

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        <Text style={styles.header}>Set Up</Text>

        {/* Mom Setup Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mom Set up</Text>

          <Text style={styles.label}>Mom Status</Text>
          <View style={styles.chipContainer}>
            {momStatuses.map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.chip,
                  selectedStatus === status && styles.chipSelected
                ]}
                onPress={() => setSelectedStatus(status)}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedStatus === status && styles.chipTextSelected
                  ]}
                >
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Goals */}
          <Text style={styles.label}>Goals</Text>
          <View style={styles.chipContainer}>
            {goals.map((goal) => (
              <TouchableOpacity
                key={goal}
                style={[
                  styles.chip,
                  selectedGoals.includes(goal) && styles.chipSelected
                ]}
                onPress={() => toggleGoal(goal)}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedGoals.includes(goal) && styles.chipTextSelected
                  ]}
                >
                  {goal}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.addChip} onPress={() => setIsModalVisible(true)}>
              <Text style={styles.addChipText}>+ Add</Text>
            </TouchableOpacity>
          </View>
          <AddGoalModal
            visible={isModalVisible}
            onClose={() => setIsModalVisible(false)}
            newGoal={newGoal}
            setNewGoal={setNewGoal}
            onAddGoal={handleAddGoal}
          />
        </View>

        {/* Optional Setup Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Optional Set up</Text>

          <Text style={styles.label}>Add Partner</Text>
          {!showInputs ? (
            <TouchableOpacity
              style={styles.addPartnerButton}
              onPress={() => setShowInputs(true)}
            >
              <Text style={styles.addPartnerText}>+ Add Partner</Text>
            </TouchableOpacity>
          ) : (
            <>
              <CustomInput
                label="Add Partner"
                placeholder="Enter Partners Name"
                value={partnersName}
                onChangeText={setPartnersName}
                isError={!!errors.partnersName}
                errorMessage={errors.partnersName}
                iconName="person-outline"
                isValid={partnersName.length > 0 && !errors.partnersName}
              />
              <CustomInput
                label="Email Address"
                placeholder="Enter Partner Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                isError={!!errors.email}
                errorMessage={errors.email}
                iconName="mail-outline"
                isValid={email.includes('@') && email.length > 0 && !errors.email}
              />
            </>
          )}

          <View style={styles.notificationRow}>
            <Text style={styles.label}>Prioritise Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.textGrey2, true: colors.primary }}
              thumbColor={notificationsEnabled ? colors.secondaryExtraLight : colors.secondaryExtraLight}
            />
          </View>
        </View>
        <PrimaryButton
          title="Next"
          onPress={nextPage}
        />
      </ScrollView>

      {/* <TouchableOpacity style={styles.nextButton}>
        <Text style={styles.nextButtonText}>Next</Text>
      </TouchableOpacity> */}
    </View>
  );
};

export default MomSetupScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundMain },
  scrollView: { flex: 1, paddingHorizontal: 20 },
  header: {
    ...typography.heading1,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: ms(60),
    marginBottom: vs(12),
  },
  section: { marginBottom: 30 },
  sectionTitle: { 
    ...typography.heading3,
    color: colors.textPrimary, 
    marginBottom: 20 
  },
  label: { 
    ...typography.labelLarge,
    color: colors.textPrimary, 
    marginBottom: 12, 
  },
  chipContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 10,
    marginBottom: 12, 
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: rbr(10),
    borderWidth: 1.2,
    borderColor: colors.outline,
  },
  chipSelected: {
    backgroundColor: colors.secondaryLight,
    borderColor: colors.backgroundStrong,
  },
  chipText: { 
    ...typography.labelMedium, 
    color: colors.textGrey1 
  },
  chipTextSelected: { color: '#111827', fontWeight: '500' },
  addChip: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: rbr(10),
    borderWidth: 1.2,
    borderColor: colors.outline,
  },
  addChipText: { 
     ...typography.labelMedium, 
    color: colors.textGrey1 
  },
  addPartnerButton: { 
    alignSelf: 'center', 
    marginBottom: 30 
  },
  addPartnerText: { 
    ...typography.labelLarge, 
    color: colors.primaryLight,  
  },
  notificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  nextButton: {
    backgroundColor: colors.primary,
    marginHorizontal: 20,
    marginBottom: 40,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: { 
    color: colors.textWhite, 
    fontSize: 16, 
    fontWeight: '600' 
  },
});
