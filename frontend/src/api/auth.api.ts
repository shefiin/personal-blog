import { http } from "./http";

export type LoginPayload = {
  email:    string;
  password: string;
};

export type AuthSuccessResponse = {
  message: string;
  user?: {
    id:    string;
    name:  string;
    email: string;
    role:  string;
  };
};

export type AdminSessionResponse = {
  loggedIn: boolean;
  admin?: {
    id:    string;
    email: string;
    role:  string;
  };
};

export const loginUser = (data: LoginPayload) => {
  return http.post<AuthSuccessResponse>("/api/admin/auth/login", data);
};

// ✅ FIX: Changed from POST to GET.
//    sessionCheck reads only cookies — it has no request body,
//    so POST was semantically wrong and caused the interceptor
//    to retry it through the token-refresh flow, creating a loop.
export const getAdminSession = () => {
  return http.get<AdminSessionResponse>("/api/admin/auth/session");
};

export const logoutAdmin = () => {
  return http.post<{ message: string }>("/api/admin/auth/logout");
};