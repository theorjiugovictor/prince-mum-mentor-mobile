import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { commentOnPost, createCommunityPost, fetchAllCommunityPosts, fetchSinglePost, togglePostLike } from "../services/communityService";

export const useCommentOnPost = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ postId, comment }: { postId: string; comment: string }) => commentOnPost(postId, comment),
    onSuccess: () => {
      // Invalidate and refetch posts data
      queryClient.invalidateQueries({ queryKey: ["communityPosts"] })
    },
    onError: (error) => {
      console.error("[v0] Comment post error:", error)
    },
  })
}

export const useCommunityPosts = (page = 1, perPage = 20) => {
  return useQuery({
    queryKey: ["communityPosts", page, perPage],
    queryFn: async () => {
      const response = await fetchAllCommunityPosts(page, perPage)
      return response
    },
    staleTime: 30000, // 30 seconds
    retry: 2,
  })
}



export const useCreatePost = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createCommunityPost,
    onSuccess: () => {
      // Invalidate and refetch posts data
      queryClient.invalidateQueries({ queryKey: ["communityPosts"] })
    },
    onError: (error) => {
      console.error("[v0] Create post error:", error)
    },
  })
}

export const useSinglePost = (postId: string | null) => {
  return useQuery({
    queryKey: ["post", postId],
    queryFn: () => fetchSinglePost(postId!),
    enabled: !!postId, // Only fetch when postId is available
    staleTime: 60000, // 60 seconds
  })
}

export const useToggleLike = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: togglePostLike,
    onSuccess: () => {
      // Invalidate and refetch posts data
      queryClient.invalidateQueries({ queryKey: ["communityPosts"] })
    },
    onError: (error) => {
      console.error("[v0] Toggle like error:", error)
    },
  })
}
