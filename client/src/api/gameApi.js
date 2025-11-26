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

export async function fetchGameRanking(rangeDays = 7) {
  const params = {};
  if (rangeDays) {
    params.rangeDays = rangeDays;
  }
  const res = await api.get("/games/ranking", { params });
  return res.data.games || [];
}