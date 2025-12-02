// hooks/useImageUpload.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { authApi } from "../../lib/api";
import { showToast } from "../utils/toast";

interface UploadedImage {
  id: string;
  image_url: string;
  filename: string;
  size: number;
  mimetype: string;
  createdAt: string;
}

interface ApiResponse<T> {
  data: T;
  message?: string;
  status?: number;
}

interface UploadOptions {
  onSuccess?: (data: UploadedImage) => void;
  onError?: (error: Error) => void;
  invalidateQueries?: string[];
}

export const useImageUpload = (options?: UploadOptions) => {
  const queryClient = useQueryClient();

  const fallbackErrorMessage = "Image upload failed. Please try again.";

  const upload = useMutation<
    ApiResponse<UploadedImage>,
    Error,
    ImagePicker.ImagePickerAsset
  >({
    mutationFn: async (image: ImagePicker.ImagePickerAsset) => {
      // Convert URI → Blob
      const fileResponse = await fetch(image.uri);
      const blob = await fileResponse.blob();

      // Build multipart form
      const formData = new FormData();
      formData.append(
        "file",
        blob,
        image.fileName || `photo_${Date.now()}.jpg`
      );

      const res = await authApi.post("/api/v1/images/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return res.data;
    },
    onSuccess: (response) => {
      // Invalidate any specified queries
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: [key] });
        });
      }

      if (options?.onSuccess) {
        options.onSuccess(response.data);
      }
    },
    onError: (error) => {
      // 1. Display the error to the user
      const errorMessage = error.message || fallbackErrorMessage;
      showToast.error(errorMessage, "error");

      // 2. Call custom onError callback
      if (options?.onError) {
        options.onError(error);
      }
    },
  });

  /**
   * Pick an image from the gallery and upload it
   */
  const pickAndUpload = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        throw new Error("Permission to access gallery is required!");
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets[0]) {
        // --- FIX 1: Use upload.mutate instead of upload.mutateAsync ---
        upload.mutateAsync(result.assets[0]);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      showToast.error(
        error instanceof Error ? error.message : fallbackErrorMessage,
        "error"
      );
    }
  };

  /**
   * Take a photo with camera and upload it
   */
  const takePhotoAndUpload = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionResult.granted) {
        throw new Error("Permission to access camera is required!");
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets[0]) {
        upload.mutate(result.assets[0]);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      showToast.error(
        error instanceof Error ? error.message : fallbackErrorMessage,
        "error"
      );
    }
  };

  /**
   * Upload an already selected image
   */
  const uploadImage = (image: ImagePicker.ImagePickerAsset) => {
    return upload.mutateAsync(image);
  };

  return {
    upload: uploadImage,
    pickAndUpload,
    takePhotoAndUpload,
    isUploading: upload.isPending,
    isError: upload.isError,
    isSuccess: upload.isSuccess,
    error: upload.error,
    data: upload.data,
    reset: upload.reset,
  };
};
