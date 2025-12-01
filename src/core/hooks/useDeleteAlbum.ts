import { useAuthCrud } from "./useCrud";

export const useDeleteAlbum = ({ album_id }: { album_id: string }) => {
  return useAuthCrud(`/api/v1/album/${album_id}`, {
    queryKey: "album-items",
    enabled: false,
  });
};
