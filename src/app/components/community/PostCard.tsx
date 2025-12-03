"use client";

import { colors, fontFamilies, spacing } from "@/src/core/styles";
import { ms, rfs, vs } from "@/src/core/styles/scaling";
import React from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ImageSourcePropType,
} from "react-native";

type ImageSource = ImageSourcePropType;

interface PostCardProps {
  id: string;
  userId: string;
  authorName: string;
  authorAvatar: ImageSource;
  timeAgo: string;
  text: string;
  image?: ImageSource;
  likes: number;
  comments: number;
  isLiked: boolean;
  currentUserId?: string;
  onLike: (id: string) => void;
  onComment: (id: string) => void;
  onOptions: (id: string) => void;
  onPress: (id: string) => void;
  isLiking?: boolean;
}

const likeIcon = require("@/src/assets/images/new-like.png");
const commentIcon = require("@/src/assets/images/new-comment.png");

const PostCard: React.FC<PostCardProps> = ({
  id,
  userId,
  authorName,
  authorAvatar,
  timeAgo,
  text,
  image,
  likes,
  comments,
  isLiked,
  currentUserId,
  onLike,
  onComment,
  onOptions,
  onPress,
  isLiking = false,
}) => {
  const isMyPost = currentUserId === userId;

  return (
    <Pressable onPress={() => onPress(id)} style={styles.postCard}>
      {/* Header */}
      <View style={styles.postHeader}>
        <View style={styles.postHeaderLeft}>
          <Image source={authorAvatar} style={styles.avatar} />
          <View>
            <Text style={styles.authorName}>{authorName}</Text>
            <Text style={styles.postMeta}>{timeAgo}</Text>
          </View>
        </View>

        {/* {isMyPost && (
          <TouchableOpacity
            onPress={() => onOptions(id)}
            accessibilityRole="button"
            accessibilityLabel="Post options"
          >
            <Text style={styles.moreText}>•••</Text>
          </TouchableOpacity>
        )} */}
      </View>

      {/* Body */}
      <Text style={styles.postText}>{text}</Text>

      {image && (
        <Image source={image} style={styles.postImage} resizeMode="cover" />
      )}

      {/* Footer */}
      <View style={styles.postFooter}>
        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => onLike(id)}
          disabled={isLiking}
        >
          <Image
            source={likeIcon}
            style={[styles.footerIcon, isLiked && styles.footerIconActive]}
          />
          <Text
            style={[
              styles.footerButtonText,
              isLiked && styles.footerButtonTextActive,
            ]}
          >
            {likes}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => onComment(id)}
        >
          <Image source={commentIcon} style={styles.footerIcon} />
          <Text style={styles.footerButtonText}>{comments}</Text>
        </TouchableOpacity>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  postCard: {
    backgroundColor: colors.textWhite,
    borderRadius: ms(16),
    padding: ms(spacing.md),
    marginTop: vs(12),
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: vs(8),
  },
  postHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: ms(32),
    height: ms(32),
    borderRadius: ms(16),
    marginRight: ms(8),
  },
  authorName: {
    fontFamily: fontFamilies.semiBold,
    fontSize: rfs(14),
    color: colors.textPrimary,
  },
  postMeta: {
    fontFamily: fontFamilies.regular,
    fontSize: rfs(12),
    color: colors.textGrey2,
  },
  moreText: {
    fontFamily: fontFamilies.bold,
    fontSize: rfs(18),
    color: colors.textGrey2,
  },
  postText: {
    marginTop: vs(4),
    fontFamily: fontFamilies.regular,
    fontSize: rfs(14),
    color: colors.textPrimary,
    lineHeight: rfs(20),
  },
  postImage: {
    marginTop: vs(8),
    borderRadius: ms(12),
    width: "100%",
    height: vs(200),
  },
  postFooter: {
    flexDirection: "row",
    marginTop: vs(8),
    gap: ms(16),
  },
  footerButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  footerIcon: {
    width: ms(16),
    height: ms(16),
    marginRight: ms(4),
    tintColor: colors.textGrey2,
  },
  footerIconActive: {
    tintColor: colors.primary,
  },
  footerButtonText: {
    fontFamily: fontFamilies.medium,
    fontSize: rfs(12),
    color: colors.textGrey2,
  },
  footerButtonTextActive: {
    color: colors.primary,
  },
});

export default PostCard;
