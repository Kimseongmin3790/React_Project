import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3020/api",
  withCredentials: false,
});

// 토큰 자동 첨부
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function fetchPostsByTag(tagName) {
  const res = await api.get(`/tags/${encodeURIComponent(tagName)}/posts`);
  return res.data;
}

export async function fetchTrendingTags() {
  const res = await api.get("/tags/trending/list");
  return res.data;
}