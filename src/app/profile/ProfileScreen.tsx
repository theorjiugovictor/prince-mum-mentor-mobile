import { logoutUser } from "@/src/core/services/authService";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState, useCallback } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// --- Component Imports ---
import EditProfileModal from "./EditProfileScreen";
import LogoutModal from "./LogoutModal";

/**
 * @fileoverview ProfileScreen component displaying user information and settings menu.
 * @exports ProfileScreen
 */
export default function ProfileScreen({ navigation }: any) {
  // --- State Variables ---
  const [modalVisible, setModalVisible] = useState(false); // Controls Edit Profile Modal
  const [showLogout, setShowLogout] = useState(false); // Controls Logout Confirmation Modal

  // --- Mock Data (Replace with real data fetch/context) ---
  const user = {
    name: "Tracy Michaels",
    role: "New mom",
    image: "https://i.pravatar.cc/150?img=5",
  };

  const child = {
    id: 1,
    name: "Child's info",
    description: "Manage your baby's profile, age, and key details.",
  };

  // --- Handlers ---

  /** Handles the final logout action after confirmation. */
  const handleLogout = useCallback(async () => {
    try {
      // Execute the logout service call
      await logoutUser();
      // Navigate to the sign-in screen
      router.replace("/(auth)/SignInScreen");
    } catch (error) {
      console.error("Error logging out:", error);
      // Optionally show an alert if logout fails
    }
  }, []);

  // --- Render ---
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* --- Profile Card --- */}
        <View style={styles.profileCard}>
          <Image
            source={{ uri: user.image }}
            style={styles.avatar}
            accessibilityLabel="User profile avatar"
          />
          <View style={styles.profileInfoCard}>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userRole}>{user.role}</Text>
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setModalVisible(true)}
              accessibilityLabel="Edit Profile"
            >
              <Text style={styles.editButtonText}>Edit profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* --- Your Children Section --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Children</Text>
          <View style={styles.menuItemWrapper}>
            <TouchableOpacity
              style={styles.childCard}
              onPress={() => router.push("/profile/ChildInfoScreen")}
              accessibilityRole="button"
              accessibilityLabel="Manage child's profile details"
            >
              <View style={styles.childInfo}>
                <Feather name="user" size={20} color="#666" />
                <View style={styles.childTextContainer}>
                  <Text style={styles.childName}>{child.name}</Text>
                  <Text style={styles.childDescription}>
                    {child.description}
                  </Text>
                </View>
              </View>
              <Feather name="chevron-right" size={20} color="#999" />
            </TouchableOpacity>
          </View>
        </View>

        {/* --- Account Settings Section --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <View style={styles.menuItemWrapper}>
            {/* Data & Privacy */}
            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemTop]}
              onPress={() => router.push("./profile/DataPrivacyScreen")}
              accessibilityRole="button"
            >
              <Feather name="shield" size={20} color="#666" />
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Data & Privacy</Text>
                <Text style={styles.menuSubtitle}>Manage your personal data</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#999" />
            </TouchableOpacity>

            {/* Password */}
            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemBottom]}
              onPress={() => router.push("./profile/ChangePasswordScreen")}
              accessibilityRole="button"
            >
              <Feather name="lock" size={20} color="#666" />
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Password</Text>
                <Text style={styles.menuSubtitle}>
                  Change or reset your account password
                </Text>
              </View>
              <Feather name="chevron-right" size={20} color="#999" />
            </TouchableOpacity>
          </View>
        </View>

        {/* --- Preferences Section --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.menuItemWrapper}>
            {/* Notification */}
            <TouchableOpacity style={styles.menuItem} accessibilityRole="button">
              <Feather name="bell" size={20} color="#666" />
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Notification</Text>
                <Text style={styles.menuSubtitle}>
                  Choose what notifications you'd like to receive
                </Text>
              </View>
              <Feather name="chevron-right" size={20} color="#999" />
            </TouchableOpacity>
          </View>
        </View>

        {/* --- Others Section --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Others</Text>
          <View style={styles.menuItemWrapper}>
            {/* About */}
            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemTop]}
              onPress={() => router.push("./profile/AboutScreen")}
              accessibilityRole="button"
            >
              <Feather name="info" size={20} color="#666" />
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>About Mum Meetup At Home</Text>
                <Text style={styles.menuSubtitle}>
                  Learn more about the app and our mission
                </Text>
              </View>
              <Feather name="chevron-right" size={20} color="#999" />
            </TouchableOpacity>

            {/* Log Out */}
            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemBottom]}
              onPress={() => setShowLogout(true)}
              accessibilityRole="button"
              accessibilityLabel="Log out of the account"
            >
              <Feather name="log-out" size={20} color="#E63946" />
              <View style={styles.menuTextContainer}>
                <Text style={[styles.menuTitle, { color: "#E63946" }]}>
                  Log Out
                </Text>
                <Text style={styles.menuSubtitle}>
                  Sign out of your account safely
                </Text>
              </View>
              <Feather name="chevron-right" size={20} color="#999" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.footerSpacing} />
      </ScrollView>

      {/* --- Modals --- */}
      <EditProfileModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
      <LogoutModal
        visible={showLogout}
        onCancel={() => setShowLogout(false)}
        onConfirm={handleLogout}
      />
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8", // Using a light background for the whole screen
  },
  scrollContent: {
    paddingBottom: 40, // Ensure content isn't cut off by the safe area bottom edge
  },
  header: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 26, // Increased size for better prominence
    fontWeight: "700", // Bolder weight
    color: "#333",
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    alignItems: "center",
    flexDirection: "row",
    gap: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileInfoCard: {
    flexDirection: "column",
    flex: 1,
  },
  profileInfo: {
    marginBottom: 16,
  },
  userName: {
    fontSize: 22, // Slightly larger name
    fontWeight: "800",
    marginBottom: 4,
    color: "#333",
  },
  userRole: {
    fontSize: 14,
    color: "#666",
  },
  editButton: {
    backgroundColor: "#E63946",
    paddingHorizontal: 20, // Adjusted padding
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: "flex-start", // Keep button tight to text
  },
  editButtonText: {
    color: "#FFF",
    fontWeight: "600",
  },
  section: {
    marginTop: 25, // Increased spacing between sections
  },
  sectionTitle: {
    fontSize: 18, // Slightly smaller title to distinguish from header
    fontWeight: "700",
    paddingHorizontal: 20,
    marginBottom: 10,
    color: "#333",
  },
  menuItemWrapper: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10, // Slightly more prominent rounded corners
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0", // Light border to define the group
    overflow: "hidden", // Ensures internal borders/separators work
  },
  childCard: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  childInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  childTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  childName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
    color: "#333",
  },
  childDescription: {
    fontSize: 12,
    color: "#888", // Darker subtle color
  },
  menuItem: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
  },
  menuItemTop: {
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0", // Separator line for items
  },
  menuItemBottom: {
    // Last item in the group, no bottom border needed within the wrapper
  },
  menuTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
    color: "#333",
  },
  menuSubtitle: {
    fontSize: 12,
    color: "#888",
  },
  footerSpacing: {
    height: 40,
  },
});