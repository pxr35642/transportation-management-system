import axios from "axios";
import { ElMessage } from "element-plus";
import router from "@/router";

// 建立 axios 實例
const http = axios.create({
  baseURL: "http://localhost:5107/api",
  timeout: 10000,
});

// 請求攔截器：每次請求自動帶入 JWT Token
http.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// 回應攔截器：統一處理錯誤
http.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || "系統發生錯誤";

    if (status === 401) {
      // Token 過期或無效，清除登入狀態並跳回登入頁
      localStorage.removeItem("token");
      localStorage.removeItem("userInfo");
      router.push("/login");
      ElMessage.error("登入已過期，請重新登入");
    } else {
      ElMessage.error(message);
    }

    return Promise.reject(error);
  },
);

export default http;
