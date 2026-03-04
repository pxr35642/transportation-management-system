import http from "./http";

export const authApi = {
  // 登入
  login: (data) => http.post("/auth/login", data),
};
