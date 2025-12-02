import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3020/api",
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 내 레벨, 업적 가져오기
export async function fetchMyStats() {
  const res = await api.get("/users/me/stats");
  return res.data;
}