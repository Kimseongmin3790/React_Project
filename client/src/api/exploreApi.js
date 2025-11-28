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

// GET /api/explore/summary
export async function fetchExploreSummary(params = {}) {
  const res = await api.get("/explore/summary", { params });
  return res.data; // { popularTags, trendingGames, randomPosts }
}