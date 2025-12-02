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

// 타켓 태그 포함한 피드 가져오기
export async function fetchTagFeed(tagName, params = {}) {
  const res = await api.get(`/tags/${encodeURIComponent(tagName)}/posts`, {
    params,
  });
  return res.data;
}
