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

export async function getNotificationSummary() {
  const res = await api.get("/notifications/summary");
  return res.data;
}

export async function markAllNotificationsRead() {
  const res = await api.post("/notifications/read-all");
  return res.data;
}
