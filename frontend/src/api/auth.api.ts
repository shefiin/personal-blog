import { http } from "./http";

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterResponse = {
  message: string;
  verifyToken: string;
};

export type AuthSuccessResponse = {
  message: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
};

export const registerUser = (data: RegisterPayload) => {
  return http.post<RegisterResponse>("/api/auth/register", data);
};

export const verifyRegisterOtp = (otp: string, verifyToken: string) => {
  return http.post<AuthSuccessResponse>(
    "/api/auth/verify-otp",
    { otp },
    {
      headers: {
        Authorization: `Bearer ${verifyToken}`
      }
    }
  );
};

export const resendRegisterOtp = (verifyToken: string) => {
  return http.post<{ message: string }>(
    "/api/auth/resend-otp",
    {},
    {
      headers: {
        Authorization: `Bearer ${verifyToken}`
      }
    }
  );
};

export const loginUser = (data: LoginPayload) => {
  return http.post<AuthSuccessResponse>("/api/auth/login", data);
};
    
