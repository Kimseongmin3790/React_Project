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

// 안읽은 채팅 목록 가져오기
export async function fetchUnreadSummary() {
  const res = await api.get("/chat/unread");
  const map = {};
  (res.data.rooms || []).forEach((r) => {
    map[r.roomId] = r.unreadCount;
  });
  return map;
}

// 새 채팅 알림 클릭 시 해당 채팅방 정보 조회
export async function fetchFindChatRoomById(initialRoomId) {
  const res = await api.get(`/chat/rooms/${initialRoomId}/meta`);
  return res.data;
}