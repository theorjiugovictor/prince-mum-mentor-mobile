// lib/api.ts
import axios, { AxiosInstance } from "axios";
import { API_BASE_URL } from "../constants";
import { auth } from "./auth";

export const apiAuth = (axiosInstance: AxiosInstance) => {
  let isRefreshing = false;
  let refreshQueue: ((token: string) => void)[] = [];

  // ✅ Request interceptor (only once)
  axiosInstance.interceptors.request.use(async (config) => {
    const token = await auth.getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.data && !(config.data instanceof FormData)) {
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  });

  // ✅ Response interceptor (handles 401 refresh)
  axiosInstance.interceptors.response.use(
    (response) => response,

    async (error) => {
      const originalRequest = error.config;

      // If unauthorized and not retried yet
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        // Prevent multiple refresh calls
        if (!isRefreshing) {
          isRefreshing = true;
          try {
            const newToken = await auth.refreshToken();

            // Process queued requests
            refreshQueue.forEach((cb) => cb(newToken));
            refreshQueue = [];

            isRefreshing = false;

            return axiosInstance(originalRequest);
          } catch (err) {
            isRefreshing = false;
            refreshQueue = [];
            throw err;
          }
        }

        // Queue other requests until token refresh completes
        return new Promise((resolve) => {
          refreshQueue.push((newToken: string) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(axiosInstance(originalRequest));
          });
        });
      }

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
