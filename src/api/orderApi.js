import http from "./http";

export const orderApi = {
  // 取得列表（支援分頁、關鍵字、狀態篩選）
  getList: (params) => http.get("/orders", { params }),
  getById: (id) => http.get(`/orders/${id}`),
  create: (data) => http.post("/orders", data),
  update: (id, data) => http.put(`/orders/${id}`, data),
  delete: (id) => http.delete(`/orders/${id}`),
};
