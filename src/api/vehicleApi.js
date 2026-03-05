import http from "./http";

export const vehicleApi = {
  getList: (params) => http.get("/vehicles", { params }),
  getById: (id) => http.get(`/vehicles/${id}`),
  create: (data) => http.post("/vehicles", data),
  update: (id, data) => http.put(`/vehicles/${id}`, data),
  delete: (id) => http.delete(`/vehicles/${id}`),
};
