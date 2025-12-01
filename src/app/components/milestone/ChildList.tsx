import { getChildProfiles } from "@/src/core/services/milestoneService";
import { colors, typography } from "@/src/core/styles";
import { getChildInitials } from "@/src/core/utils/avatar";
import { getAge } from "@/src/core/utils/dates";
import { showToast } from "@/src/core/utils/toast";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ChildList() {
  const router = useRouter();

  const {
    data: childProfiles,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["child-profiles"],
    queryFn: getChildProfiles,
  });

  function handleChildPress(childId: string, childName: string) {
    if (!childId || !childName) return;
    router.push({
      pathname: "/child-milestone/[id]",
      params: { id: childId, name: childName },
    });
  }

  function handleAddChild() {
    router.push("/profile/ChildInfoScreen");
  }

  if (error) {
    showToast.error((error as any)?.message || "Something went wrong");
  }

  const children = childProfiles?.children ?? [];

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100%",
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Empty state when no children
  if (children.length === 0) {
    return (
      <View style={styles.emptyStateContainer}>
        <Text style={styles.emptyStateTitle}>No Children Added Yet</Text>
        <Text style={styles.emptyStateDesc}>
          Add your child&apos;s profile to start tracking their milestones and
          development journey.
        </Text>
        <TouchableOpacity
          style={styles.addChildButton}
          onPress={handleAddChild}
        >
          <Text style={styles.addChildButtonText}>Add Child Profile</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.childContainer}>
      {children.map((child) => (
        <TouchableOpacity
          key={child.id}
          style={styles.childBox}
          onPress={() => handleChildPress(child.id, child.full_name)}
        >
          {child.profile_picture_url ? (
            <Image
              source={{
                uri:
                  child.profile_picture_url || "https://via.placeholder.com/53",
              }}
              style={styles.childBoxAvatar}
            />
          ) : (
            <View
              style={[
                styles.avatarContainer,
                {
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: getChildInitials(child.full_name)
                    .backgroundColor,
                },
              ]}
            >
              <Text style={[styles.initials, { fontSize: 26 * 0.75 }]}>
                {getChildInitials(child.full_name).initials}
              </Text>
            </View>
          )}

          <View style={styles.childBoxTextBox}>
            <Text style={styles.childBoxTitle}>
              {child.full_name || "Unknown"}
            </Text>
            <Text style={styles.childBoxDesc}>
              {getAge(child.date_of_birth)} old
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    backgroundColor: "white",
    minHeight: "100%",
  },
  emptyStateImage: {
    width: 200,
    height: 200,
    marginBottom: 24,
  },
  emptyStateTitle: {
    ...typography.heading2,
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateDesc: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  addChildButton: {
    backgroundColor: colors.primary || "#007AFF",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  addChildButtonText: {
    ...typography.labelLarge,
    color: "white",
    fontWeight: "600",
  },
  avatarContainer: {
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#fff",
  },
  initials: {
    ...typography.labelLarge,
    color: "#555",
    fontWeight: "bold",
  },
  childBoxDesc: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  childBoxTitle: {
    ...typography.heading3,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  childBoxTextBox: { gap: 4 },
  childBoxAvatar: {
    width: 53.27,
    height: 53.27,
    borderRadius: 100,
  },
  childBox: {
    padding: 16,
    gap: 16,
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
  },
  childContainer: {
    gap: 24,
    marginTop: 24,
    flex: 1,
    backgroundColor: "white",
  },
});
