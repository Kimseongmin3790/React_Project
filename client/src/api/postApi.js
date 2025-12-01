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
  // { message, post, userStats?, unlockedAchievements? ... }
  return res.data;
}

// 📰 피드 가져오기 (나중에 FeedPage에서 axios 대신 이거 써도 됨)
export async function fetchFeed({
  page = 1,
  limit = 10,
  sort = "latest",
  period = "all",
  gameId,
} = {}) {
  const res = await api.get("/posts", {
    params: { page, limit, sort, period, gameId },
  });
  // 서버에서 배열로 내려주니까 그대로 반환
  return Array.isArray(res.data) ? res.data : [];
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

export async function bookmarkPost(postId) {
  const res = await api.post(`/posts/${postId}/bookmark`);
  return res.data; // { bookmarked: true }
}

export async function unbookmarkPost(postId) {
  const res = await api.delete(`/posts/${postId}/bookmark`);
  return res.data; // { bookmarked: false }
}

export async function fetchComments(postId) {
  const res = await api.get(`/posts/${postId}/comments`);
  return res.data.comments || [];
}

export async function createComment(postId, content) {
  const res = await api.post(`/posts/${postId}/comments`, { content });
  return res.data; // 새로 생성된 댓글 객체
}

export async function fetchPost(postId) {
  const res = await api.get(`/posts/${postId}`);
  return res.data.post; // { id, gameName, media: [...], ... }
}

export async function fetchMyPosts({ page = 1, limit = 10 } = {}) {
  const res = await api.get("/posts/my", { params: { page, limit } });
  return res.data; // { page, limit, posts }
}

export async function fetchMyBookmarkedPosts({ page = 1, limit = 10 } = {}) {
  const res = await api.get("/posts/bookmarks", { params: { page, limit } });
  return res.data; // { page, limit, posts }
}

export async function updatePost(postId, { caption, gameId, images = [], videos = [], replaceMedia = false }) {
  const hasMedia =
    (images && images.length > 0) ||
    (videos && videos.length > 0);
  
  if (hasMedia) {
    const formData = new FormData();
    formData.append("caption", caption);
    formData.append("gameId", gameId);
    formData.append("replaceMedia", replaceMedia ? "true" : "false");

    images.forEach((file) => {
      formData.append("images", file);
    });

    videos.forEach((file) => {
      formData.append("videos", file);
    });

    const res = await api.put(`/posts/${postId}`, formData, { 
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  } else {
    const res = await api.put(`/posts/${postId}`, {
      caption,
      gameId,
    });
    return res.data;
  }
}

export async function deletePost(postId) {
  const res = await api.delete(`/posts/${postId}`);
  return res.data;
}