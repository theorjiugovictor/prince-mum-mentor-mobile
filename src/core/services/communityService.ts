import { authApi } from "@/src/lib/api"

const prefix = "/api/v1/community/posts"

// ============================================================
// COMMUNITY SERVICE
// ============================================================

/**
 * Fetch all posts by a user
 */
export async function fetchUserPosts(userId: string) {
  try {
    const response = await authApi.get(`${prefix}/${userId}`)
    if (response.status >= 200 && response.status < 300) {
      return response.data.data || response.data
    }
    throw new Error("Failed to fetch posts")
  } catch (error) {
    console.error("Error fetching posts:", error)
    throw error
  }
}

/**
 * Fetch all community posts
 */
export async function fetchAllCommunityPosts(page = 1, perPage = 20) {
  try {
    const response = await authApi.get(prefix, {
      params: {
        page,
        per_page: perPage,
      },
    })
    if (response.status >= 200 && response.status < 300) {
      return response.data.data || response.data
    }
    throw new Error("Failed to fetch posts")
  } catch (error) {
    console.error("Error fetching posts:", error)
    throw error
  }
}

/**
 * Get a single post by ID (increases view count)
 * GET /api/v1/community/posts/{post_id}
 */
export async function fetchSinglePost(postId: string) {
  try {
    const response = await authApi.get(`${prefix}/${postId}`)
    if (response.status === 200) {
      return response.data.data || response.data
    }
    throw new Error("Failed to fetch post")
  } catch (error) {
    console.error("Error fetching post:", error)
    throw error
  }
}

/**
 * Toggle like/unlike a post
 * POST /api/v1/community/posts/{post_id}/like
 */
export async function togglePostLike(postId: string) {
  try {
    const response = await authApi.post(`${prefix}/${postId}/like`)
    if (response.status === 200) {
      return response.data.data || response.data
    }
    throw new Error("Failed to toggle like")
  } catch (error) {
    console.error("Error toggling like:", error)
    throw error
  }
}

/**
 * Create a community post using existing photo IDs
 * POST /api/v1/community/posts
 */
export async function createCommunityPost(payload: {
  title: string
  content: string
  photo_ids?: string[]
}) {
  try {
    const response = await authApi.post(prefix, payload)
    if (response.status === 201) {
      return response.data.data || response.data
    }
    throw new Error("Failed to create post")
  } catch (error) {
    console.error("Error creating post:", error)
    throw error
  }
}

/**
 * Create a community post with file uploads (multipart/form-data)
 * POST /api/v1/community/posts/upload
 */
export async function createPostWithUploads(formData: FormData) {
  try {
    const response = await authApi.post(`${prefix}/upload`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    if (response.status === 201) {
      return response.data.data || response.data
    }
    throw new Error("Failed to upload post")
  } catch (error) {
    console.error("Error uploading post:", error)
    throw error
  }
}

/**
 * Comment on a post
 * POST /api/v1/community/posts/{post_id}/comment
 */
export async function commentOnPost(postId: string, comment: string) {
  try {
    const response = await authApi.post(`${prefix}/${postId}/comment`, {
      comment,
    })
    if (response.status === 201) {
      return response.data.data || response.data
    }
    throw new Error("Failed to add comment")
  } catch (error) {
    console.error("Error commenting on post:", error)
    throw error
  }
}
