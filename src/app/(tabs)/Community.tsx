"use client";

import { useRouter } from "expo-router";
import type React from "react";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  type ImageSourcePropType,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, typography } from "../../core/styles";
import { ms, rfs, vs } from "../../core/styles/scaling";

import {
  useCommentOnPost,
  useCommunityPosts,
  useCreatePost,
  useDeletePost,
  useSinglePost,
  useToggleLike,
} from "@/src/core/hooks/useCommunity";
import { useGetUserProfile } from "@/src/core/hooks/useGetUserProfile";

// Import components
import CreatePostModal from "../components/community/CreatePostModal";
import DeleteConfirmModal from "../components/community/DeleteConfirmModal";
import PostCard from "../components/community/PostCard";
import PostDetailModal from "../components/community/PostDetailModal";
import PostOptionsModal from "../components/community/PostOptionsModal";

type ImageSource = ImageSourcePropType;

type CommunityPost = {
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
  commentsList?: any[];
};

const avatar = require("../../assets/images/profile-image.png");

interface Props {
  userId?: string;
  currentUserId?: string; // The logged-in user's ID
}

const Community: React.FC<Props> = () => {
  const router = useRouter();
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isOptionsModalVisible, setIsOptionsModalVisible] = useState(false);
  const [isDeleteConfirmVisible, setIsDeleteConfirmVisible] = useState(false);
  const [isPostDetailVisible, setIsPostDetailVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [allPosts, setAllPosts] = useState<CommunityPost[]>([]);
  const [totalPages, setTotalPages] = useState(1);

  const [createText, setCreateText] = useState("");
  const [createTitle, setCreateTitle] = useState("");
  const [createImage, setCreateImage] = useState<ImageSource | undefined>();
  const [createPhotoIds, setCreatePhotoIds] = useState<string[]>([]);

  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [postIdForOptions, setPostIdForOptions] = useState<string | null>(null);
  const [postIdForDelete, setPostIdForDelete] = useState<string | null>(null);

  const {
    data: postsResponse,
    isLoading,
    error,
  } = useCommunityPosts(currentPage, 20);
  const { data: selectedPost } = useSinglePost(selectedPostId);
  const toggleLikeMutation = useToggleLike();
  const createPostMutation = useCreatePost();
  const commentMutation = useCommentOnPost();
  const deletePostMutation = useDeletePost();
  const { getAll: currentUser } = useGetUserProfile();

  console.log("user profile", currentUser.data?.data);

  useEffect(() => {
    if (postsResponse?.posts) {
      if (currentPage === 1) {
        setAllPosts(transformPosts(postsResponse.posts));
      } else {
        setAllPosts((prev) => [
          ...prev,
          ...transformPosts(postsResponse.posts),
        ]);
      }

      if (postsResponse.meta) {
        setTotalPages(postsResponse.meta.total_pages || 1);
      }
    }
  }, [postsResponse]);

  const transformPosts = (apiPosts: any[]): CommunityPost[] => {
    return apiPosts.map((post: any) => ({
      id: post.id,
      userId: post.user_id,
      authorName:
        post.authorName ||
        post.author_name ||
        post?.user?.full_name ||
        "Anonymous",
      authorAvatar: avatar,
      timeAgo: formatTimeAgo(post.createdAt || post.created_at),
      text: post.content || post.text || "",
      image: post?.photos?.[0]?.url,
      likes: post.likes_count || 0,
      comments: post.comments_count || 0,
      isLiked: post.is_liked || false,
      commentsList: post.comments || [],
    }));
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
  };

  // ---- Actions ----

  const openCreateModal = () => {
    setCreateText("");
    setCreateTitle("");
    setCreateImage(undefined);
    setCreatePhotoIds([]);
    setIsCreateModalVisible(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalVisible(false);
  };

  const handleSubmitPost = async () => {
    if (!createText.trim() && !createTitle.trim()) {
      return;
    }

    try {
      await createPostMutation.mutateAsync({
        title: createTitle.trim(),
        content: createText.trim(),
        photo_ids: createPhotoIds.length > 0 ? createPhotoIds : undefined,
      });

      setIsCreateModalVisible(false);
      setCreateText("");
      setCreateTitle("");
      setCreateImage(undefined);
      setCreatePhotoIds([]);
    } catch (err) {
      console.error("Failed to create post:", err);
    }
  };

  const handleToggleLike = async (id: string) => {
    try {
      await toggleLikeMutation.mutateAsync(id, {
        onSuccess(data, variables, onMutateResult, context) {},
      });
    } catch (err) {
      console.error("Failed to toggle like:", err);
    }
  };

  const handleComment = async (postId: string, comment: string) => {
    try {
      await commentMutation.mutateAsync({
        postId,
        comment,
      });
    } catch (err) {
      console.error("Failed to comment:", err);
    }
  };

  const openOptionsForPost = (id: string) => {
    setPostIdForOptions(id);
    setIsOptionsModalVisible(true);
  };

  const closeOptionsModal = () => {
    setIsOptionsModalVisible(false);
    setPostIdForOptions(null);
  };

  const handleEditPost = () => {
    closeOptionsModal();
    if (postIdForOptions) {
      openPostDetail(postIdForOptions);
    }
  };

  const openDeleteConfirm = () => {
    setPostIdForDelete(postIdForOptions);
    setIsOptionsModalVisible(false);
    setIsDeleteConfirmVisible(true);
  };

  const confirmDeletePost = async () => {
    if (!postIdForDelete) return;

    try {
      await deletePostMutation.mutateAsync(postIdForDelete);
      setIsDeleteConfirmVisible(false);
      setPostIdForDelete(null);

      // Remove post from local state
      setAllPosts((prev) => prev.filter((p) => p.id !== postIdForDelete));
    } catch (err) {
      console.error("Failed to delete post:", err);
      setIsDeleteConfirmVisible(false);
    }
  };

  const openPostDetail = (id: string) => {
    setSelectedPostId(id);
    setIsPostDetailVisible(true);
  };

  const closePostDetail = () => {
    setIsPostDetailVisible(false);
    setSelectedPostId(null);
  };

  const handleEndReached = () => {
    if (currentPage < totalPages && !isLoading) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  // ---- Render helpers ----

  const renderPostItem = ({ item }: { item: CommunityPost }) => (
    <PostCard
      {...item}
      currentUserId={currentUser.data?.data.id}
      onLike={handleToggleLike}
      onComment={openPostDetail}
      onOptions={openOptionsForPost}
      onPress={openPostDetail}
      isLiking={toggleLikeMutation.isPending}
    />
  );

  const selectedPostData = selectedPost
    ? transformPosts([selectedPost])[0]
    : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.backgroundMain}
      />

      <View style={styles.container}>
        {/* Top bar */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Image
                source={require("../../assets/images/arrow.png")}
                style={styles.arrowImage}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Community</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            Connect with mums, ask questions and share your journey.
          </Text>
        </View>

        {/* Feed */}
        {isLoading && currentPage === 1 ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : error ? (
          <View style={styles.loaderContainer}>
            <Text style={styles.errorText}>Failed to load posts</Text>
          </View>
        ) : (
          <FlatList
            data={allPosts}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={renderPostItem}
            showsVerticalScrollIndicator={false}
            onEndReachedThreshold={0.1}
            onEndReached={handleEndReached}
            ListFooterComponent={
              isLoading && currentPage > 1 ? (
                <View style={styles.paginationLoader}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : null
            }
          />
        )}

        {/* Floating create button */}
        <TouchableOpacity
          style={styles.fab}
          onPress={openCreateModal}
          accessibilityRole="button"
          accessibilityLabel="Create new post"
        >
          <Text style={styles.fabText}>＋</Text>
        </TouchableOpacity>
      </View>

      {/* Create Post Modal */}
      <CreatePostModal
        visible={isCreateModalVisible}
        title={createTitle}
        content={createText}
        image={createImage}
        isSubmitting={createPostMutation.isPending}
        onClose={closeCreateModal}
        onSubmit={handleSubmitPost}
        onTitleChange={setCreateTitle}
        onContentChange={setCreateText}
      />

      {/* Post Options Bottom Sheet */}
      <PostOptionsModal
        visible={isOptionsModalVisible}
        onClose={closeOptionsModal}
        onEdit={handleEditPost}
        onDelete={openDeleteConfirm}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        visible={isDeleteConfirmVisible}
        onCancel={() => setIsDeleteConfirmVisible(false)}
        onConfirm={confirmDeletePost}
        isDeleting={deletePostMutation.isPending}
      />

      {/* Full Post Detail Modal */}
      <PostDetailModal
        visible={isPostDetailVisible}
        post={selectedPostData}
        currentUserId={currentUser.data?.data.id}
        onClose={closePostDetail}
        onLike={handleToggleLike}
        onComment={handleComment}
        isCommenting={commentMutation.isPending}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.backgroundMain,
  },
  container: {
    flex: 1,
    backgroundColor: colors.backgroundMain,
    paddingHorizontal: ms(spacing.lg),
    paddingVertical: ms(spacing.lg),
  },
  header: {
    paddingTop: vs(10),
    paddingBottom: vs(4),
  },
  headerTitle: {
    ...typography.heading2,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    marginTop: vs(4),
    ...typography.bodySmall,
    color: colors.textGrey2,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    ...typography.bodyMedium,
    color: colors.error,
    textAlign: "center",
  },
  listContent: {
    paddingBottom: vs(100),
  },
  fab: {
    position: "absolute",
    right: ms(spacing.lg),
    bottom: vs(30),
    width: ms(56),
    height: ms(56),
    borderRadius: ms(8),
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  fabText: {
    color: colors.textWhite,
    fontSize: rfs(32),
    fontWeight: "300" as any,
    marginTop: -2,
  },
  paginationLoader: {
    paddingVertical: vs(16),
    alignItems: "center",
    justifyContent: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  backButton: {
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xs,
  },
  arrowImage: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
});

export default Community;
