import { authApi } from "@/src/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useDeleteAlbum = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      // Invalidate and refetch albums
      queryClient.invalidateQueries({ queryKey: ["album-items"] });
    },
    onError: (error) => {
      console.error("Error deleting post:", error);
    },
  });
};

export async function deletePost({ album_id }: { album_id: string }) {
  try {
    const response = await authApi.delete(`/api/v1/album/${album_id}`);
    if (response.status === 200) {
      return response.data.data || response.data;
    }
    throw new Error("Failed to delete post");
  } catch (error) {
    console.error("Error deleting post:", error);
    throw error;
  }
}
