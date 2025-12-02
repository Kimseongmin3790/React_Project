import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:3020/api",
    withCredentials: false,
});

api.interceptors.request.use((config)=>{
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
})

// 탐색 데이터 가져오기
export async function fetchExploreSummary(params = {}) {
  const res = await api.get("/explore/summary", { params });
  return res.data;
}