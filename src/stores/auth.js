import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { authApi } from "@/api/authApi";
import router from "@/router";

export const useAuthStore = defineStore("auth", () => {
  // 從 localStorage 還原登入狀態（重整頁面後不會登出）
  const token = ref(localStorage.getItem("token") || "");
  const userInfo = ref(JSON.parse(localStorage.getItem("userInfo") || "null"));

  // 是否已登入
  const isLoggedIn = computed(() => !!token.value);

  // 登入
  const login = async (username, password) => {
    const res = await authApi.login({ username, password });

    // 儲存 Token 和使用者資訊
    token.value = res.token;
    userInfo.value = { fullName: res.fullName, role: res.role };

    localStorage.setItem("token", res.token);
    localStorage.setItem("userInfo", JSON.stringify(userInfo.value));

    router.push("/dashboard");
  };

  // 登出
  const logout = () => {
    token.value = "";
    userInfo.value = null;
    localStorage.removeItem("token");
    localStorage.removeItem("userInfo");
    router.push("/login");
  };

  return { token, userInfo, isLoggedIn, login, logout };
});
