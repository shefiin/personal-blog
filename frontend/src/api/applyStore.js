import { http } from "./http";

export const applyStore = (data) => {
    return http.post("/api/store/apply", data)
};