"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  Image,
  type ImageSourcePropType,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { colors, fontFamilies, spacing, typography } from "../../core/styles"
import { ms, rfs, vs } from "../../core/styles/scaling"

import { useCommentOnPost, useCommunityPosts, useCreatePost, useSinglePost, useToggleLike } from "@/src/core/hooks/useCommunity"
import PrimaryButton from "../components/PrimaryButton"
import SecondaryButton from "../components/SecondaryButton"


type ImageSource = ImageSourcePropType

type CommunityPost = {
  id: string
  authorName: string
  authorAvatar: ImageSource
  timeAgo: string
  text: string
  image?: ImageSource
  likes: number
  comments: number
  isLiked: boolean
}

const avatar = require("../../assets/images/profile-image.png")
const placeholderImage = require("../../assets/images/home-image.png")
const likeIcon = require("../../assets/images/new-like.png")
const commentIcon = require("../../assets/images/new-comment.png")

// Mock gallery images just to simulate the "select photos" screen
const GALLERY_IMAGES: ImageSource[] = [
  require("../../assets/images/home-image.png"),
  require("../../assets/images/task-icon.png"),
  require("../../assets/images/resource-icon.png"),
  require("../../assets/images/journal-icon.png"),
  require("../../assets/images/notification.png"),
  require("../../assets/images/user.png"),
]

interface Props {
  userId?: string // removed as required parameter since we're now fetching all posts
}

const Community: React.FC<Props> = ({ userId }) => {
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false)
  const [isGalleryModalVisible, setIsGalleryModalVisible] = useState(false)
  const [isOptionsModalVisible, setIsOptionsModalVisible] = useState(false)
  const [isDeleteConfirmVisible, setIsDeleteConfirmVisible] = useState(false)
  const [isDeleteSuccessVisible, setIsDeleteSuccessVisible] = useState(false)
  const [isPostDetailVisible, setIsPostDetailVisible] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [allPosts, setAllPosts] = useState<CommunityPost[]>([])
  const [totalPages, setTotalPages] = useState(1)

  const [createText, setCreateText] = useState("")
  const [createTitle, setCreateTitle] = useState("")
  const [createImage, setCreateImage] = useState<ImageSource | undefined>()
  const [createPhotoIds, setCreatePhotoIds] = useState<string[]>([])

  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [postIdForOptions, setPostIdForOptions] = useState<string | null>(null)
  const [postIdForDelete, setPostIdForDelete] = useState<string | null>(null)

  const { data: postsResponse, isLoading, error } = useCommunityPosts(currentPage, 20)
  const { data: selectedPost } = useSinglePost(selectedPostId)
  const toggleLikeMutation = useToggleLike()
  const createPostMutation = useCreatePost()
  const commentMutation = useCommentOnPost()

  useEffect(() => {
    if (postsResponse?.posts) {
      if (currentPage === 1) {
        setAllPosts(transformPosts(postsResponse.posts))
      } else {
        setAllPosts((prev) => [...prev, ...transformPosts(postsResponse.posts)])
      }

      if (postsResponse.meta) {
        setTotalPages(postsResponse.meta.total_pages || 1)
      }
    }
  }, [postsResponse])

  const transformPosts = (apiPosts: any[]): CommunityPost[] => {
    return apiPosts.map((post: any) => ({
      id: post.id,
      authorName: post.authorName || post.author_name || "Anonymous",
      authorAvatar: avatar,
      timeAgo: formatTimeAgo(post.createdAt || post.created_at),
      text: post.content || post.text || "",
      image: post.image || placeholderImage,
      likes: post.likes || 0,
      comments: post.comments || 0,
      isLiked: post.isLiked || false,
    }))
  }

  const posts: CommunityPost[] = allPosts

  const postForOptions = useMemo(() => posts.find((p) => p.id === postIdForOptions) || null, [posts, postIdForOptions])

  const postForDelete = useMemo(() => posts.find((p) => p.id === postIdForDelete) || null, [posts, postIdForDelete])

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return "Just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`
    return `${Math.floor(diffInSeconds / 86400)}d`
  }

  // ---- Actions ----

  const openCreateModal = () => {
    setCreateText("")
    setCreateTitle("")
    setCreateImage(undefined)
    setCreatePhotoIds([])
    setIsCreateModalVisible(true)
  }

  const closeCreateModal = () => {
    setIsCreateModalVisible(false)
  }

  const handleSubmitPost = async () => {
    if (!createText.trim() && !createTitle.trim()) {
      return
    }

    try {
      await createPostMutation.mutateAsync({
        title: createTitle.trim(),
        content: createText.trim(),
        photo_ids: createPhotoIds.length > 0 ? createPhotoIds : undefined,
      })

      setIsCreateModalVisible(false)
      setCreateText("")
      setCreateTitle("")
      setCreateImage(undefined)
      setCreatePhotoIds([])
    } catch (err) {
      console.error("[v0] Failed to create post:", err)
    }
  }

  const handleToggleLike = async (id: string) => {
    try {
      await toggleLikeMutation.mutateAsync(id)
    } catch (err) {
      console.error("[v0] Failed to toggle like:", err)
    }
  }

  const openOptionsForPost = (id: string) => {
    setPostIdForOptions(id)
    setIsOptionsModalVisible(true)
  }

  const closeOptionsModal = () => {
    setIsOptionsModalVisible(false)
    setPostIdForOptions(null)
  }

  const openDeleteConfirm = () => {
    if (!postForOptions) return
    setPostIdForDelete(postForOptions.id)
    setIsOptionsModalVisible(false)
    setIsDeleteConfirmVisible(true)
  }

  const confirmDeletePost = () => {
    if (!postIdForDelete) return
    setIsDeleteConfirmVisible(false)
    setPostIdForDelete(null)
    setIsDeleteSuccessVisible(true)
  }

  const openGallery = () => {
    setIsGalleryModalVisible(true)
  }

  const selectGalleryImage = (img: ImageSource) => {
    setCreateImage(img)
    setIsGalleryModalVisible(false)
  }

  const openPostDetail = (id: string) => {
    setSelectedPostId(id)
    setIsPostDetailVisible(true)
  }

  const closePostDetail = () => {
    setIsPostDetailVisible(false)
    setSelectedPostId(null)
  }

  const handleEndReached = () => {
    if (currentPage < totalPages && !isLoading) {
      setCurrentPage((prev) => prev + 1)
    }
  }

  // ---- Render helpers ----

  const renderPostItem = ({ item }: { item: CommunityPost }) => (
    <Pressable onPress={() => openPostDetail(item.id)} style={styles.postCard}>
      {/* Header */}
      <View style={styles.postHeader}>
        <View style={styles.postHeaderLeft}>
          <Image source={item.authorAvatar} style={styles.avatar} />
          <View>
            <Text style={styles.authorName}>{item.authorName}</Text>
            <Text style={styles.postMeta}>{item.timeAgo}</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => openOptionsForPost(item.id)}
          accessibilityRole="button"
          accessibilityLabel="Post options"
        >
          <Text style={styles.moreText}>•••</Text>
        </TouchableOpacity>
      </View>

      {/* Body */}
      <Text style={styles.postText}>{item.text}</Text>

      {item.image && <Image source={item.image} style={styles.postImage} resizeMode="cover" />}

      {/* Footer */}
      <View style={styles.postFooter}>
        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => handleToggleLike(item.id)}
          disabled={toggleLikeMutation.isPending}
        >
          <Image source={likeIcon} style={[styles.footerIcon, item.isLiked && styles.footerIconActive]} />
          <Text style={[styles.footerButtonText, item.isLiked && styles.footerButtonTextActive]}>{item.likes}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.footerButton} onPress={() => openPostDetail(item.id)}>
          <Image source={commentIcon} style={styles.footerIcon} />
          <Text style={styles.footerButtonText}>{item.comments}</Text>
        </TouchableOpacity>
      </View>
    </Pressable>
  )

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
    modalPostButton: {
      fontFamily: fontFamilies.semiBold,
      fontSize: rfs(14),
      color: colors.primary,
    },
    modalPostButtonDisabled: {
      color: colors.textGrey2,
    },
    modalBody: {
      flex: 1,
    },
    createRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: vs(12),
      marginBottom: vs(12),
      paddingHorizontal: ms(spacing.lg),
    },
    createAuthor: {
      fontFamily: fontFamilies.medium,
      fontSize: rfs(14),
      color: colors.textPrimary,
    },
    textInput: {
      minHeight: vs(40),
      textAlignVertical: "top",
      fontFamily: fontFamilies.regular,
      fontSize: rfs(14),
      color: colors.textPrimary,
      paddingHorizontal: ms(spacing.lg),
      marginBottom: vs(12),
      borderRadius: ms(8),
      borderWidth: 1,
      borderColor: colors.outlineVariant,
    },
    selectedImage: {
      marginTop: vs(12),
      borderRadius: ms(12),
      width: "100%",
      height: vs(200),
      marginHorizontal: ms(spacing.lg),
    },
    createActions: {
      marginTop: vs(20),
      paddingHorizontal: ms(spacing.lg),
    },
    addPhotoButton: {
      alignSelf: "flex-start",
    },
    galleryGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      paddingHorizontal: ms(spacing.lg),
      paddingTop: vs(12),
    },
    galleryItem: {
      width: "30%",
      aspectRatio: 1,
      margin: "1.5%",
      borderRadius: ms(10),
      overflow: "hidden",
    },
    galleryImage: {
      width: "100%",
      height: "100%",
    },
    bottomSheetOverlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0,0,0,0.4)",
    },
    bottomSheet: {
      backgroundColor: colors.textWhite,
      borderTopLeftRadius: ms(20),
      borderTopRightRadius: ms(20),
      paddingHorizontal: ms(spacing.lg),
      paddingTop: vs(16),
      paddingBottom: vs(30),
    },
    sheetHandle: {
      alignSelf: "center",
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.outlineVariant,
      marginBottom: vs(12),
    },
    sheetTitle: {
      fontFamily: fontFamilies.medium,
      fontSize: rfs(14),
      color: colors.textPrimary,
      marginBottom: vs(12),
    },
    sheetButton: {
      paddingVertical: vs(12),
    },
    sheetButtonDestructive: {
      marginTop: vs(8),
    },
    sheetButtonText: {
      fontFamily: fontFamilies.regular,
      fontSize: rfs(14),
      color: colors.textPrimary,
    },
    sheetButtonTextDanger: {
      color: colors.error,
    },
    sheetCancel: {
      marginTop: vs(16),
      paddingVertical: vs(8),
    },
    sheetCancelText: {
      fontFamily: fontFamilies.medium,
      fontSize: rfs(14),
      color: colors.textGrey2,
      textAlign: "center",
    },
    centerOverlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.35)",
    },
    confirmCard: {
      width: "80%",
      backgroundColor: colors.textWhite,
      borderRadius: ms(16),
      padding: ms(spacing.xl),
    },
    confirmTitle: {
      fontFamily: fontFamilies.semiBold,
      fontSize: rfs(16),
      color: colors.textPrimary,
      marginBottom: vs(12),
    },
    confirmText: {
      fontFamily: fontFamilies.regular,
      fontSize: rfs(13),
      color: colors.textGrey2,
      marginBottom: vs(20),
      lineHeight: rfs(18),
    },
    confirmButtons: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: ms(10),
    },
    confirmButton: {
      flex: 1,
    },
    confirmDeleteButton: {
      flex: 1,
    },
    successCard: {
      width: "70%",
      backgroundColor: colors.textWhite,
      borderRadius: ms(16),
      padding: ms(spacing.xl),
      alignItems: "center",
    },
    successIconCircle: {
      width: ms(60),
      height: ms(60),
      borderRadius: ms(30),
      backgroundColor: colors.successLight,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: vs(16),
    },
    successIconText: {
      fontFamily: fontFamilies.bold,
      fontSize: rfs(26),
      color: colors.success,
    },
    successTitle: {
      fontFamily: fontFamilies.medium,
      fontSize: rfs(16),
      color: colors.textPrimary,
      marginBottom: vs(16),
    },
    successButton: {
      width: "100%",
    },
    commentsSection: {
      marginTop: vs(16),
      paddingHorizontal: ms(spacing.lg),
    },
    commentsTitle: {
      fontFamily: fontFamilies.semiBold,
      fontSize: rfs(14),
      color: colors.textPrimary,
      marginBottom: vs(8),
    },
    emptyCommentsText: {
      fontFamily: fontFamilies.regular,
      fontSize: rfs(13),
      color: colors.textGrey2,
    },
    paginationLoader: {
      paddingVertical: vs(16),
      alignItems: "center",
      justifyContent: "center",
    },
  })

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.backgroundMain} />

      <View style={styles.container}>
        {/* Top bar */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Community</Text>
          <Text style={styles.headerSubtitle}>Connect with mums, ask questions and share your journey.</Text>
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
            data={posts}
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
      <Modal visible={isCreateModalVisible} animationType="slide" onRequestClose={closeCreateModal}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeCreateModal}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create Post</Text>
            <TouchableOpacity
              disabled={(!createText.trim() && !createTitle.trim()) || createPostMutation.isPending}
              onPress={handleSubmitPost}
            >
              <Text
                style={[
                  styles.modalPostButton,
                  !createText.trim() && !createTitle.trim() && styles.modalPostButtonDisabled,
                ]}
              >
                {createPostMutation.isPending ? "Posting..." : "Post"}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} contentContainerStyle={{ paddingBottom: vs(40) }}>
            <View style={styles.createRow}>
              <Image source={avatar} style={styles.avatar} />
              <Text style={styles.createAuthor}>Posting as You</Text>
            </View>

            <TextInput
              style={styles.textInput}
              value={createTitle}
              onChangeText={setCreateTitle}
              placeholder="Title (optional)"
              placeholderTextColor={colors.textGrey2}
            />

            <TextInput
              style={styles.textInput}
              value={createText}
              onChangeText={setCreateText}
              placeholder="Write something..."
              placeholderTextColor={colors.textGrey2}
              multiline
            />

            {createImage && <Image source={createImage} style={styles.selectedImage} resizeMode="cover" />}
            <View style={styles.createActions}>
              <SecondaryButton title="Add photo" onPress={openGallery} style={styles.addPhotoButton} />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Gallery Modal */}
      <Modal
        visible={isGalleryModalVisible}
        animationType="slide"
        onRequestClose={() => setIsGalleryModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsGalleryModalVisible(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Photo</Text>
            <View style={{ width: 60 }} />
          </View>

          <View style={styles.galleryGrid}>
            {GALLERY_IMAGES.map((img, index) => (
              <TouchableOpacity key={String(index)} style={styles.galleryItem} onPress={() => selectGalleryImage(img)}>
                <Image source={img} style={styles.galleryImage} />
              </TouchableOpacity>
            ))}
          </View>
        </SafeAreaView>
      </Modal>

      {/* Post Options Bottom Sheet */}
      <Modal visible={isOptionsModalVisible} transparent animationType="fade" onRequestClose={closeOptionsModal}>
        <View style={styles.bottomSheetOverlay}>
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Post options</Text>

            <TouchableOpacity
              style={styles.sheetButton}
              onPress={() => {
                if (postForOptions) {
                  openPostDetail(postForOptions.id)
                }
                closeOptionsModal()
              }}
            >
              <Text style={styles.sheetButtonText}>Edit Post</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.sheetButton, styles.sheetButtonDestructive]} onPress={openDeleteConfirm}>
              <Text style={[styles.sheetButtonText, styles.sheetButtonTextDanger]}>Delete Post</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetCancel} onPress={closeOptionsModal}>
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={isDeleteConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDeleteConfirmVisible(false)}
      >
        <View style={styles.centerOverlay}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Delete post?</Text>
            <Text style={styles.confirmText}>
              Are you sure you want to delete this post? This action cannot be undone.
            </Text>

            <View style={styles.confirmButtons}>
              <SecondaryButton
                title="Cancel"
                onPress={() => setIsDeleteConfirmVisible(false)}
                style={styles.confirmButton}
              />
              <PrimaryButton title="Delete" onPress={confirmDeletePost} style={styles.confirmDeleteButton} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Success Modal */}
      <Modal
        visible={isDeleteSuccessVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDeleteSuccessVisible(false)}
      >
        <View style={styles.centerOverlay}>
          <View style={styles.successCard}>
            <View style={styles.successIconCircle}>
              <Text style={styles.successIconText}>✓</Text>
            </View>
            <Text style={styles.successTitle}>Post deleted</Text>
            <PrimaryButton title="Okay" onPress={() => setIsDeleteSuccessVisible(false)} style={styles.successButton} />
          </View>
        </View>
      </Modal>

      {/* Full Post Modal */}
      <Modal visible={isPostDetailVisible && !!selectedPost} animationType="slide" onRequestClose={closePostDetail}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closePostDetail}>
              <Text style={styles.modalCancel}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Post</Text>
            <View style={{ width: 60 }} />
          </View>

          {selectedPost && (
            <ScrollView style={styles.modalBody} contentContainerStyle={{ paddingBottom: vs(40) }}>
              <View style={styles.postCard}>
                <View style={styles.postHeader}>
                  <View style={styles.postHeaderLeft}>
                    <Image source={selectedPost.authorAvatar} style={styles.avatar} />
                    <View>
                      <Text style={styles.authorName}>{selectedPost.authorName}</Text>
                      <Text style={styles.postMeta}>{selectedPost.timeAgo}</Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.postText}>{selectedPost.text}</Text>

                {selectedPost.image && (
                  <Image source={selectedPost.image} style={styles.postImage} resizeMode="cover" />
                )}

                <View style={styles.postFooter}>
                  <TouchableOpacity style={styles.footerButton} onPress={() => handleToggleLike(selectedPost.id)}>
                    <Text style={[styles.footerButtonText, selectedPost.isLiked && styles.footerButtonTextActive]}>
                      ♥ {selectedPost.likes}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.footerButton}>
                    <Text style={styles.footerButtonText}>💬 {selectedPost.comments} comments</Text>
                  </View>
                </View>
              </View>

              {/* Simple static comments area */}
              <View style={styles.commentsSection}>
                <Text style={styles.commentsTitle}>Comments</Text>
                <Text style={styles.emptyCommentsText}>Comments will appear here.</Text>
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}

export default Community
