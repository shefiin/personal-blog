import { http } from "./http";

export const registerUser = (data) => {
    return http.post("/api/auth/register", data)
};

export const loginUser = (data) => {
    return http.post("/api/auth/login", data)
};
    