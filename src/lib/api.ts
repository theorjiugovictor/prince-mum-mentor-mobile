// lib/api.ts
import axios, {
  AxiosInstance,
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig
} from "axios";
import { API_BASE_URL } from "../constants";
import { auth } from "./auth";

// Mutex to prevent multiple simultaneous token refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null): void => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

export const apiAuth = (axiosInstance: AxiosInstance): void => {
  // Request interceptor - Add token to requests
  axiosInstance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const token = await auth.getAccessToken();

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Only set Content-Type for JSON if not already set and not FormData
      if (config.data && !(config.data instanceof FormData)) {
        if (!config.headers["Content-Type"]) {
          config.headers["Content-Type"] = "application/json";
        }
      } else if (config.data instanceof FormData) {
        // Let the browser/axios set the Content-Type with boundary
        delete config.headers["Content-Type"];
      }

      return config;
    },
    (error: unknown) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor - Handle token refresh on 401
  axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => {
      // If response is successful, just return it
      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };

      // Check if error is 401 and we haven't retried yet
      if (error.response?.status === 401 && !originalRequest._retry) {
        // Check if this is the refresh endpoint itself failing
        if (originalRequest.url?.includes("/auth/refresh")) {
          console.error("[API] Refresh token is invalid or expired. Logging out.");
          await auth.logout();
          return Promise.reject(error);
        }

        // If already refreshing, queue this request
        if (isRefreshing) {
          return new Promise<string>((resolve: (value: string) => void, reject: (reason?: unknown) => void) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return axiosInstance(originalRequest);
            })
            .catch((err: unknown) => {
              return Promise.reject(err);
            });
        }

        // Mark that we're attempting a retry
        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // Attempt to refresh the token
          const newAccessToken = await auth.refreshToken();

          // Process any queued requests with the new token
          processQueue(null, newAccessToken);

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          // Token refresh failed - clear queue and logout
          processQueue(refreshError, null);
          console.error("[API] Token refresh failed. Logging out user.");
          await auth.logout();
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      // For non-401 errors, just reject
      return Promise.reject(error);
    }
  );
};

// Public API - no auth required
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Authenticated API - with auth interceptors
export const authApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Apply auth interceptors only to the authenticated instance
apiAuth(authApi);
