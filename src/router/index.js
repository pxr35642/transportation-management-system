import { createRouter, createWebHistory } from "vue-router";

const routes = [
  // 登入頁面不需要版型
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/LoginView.vue"),
    meta: { title: "登入", public: true },
  },

  { path: "/", redirect: "/dashboard" },
  {
    path: "/dashboard",
    name: "Dashboard",
    component: () => import("@/views/DashboardView.vue"),
    meta: { title: "儀表板" },
  },
  {
    path: "/orders",
    name: "Orders",
    component: () => import("@/views/OrderView.vue"),
    meta: { title: "訂單管理" },
  },
  {
    path: "/vehicles",
    name: "Vehicles",
    component: () => import("@/views/VehicleView.vue"),
    meta: { title: "車輛管理" },
  },
  {
    path: "/drivers",
    name: "Drivers",
    component: () => import("@/views/DriverView.vue"),
    meta: { title: "司機管理" },
  },
  {
    path: "/routes",
    name: "Routes",
    component: () => import("@/views/RouteView.vue"),
    meta: { title: "路線規劃" },
  },
  {
    path: "/tracking",
    name: "Tracking",
    component: () => import("@/views/TrackingView.vue"),
    meta: { title: "即時追蹤" },
  },
  {
    path: "/reports",
    name: "Reports",
    component: () => import("@/views/ReportView.vue"),
    meta: { title: "報表統計" },
  },
  {
    path: "/customers",
    name: "Customers",
    component: () => import("@/views/CustomerView.vue"),
    meta: { title: "客戶管理" },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  document.title = `${to.meta.title} | 運輸管理系統`;

  const token = localStorage.getItem("token");

  // 未登入且不是公開頁面，跳到登入頁
  if (!to.meta.public && !token) {
    return { name: "Login" };
  }

  // 已登入還去登入頁，跳到儀表板
  if (to.name === "Login" && token) {
    return { name: "Dashboard" };
  }
});

export default router;
