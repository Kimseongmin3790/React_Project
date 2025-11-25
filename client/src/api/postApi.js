import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3020/api",
  withCredentials: false,
});

// 토큰 자동 첨부
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 📝 게시글 작성
export async function createPost({ gameId, caption, images = [], videos = [] }) {
  const formData = new FormData();
  formData.append("gameId", gameId);
  formData.append("caption", caption || "");

  images.forEach((file)=>{
    formData.append("images", file);
  });

  videos.forEach((file)=>{
    formData.append("videos", file);
  });

  const res = await api.post("/posts", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  // { message, post }
  return res.data;
}

// 📰 피드 가져오기 (나중에 FeedPage에서 axios 대신 이거 써도 됨)
export async function fetchFeed({ page = 1, limit = 10, gameId } = {}) {
  const params = { page, limit };
  if (gameId) params.gameId = gameId;

  const res = await api.get("/posts", { params });

  // { page, limit, posts: [...] }
  return res.data;
}

// 게임 목록 가져오기
export async function fetchGameList() {
    const res = await api.get("/games");
    
    return res.data.games || [];
}

export async function likePost(postId) {
  const res = await api.post(`/posts/${postId}/like`);
  return res.data; // { liked: true, likeCount }
}

export async function unlikePost(postId) {
  const res = await api.delete(`/posts/${postId}/like`);
  return res.data; // { liked: false, likeCount }
}
