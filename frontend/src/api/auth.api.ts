import { http } from "./http";

export type LoginPayload = {
  email:    string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

export type AuthSuccessResponse = {
  message: string;
  role?: "admin" | "user";
};

export type RegisterResponse = {
  message: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    isEmailVerified: boolean;
  };
  otpExpiresInSeconds: number;
  resendAvailableInSeconds: number;
};

export type SessionResponse = {
  loggedIn: boolean;
  admin?: {
    id:    string;
    email: string;
    role:  string;
  };
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    isEmailVerified: boolean;
    createdAt: string;
  };
};

export const loginUser = (data: LoginPayload) => {
  return http.post<AuthSuccessResponse>("/api/auth/login", data);
};

export const registerUser = (data: RegisterPayload) => {
  return http.post<RegisterResponse>("/api/auth/register", data);
};

export const verifyUserOtp = (data: { email: string; otp: string }) => {
  return http.post<{ message: string }>("/api/auth/verify-otp", data);
};

export const resendUserOtp = (data: { email: string }) => {
  return http.post<{ message: string; resendAvailableInSeconds: number }>("/api/auth/resend-otp", data);
};

// ✅ FIX: Changed from POST to GET.
//    sessionCheck reads only cookies — it has no request body,
//    so POST was semantically wrong and caused the interceptor
//    to retry it through the token-refresh flow, creating a loop.
export const getSession = () => {
  return http.get<SessionResponse>("/api/auth/session");
};

export const logoutAuth = () => {
  return http.post<{ message: string }>("/api/auth/logout");
};

export const getGoogleAuthUrl = (redirectTo: string) => {
  const apiBase = import.meta.env.VITE_API_BASE_URL || "";
  const frontendBase = window.location.origin;
  const target = redirectTo.startsWith("http") ? redirectTo : `${frontendBase}${redirectTo.startsWith("/") ? redirectTo : `/${redirectTo}`}`;
  return `${apiBase}/api/auth/google?redirect=${encodeURIComponent(target)}`;
};
