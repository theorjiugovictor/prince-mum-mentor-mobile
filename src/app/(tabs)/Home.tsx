import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { colors, fontFamilies, spacing, typography } from "../../core/styles";
import { ms } from "../../core/styles/scaling";

import { fetchTasks } from "@/src/core/services/tasksService";
import axios from "axios";
import PrimaryButton from "../components/PrimaryButton";
import SecondaryButton from "../components/SecondaryButton";

const heroImage = require("../../assets/images/home-image.png");
const profileImage = require("../../assets/images/profile-image.png");
const notificationIcon = require("../../assets/images/notification.png");
const resourceIcon = require("../../assets/images/resource-icon.png");
const journalIcon = require("../../assets/images/journal-icon.png");
const taskIcon = require("../../assets/images/task-icon.png");
const trashIcon = require("../../assets/images/trash.svg");
const tickChecked = require("../../assets/images/tick-square-checked.svg");
const tickUnchecked = require("../../assets/images/tick-square-unchecked.svg");
const successIcon = require("../../assets/images/success-icon.png");

const dummyTasks = [
  {
    id: "1",
    title: "Team meeting with marketing department",
    description: "Discuss Q4 marketing strategies and budget allocation",
    dateTime: "2024-03-15 10:00pm",
    completed: false,
  },
  {
    id: "2",
    title: "Review project proposal",
    description: "Review and provide feedback on the new client proposal",
    dateTime: "2024-03-15 02:30pm",
    completed: true,
  },
  {
    id: "3",
    title: "Submit expense report",
    description: "Compile and submit monthly expense report to finance",
    dateTime: "2024-03-15 04:00pm",
    completed: false,
  },
  {
    id: "4",
    title: "Team meeting with marketing department",
    description: "Discuss Q4 marketing strategies and budget allocation",
    dateTime: "2024-03-15 10:00pm",
    completed: false,
  },
  {
    id: "5",
    title: "Review project proposal",
    description: "Review and provide feedback on the new client proposal",
    dateTime: "2024-03-15 02:30pm",
    completed: true,
  },
  {
    id: "6",
    title: "Submit expense report",
    description: "Compile and submit monthly expense report to finance",
    dateTime: "2024-03-15 04:00pm",
    completed: false,
  },
];

type FeatherIconName = React.ComponentProps<typeof Feather>["name"];

const quickActions: {
  id: string;
  title: string;
  subtitle: string;
  icon: FeatherIconName;
}[] = [
  {
    id: "resources",
    title: "Resources",
    subtitle: "Track your daily Activity with ease",
    icon: "book",
  },
  {
    id: "journal",
    title: "Journal",
    subtitle: "Write about what you like to remember later",
    icon: "book-open",
  },
];

const HeaderIconButton = ({
  name,
  style,
}: {
  name: FeatherIconName;
  style?: ViewStyle;
}) => (
  <TouchableOpacity style={[styles.iconButton, style]} activeOpacity={0.8}>
    <Feather name={name} size={20} color={colors.textPrimary} />
  </TouchableOpacity>
);

const Home = () => {
  const [tasks, setTasks] = useState(dummyTasks);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  const [isLoadingDelete, setIsLoadingDelete] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;

    setIsLoadingDelete(true);

    try {
      await axios.delete(`/tasks/${taskToDelete}`);

      setShowDeleteConfirm(false);

      setShowDeleteSuccess(true);

      await fetchTasks();
    } catch (err) {
      console.error("Delete error:", err);
      Alert.alert("Error", "Failed to delete task. Try again.");
    } finally {
      setIsLoadingDelete(false);
      setTaskToDelete(null);
    }
  };

  const toggleTaskCompletion = (taskId: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  useEffect(() => {
    const response = fetchTasks();

    console.log(response);
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Top Bar */}
        <View style={styles.topBar}>
          <View>
            <View style={styles.greetingRow}>
              <Image source={profileImage} style={styles.profileAvatar} />
              <Text style={styles.greetingLabel}>Hi, Tracy</Text>
            </View>

            <Text style={styles.greetingTitle}>Good Morning</Text>
          </View>

          <Image source={notificationIcon} style={styles.notificationIcon} />
        </View>

        {/* Hero Section */}
        <View style={styles.heroCard}>
          <View style={styles.heroImageWrapper}>
            <Image source={heroImage} style={styles.heroImage} />
          </View>

          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>You are Amazing</Text>
            <Text style={styles.heroSubtitle}>
              {
                "You&apos;re growing right alongside your child,\nand that&apos;s something to be proud of"
              }
            </Text>

            <PrimaryButton
              title="Chat with Nora AI"
              onPress={() => {}}
              style={styles.heroButton}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <View style={styles.quickActions}>
            {quickActions.map((action) => (
              <View key={action.id} style={styles.quickActionCard}>
                {action.id === "journal" ? (
                  <Image
                    source={journalIcon}
                    style={[
                      styles.quickActionImage,
                      styles.quickActionIconSpacing,
                    ]}
                  />
                ) : action.id === "resources" ? (
                  <Image
                    source={resourceIcon}
                    style={[
                      styles.quickActionImage,
                      styles.quickActionIconSpacing,
                    ]}
                  />
                ) : (
                  <Feather
                    name={action.icon}
                    size={18}
                    color={colors.primary}
                    style={styles.quickActionIconSpacing}
                  />
                )}

                <Text style={styles.quickActionTitle}>{action.title}</Text>
                <Text style={styles.quickActionSubtitle}>
                  {action.subtitle}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Task Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{"Today's Task"}</Text>
            <TouchableOpacity onPress={() => console.log("View all tasks")}>
              <Text style={styles.viewAllLink}>View All</Text>
            </TouchableOpacity>
          </View>

          {tasks.length === 0 ? (
            <View style={styles.taskCard}>
              <Image source={taskIcon} style={styles.taskIcon} />
              <Text style={styles.taskEmptyTitle}>No task added yet</Text>
              <Text style={styles.taskEmptySubtitle}>
                {"Your today\u2019s task will be displayed here"}
              </Text>
              <SecondaryButton
                title="Add Task"
                onPress={() => {}}
                style={styles.taskButton}
              />
            </View>
          ) : (
            <View style={styles.taskListContainer}>
              {tasks.map((task) => (
                <View key={task.id} style={styles.taskItem}>
                  {/* Checkbox */}
                  <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => toggleTaskCompletion(task.id)}
                  >
                    <View>
                      {task.completed ? (
                        <Image
                          source={tickChecked}
                          style={{ width: 24, height: 24 }}
                        />
                      ) : (
                        <Image
                          source={tickUnchecked}
                          style={{ width: 24, height: 24 }}
                        />
                      )}
                    </View>
                  </TouchableOpacity>

                  {/* Task Content */}
                  <View style={styles.taskContent}>
                    <Text
                      style={[
                        styles.taskTitle,
                        task.completed && styles.taskTitleCompleted,
                      ]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {task.title}
                    </Text>
                    <Text style={styles.taskDateTime}>{task.dateTime}</Text>
                  </View>

                  {/* Delete Icon */}
                  <TouchableOpacity
                    onPress={() => {
                      setTaskToDelete(task.id);
                      setShowDeleteConfirm(true);
                    }}
                  >
                    <Image source={trashIcon} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      {/* Floating Add Button */}
      <TouchableOpacity style={styles.floatingButton} onPress={() => {}}>
        <Text style={styles.floatingButtonText}>+</Text>
      </TouchableOpacity>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        visible={showDeleteConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Image
              source={trashIcon}
              style={{ width: 24, height: 24, marginBottom: 10 }}
            />

            <Text style={styles.modalTitle}>Delete Task</Text>
            <Text style={styles.modalSubtitle}>
              Are you sure you want to delete this task?{"\n"}
              All information and progress will be lost.
            </Text>

            <PrimaryButton
              title="Delete"
              isLoading={isLoadingDelete}
              onPress={() => handleDeleteTask()}
              style={{ marginTop: 0 }}
            />

            <SecondaryButton
              title="Cancel"
              onPress={() => setShowDeleteConfirm(false)}
              style={{ marginTop: 10 }}
            />
          </View>
        </View>
      </Modal>

      {/* DELETE SUCCESS MODAL */}
      <Modal
        visible={showDeleteSuccess}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteSuccess(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Image
              source={successIcon}
              style={{ width: 57, height: 57, marginBottom: 15 }}
            />

            <Text style={styles.modalTitle}>Task deleted successfully</Text>

            <PrimaryButton
              title="Done"
              onPress={() => setShowDeleteSuccess(false)}
              style={{ marginTop: 20 }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundMain,
  },

  scrollContent: {
    paddingTop: ms(spacing.xl),
    paddingBottom: ms(spacing.xl * 1.5),
    paddingHorizontal: ms(spacing.lg),
    gap: ms(spacing.xl),
  },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(spacing.sm),
  },

  iconButton: {
    width: ms(24),
    height: ms(24),
    borderRadius: ms(12),
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.textWhite,
  },

  profileAvatar: {
    width: ms(24),
    height: ms(24),
    resizeMode: "cover",
  },

  notificationIcon: {
    width: ms(28),
    height: ms(28),
    resizeMode: "contain",
    alignSelf: "flex-start",
  },

  greetingLabel: {
    fontFamily: fontFamilies.medium,
    color: colors.textSecondary,
    marginBottom: ms(spacing.xs),
  },

  greetingTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: typography.heading2.fontSize,
    color: colors.textPrimary,
  },

  heroCard: {
    position: "relative",
    overflow: "hidden",
    backgroundColor: colors.textWhite,
    borderRadius: ms(16),
    borderWidth: 0.5,
    borderColor: colors.outline,
    padding: ms(spacing.lg),
    paddingRight: ms(70),
  },

  heroImageWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-start",
    alignItems: "flex-start",
    pointerEvents: "none",
    opacity: 0.8,
  },

  heroText: {
    gap: ms(10),
    zIndex: 1,
  },

  heroTitle: {
    fontFamily: fontFamilies.extraBold,
    fontSize: typography.heading3.fontSize,
    color: colors.textPrimary,
  },

  heroSubtitle: {
    fontFamily: fontFamilies.medium,
    fontSize: typography.bodySmall.fontSize,
    lineHeight: typography.bodySmall.fontSize * 1.3,
    color: colors.textGrey1,
  },

  heroButton: {
    marginTop: ms(spacing.sm),
    alignSelf: "flex-start",
    width: ms(170),
  },

  heroImage: {
    position: "absolute",
    width: ms(240),
    height: ms(200),
    top: -ms(17),
    right: -ms(20),
    resizeMode: "cover",
    borderTopLeftRadius: ms(32),
    borderBottomLeftRadius: ms(32),
  },

  section: {
    gap: ms(spacing.md),
  },

  sectionTitle: {
    fontFamily: fontFamilies.extraBold,
    fontSize: typography.heading3.fontSize,
    color: colors.textPrimary,
  },

  quickActions: {
    flexDirection: "row",
    gap: ms(spacing.md),
  },

  quickActionCard: {
    flex: 1,
    backgroundColor: colors.textWhite,
    borderRadius: ms(spacing.lg),
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: ms(spacing.md),
    gap: ms(spacing.sm),
  },

  quickActionImage: {
    width: ms(18),
    height: ms(18),
    resizeMode: "contain",
  },

  quickActionIconSpacing: {
    marginBottom: ms(spacing.xs),
  },

  quickActionTitle: {
    fontFamily: fontFamilies.semiBold,
    fontSize: typography.bodyMedium.fontSize,
    color: colors.textPrimary,
  },

  quickActionSubtitle: {
    fontFamily: fontFamilies.regular,
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  viewAllLink: {
    fontSize: 14,
    textDecorationLine: "underline",
  },

  taskCard: {
    backgroundColor: colors.textWhite,
    borderRadius: ms(spacing.lg),
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: ms(spacing.lg),
    alignItems: "center",
    gap: ms(spacing.sm),
  },

  taskIcon: {
    marginBottom: ms(spacing.sm),
    width: ms(32),
    height: ms(32),
    resizeMode: "contain",
  },

  taskEmptyTitle: {
    fontFamily: fontFamilies.semiBold,
    fontSize: typography.bodyMedium.fontSize,
    color: colors.textPrimary,
  },

  taskEmptySubtitle: {
    fontFamily: fontFamilies.regular,
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    textAlign: "center",
    maxWidth: "75%",
    alignSelf: "center",
  },

  taskButton: {
    marginTop: ms(spacing.sm),
    width: "55%",
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: colors.primary,
  },
  taskButtonText: {
    color: colors.primary,
  },
  taskListContainer: {
    gap: 12,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  checkboxContainer: {
    marginRight: 9,
    alignSelf: "flex-start",
  },

  taskContent: {
    flex: 1,
    marginRight: 12,
  },
  taskTitle: {
    fontSize: 16,
    color: "#1F1F1F",
    marginBottom: 4,
  },
  taskTitleCompleted: {
    textDecorationLine: "line-through",
    color: "#999999",
  },
  taskDateTime: {
    fontSize: 14,
    color: "#6B6B6B",
  },

  addTaskButton: {
    marginTop: 8,
  },
  floatingButton: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 55,
    height: 55,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 12,
    zIndex: 999,
  },

  floatingButtonText: {
    color: "#fff",
    fontSize: 30,
    marginTop: -3,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },

  modalBox: {
    backgroundColor: "#fff",
    padding: 24,
    width: "85%",
    borderRadius: 8,
    alignItems: "center",
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },

  modalSubtitle: {
    textAlign: "center",
    fontSize: 14,
    wordWrap: "nowrap",
    color: "#3A3A3A",
    marginBottom: 20,
  },

  successIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#E5F9EC",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
});
