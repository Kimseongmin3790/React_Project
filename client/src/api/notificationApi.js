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

// 로그인한 유저가 읽지 않은 알림 가져오기
export async function getNotificationSummary() {
  const res = await api.get("/notifications/summary");
  return res.data;
}

// 알림 클릭 시 모두 읽음 처리
export async function markAllNotificationsRead() {
  const res = await api.post("/notifications/read-all");
  return res.data;
}
