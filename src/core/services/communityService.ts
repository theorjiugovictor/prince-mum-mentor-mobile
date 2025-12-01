// src/core/services/galleryService.ts

import { authApi } from "@/src/lib/api";

const prefix = "/api/v1/community/posts";

// ========== COMMUNITY ENDPOINTS ==========

/**
 * Fetch all posts by user
 */
export async function fetchUserPosts(userId: string){
  try {
      const response = await authApi.get(`${prefix}/${userId}`);

    if (response.status >= 200 && response.status < 300) {
      return response.data.data || response.data;
    } else {
      throw new Error("Failed to fetch posts");
    }
  } catch (error) {
    console.error("Error fetching posts:", error);
    throw error;
  }
}

/**
 * Create  posts by user
 */
export async function createCommunityPost(){
  try {
      const response = await authApi.get(`${prefix}`, {
        
      });

    if (response.status >= 200 && response.status < 300) {
      return response.data.data || response.data;
    } else {
      throw new Error("Failed to create post");
    }
  } catch (error) {
    console.error("Error creating post:", error);
    throw error;
  }
}

