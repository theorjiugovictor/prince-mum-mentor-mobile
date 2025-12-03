import { useAuthCrud } from "./useCrud";

export const useGetUserProfile = () => {
  return useAuthCrud<
    any,
    {
      id: string;
      user_id: string;
      email: string;
      full_name: string;
      is_active: boolean;
      email_verified: boolean;
      google_id: string | null;
      role: string;
    }
  >("/api/v1/profile/", {
    queryKey: "user-profile",
    enabled: true,
  });
};
