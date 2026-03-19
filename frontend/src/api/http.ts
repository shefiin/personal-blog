import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";

export const http = axios.create({
  baseURL:         import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

// Dedicated client for refresh — bypasses the response interceptor
// to prevent an infinite retry loop.
const refreshClient = axios.create({
  baseURL:         import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

interface RetryRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

let isRefreshing = false;

// ✅ FIX: Queue stores thunks so each pending request retries itself
//    independently once the refresh resolves, rather than receiving
//    a shared (possibly undefined) response.
let pendingQueue: Array<{
  resolve: () => void;
  reject:  (error: unknown) => void;
}> = [];

const flushQueue = (error?: unknown) => {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else       resolve();
  });
  pendingQueue = [];
};

http.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    if (!error.config) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as RetryRequestConfig;
    const status          = error.response?.status;
    const requestUrl      = originalRequest.url ?? "";

    // ✅ FIX: Exclude all auth endpoints to prevent infinite loops
    const isAuthEndpoint = [
      "/api/auth/login",
      "/api/auth/refresh",
      "/api/auth/session",
      "/api/auth/logout",
      "/api/auth/register",
      "/api/auth/verify-otp",
      "/api/auth/resend-otp",
    ].some((path) => requestUrl.includes(path));

    if (status !== 401 || isAuthEndpoint || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // If a refresh is already in flight, queue this request.
    // Each queued request retries itself via http(originalRequest)
    // once the flush signals success.
    if (isRefreshing) {
      return new Promise<AxiosResponse>((resolve, reject) => {
        pendingQueue.push({
          resolve: () => resolve(http(originalRequest)),
          reject,
        });
      });
    }

    isRefreshing = true;

    try {
      await refreshClient.post("/api/auth/refresh");
      flushQueue();                    // signal all queued requests to retry
      return http(originalRequest);   // retry the original request
    } catch (refreshError) {
      flushQueue(refreshError);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
