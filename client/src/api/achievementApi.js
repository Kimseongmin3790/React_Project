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

// 모든 업적 목록 가져오기
export async function fetchAchievements() {
  const res = await api.get("/achievements");
  return res.data.achievements || [];
}