// Add this to your auth hooks file (e.g., useAuth.ts or hooks/useAuth.ts)

import { authApi } from "@/src/lib/api";
import { auth } from "@/src/lib/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation } from "@tanstack/react-query";

interface DeleteAccountParams {
  confirmation_phrase: string;
  password: string;
}

interface DeleteAccountResponse {
  message: string;
  success: boolean;
}

export const useDeleteAccount = () => {
  return useMutation<DeleteAccountResponse, Error, DeleteAccountParams>({
    mutationFn: deleteAccount,
    onSuccess: async () => {
      // Clear all stored data
      await AsyncStorage.multiRemove([
        "authToken",
        "refreshToken",
        "userId",
        "userEmail",
        // Add any other keys you store
      ]);
      await auth.clearTokens();
    },
    onError: (error) => {
      console.error("Error deleting account:", error);
    },
  });
};

export async function deleteAccount({
  confirmation_phrase,
  password,
}: DeleteAccountParams) {
  try {
    const response = await authApi.delete("/api/v1/auth/delete", {
      data: {
        confirmation_phrase,
        password,
      },
    });
    if (response.status === 200) {
      return response.data.data || response.data;
    }
    throw new Error("Failed to delete account");
  } catch (error) {
    console.error("Error deleting account:", error);
    throw error;
  }
}
