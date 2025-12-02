"use client";

import { colors, fontFamilies, spacing } from "@/src/core/styles";
import { ms, rfs, vs } from "@/src/core/styles/scaling";
import React, { useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type ImageSourcePropType,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PrimaryButton from "../PrimaryButton";

type ImageSource = ImageSourcePropType;

interface Comment {
  id: string;
  userId: string;
  authorName: string;
  authorAvatar: ImageSource;
  text: string;
  timeAgo: string;
}

interface PostDetailModalProps {
  visible: boolean;
  post: {
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
    commentsList?: Comment[];
  } | null;
  currentUserId?: string;
  onClose: () => void;
  onLike: (id: string) => void;
  onComment: (postId: string, comment: string) => void;
  isCommenting?: boolean;
}

const avatar = require("@/src/assets/images/profile-image.png");
const likeIcon = require("@/src/assets/images/new-like.png");

const PostDetailModal: React.FC<PostDetailModalProps> = ({
  visible,
  post,
  currentUserId,
  onClose,
  onLike,
  onComment,
  isCommenting = false,
}) => {
  const [commentText, setCommentText] = useState("");

  if (!post) return null;

  const handleSubmitComment = () => {
    if (commentText.trim()) {
      onComment(post.id, commentText.trim());
      setCommentText("");
    }
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentItem}>
      <Image source={item.authorAvatar} style={styles.commentAvatar} />
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentAuthor}>{item.authorName}</Text>
          <Text style={styles.commentTime}>{item.timeAgo}</Text>
        </View>
        <Text style={styles.commentText}>{item.text}</Text>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancel}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Post</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView
          style={styles.modalBody}
          contentContainerStyle={{ paddingBottom: vs(40) }}
        >
          <View style={styles.postCard}>
            <View style={styles.postHeader}>
              <View style={styles.postHeaderLeft}>
                <Image source={post.authorAvatar} style={styles.avatar} />
                <View>
                  <Text style={styles.authorName}>{post.authorName}</Text>
                  <Text style={styles.postMeta}>{post.timeAgo}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.postText}>{post.text}</Text>

            {post.image && (
              <Image
                source={post.image}
                style={styles.postImage}
                resizeMode="cover"
              />
            )}

            <View style={styles.postFooter}>
              <TouchableOpacity
                style={styles.footerButton}
                onPress={() => onLike(post.id)}
              >
                <Image
                  source={likeIcon}
                  style={[
                    styles.footerIcon,
                    post.isLiked && styles.footerIconActive,
                  ]}
                />
                <Text
                  style={[
                    styles.footerButtonText,
                    post.isLiked && styles.footerButtonTextActive,
                  ]}
                >
                  {post.likes}
                </Text>
              </TouchableOpacity>

              <View style={styles.footerButton}>
                <Text style={styles.footerButtonText}>
                  {post.comments} comments
                </Text>
              </View>
            </View>
          </View>

          {/* Comments Section */}
          <View style={styles.commentsSection}>
            <Text style={styles.commentsTitle}>Comments</Text>

            {post.commentsList && post.commentsList.length > 0 ? (
              <FlatList
                data={post.commentsList}
                keyExtractor={(item) => item.id}
                renderItem={renderComment}
                scrollEnabled={false}
              />
            ) : (
              <Text style={styles.emptyCommentsText}>
                No comments yet. Be the first to comment!
              </Text>
            )}

            {/* Add Comment */}
            <View style={styles.addCommentSection}>
              <Image source={avatar} style={styles.commentAvatar} />
              <View style={styles.commentInputContainer}>
                <TextInput
                  style={styles.commentInput}
                  value={commentText}
                  onChangeText={setCommentText}
                  placeholder="Write a comment..."
                  placeholderTextColor={colors.textGrey2}
                  multiline
                />
                <PrimaryButton
                  title={isCommenting ? "Posting..." : "Post"}
                  onPress={handleSubmitComment}
                  disabled={!commentText.trim() || isCommenting}
                  style={styles.commentButton}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: colors.backgroundMain,
    paddingVertical: vs(16),
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: ms(spacing.lg),
    paddingVertical: vs(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outlineVariant,
  },
  modalCancel: {
    fontFamily: fontFamilies.regular,
    fontSize: rfs(14),
    color: colors.textGrey2,
  },
  modalTitle: {
    fontFamily: fontFamilies.semiBold,
    fontSize: rfs(16),
    color: colors.textPrimary,
  },
  modalBody: {
    flex: 1,
  },
  postCard: {
    backgroundColor: colors.textWhite,
    borderRadius: ms(16),
    padding: ms(spacing.md),
    margin: ms(spacing.lg),
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
  commentsSection: {
    marginTop: vs(16),
    paddingHorizontal: ms(spacing.lg),
  },
  commentsTitle: {
    fontFamily: fontFamilies.semiBold,
    fontSize: rfs(14),
    color: colors.textPrimary,
    marginBottom: vs(12),
  },
  emptyCommentsText: {
    fontFamily: fontFamilies.regular,
    fontSize: rfs(13),
    color: colors.textGrey2,
    marginBottom: vs(16),
  },
  commentItem: {
    flexDirection: "row",
    marginBottom: vs(16),
  },
  commentAvatar: {
    width: ms(28),
    height: ms(28),
    borderRadius: ms(14),
    marginRight: ms(8),
  },
  commentContent: {
    flex: 1,
    backgroundColor: colors.backgroundMain,
    borderRadius: ms(12),
    padding: ms(spacing.sm),
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: vs(4),
  },
  commentAuthor: {
    fontFamily: fontFamilies.semiBold,
    fontSize: rfs(13),
    color: colors.textPrimary,
  },
  commentTime: {
    fontFamily: fontFamilies.regular,
    fontSize: rfs(11),
    color: colors.textGrey2,
  },
  commentText: {
    fontFamily: fontFamilies.regular,
    fontSize: rfs(13),
    color: colors.textPrimary,
    lineHeight: rfs(18),
  },
  addCommentSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: vs(16),
  },
  commentInputContainer: {
    flex: 1,
  },
  commentInput: {
    minHeight: vs(40),
    maxHeight: vs(120),
    backgroundColor: colors.backgroundSoft,
    borderRadius: ms(12),
    paddingHorizontal: ms(spacing.sm),
    paddingVertical: vs(8),
    fontFamily: fontFamilies.regular,
    fontSize: rfs(13),
    color: colors.textPrimary,
    marginBottom: vs(8),
  },
  commentButton: {
    alignSelf: "flex-end",
  },
});

export default PostDetailModal;
