import http from "./http";

export const driverApi = {
  getList: (params) => http.get("/drivers", { params }),
  getById: (id) => http.get(`/drivers/${id}`),
  create: (data) => http.post("/drivers", data),
  update: (id, data) => http.put(`/drivers/${id}`, data),
  delete: (id) => http.delete(`/drivers/${id}`),
};
