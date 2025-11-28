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

// q: 닉네임 / username 검색어
export async function searchUsers(q) {
  const res = await api.get("/users/search", {
    params: { q },
  });
  return res.data.users || [];
}

// 프로필(닉네임, bio) 수정
export async function updateProfile(data) {
  const res = await api.patch("/users/me", data);
  return res.data.user;
}

// 비밀번호 수정
export async function verifyPassword(password) {
  const res = await api.post("/users/verify-password", { password });
  return res.data; // { ok: true } or { ok: false, message }
}

// 아바타 업로드
export async function uploadAvatar(file) {
  const formData = new FormData();
  formData.append("avatar", file);

  const res = await api.post("/users/me/avatar", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data.user;
}

export async function fetchMyPosts() {
  const res = await api.get("/users/me/posts");
  return res.data.posts || [];
}

export async function fetchMyLikedPosts() {
  const res = await api.get("/users/me/likes");
  return res.data.posts || [];
}

export async function fetchMyBookmarkedPosts() {
  const res = await api.get("/users/me/bookmarks");
  return res.data.posts || [];
}

// 특정 유저 프로필 정보 가져오기
export async function fetchUserProfile(userId) {
  const res = await api.get(`/users/${userId}`);
  return res.data; // { id, username, nickname, avatarUrl, bio, ... } 형태 기대
}

// 특정 유저가 작성한 게시글 목록 가져오기
export async function fetchUserPosts(userId, { page = 1, limit = 12 } = {}) {
  const res = await api.get(`/posts/users/${userId}`, {
    params: { page, limit },
  });
  return res.data;
}

export async function blockUser(targetUserId) {
  const res = await api.post(`/users/${targetUserId}/block`);
  return res.data;
}

export async function unblockUser(targetUserId) {
  const res = await api.delete(`/users/${targetUserId}/block`);
  return res.data;
}

// 신고
export async function reportUser(targetUserId, reason) {
  const res = await api.post("/users/reports", { targetUserId, reason });
  return res.data;
}

export async function reportPost(postId, reason) {
  const res = await api.post("/users/reports", { targetPostId: postId, reason });
  return res.data;
}

// 내 레벨/업적 조회
export async function fetchMyStats() {
  const res = await api.get("/users/me/stats");
  return res.data; // { stats: {...}, achievements: [...] }
}