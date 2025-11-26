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