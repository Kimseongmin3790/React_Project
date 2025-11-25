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

export async function fetchUnreadSummary() {
  const res = await api.get("/chat/unread");
  const map = {};
  (res.data.rooms || []).forEach((r) => {
    map[r.roomId] = r.unreadCount;
  });
  return map; // { [roomId]: count }
}