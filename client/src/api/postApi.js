import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3020/api",
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 피드 작성
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
  return res.data;
}

// 피드 목록 가져오기
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
  return Array.isArray(res.data) ? res.data : [];
}

// 게임 목록 가져오기
export async function fetchGameList() {
    const res = await api.get("/games");
    
    return res.data.games || [];
}

// 피드 좋아요
export async function likePost(postId) {
  const res = await api.post(`/posts/${postId}/like`);
  return res.data;
}

// 피드 좋아요 해제
export async function unlikePost(postId) {
  const res = await api.delete(`/posts/${postId}/like`);
  return res.data;
}

// 피드 북마크
export async function bookmarkPost(postId) {
  const res = await api.post(`/posts/${postId}/bookmark`);
  return res.data;
}

// 피드 북마크 해제
export async function unbookmarkPost(postId) {
  const res = await api.delete(`/posts/${postId}/bookmark`);
  return res.data;
}

// 댓글 목록 가져오기
export async function fetchComments(postId) {
  const res = await api.get(`/posts/${postId}/comments`);
  return res.data.comments || [];
}

// 댓글 작성
export async function createComment(postId, content, parentCommentId = null) {
  const body = { content };
  if (parentCommentId) {
    body.parentCommentId = parentCommentId;
  }
  
  const res = await api.post(`/posts/${postId}/comments`, body);
  return res.data;
}

// 타겟 피드 가져오기
export async function fetchPost(postId) {
  const res = await api.get(`/posts/${postId}`);
  return res.data.post;
}

// 피드 수정
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

// 피드 삭제
export async function deletePost(postId) {
  const res = await api.delete(`/posts/${postId}`);
  return res.data;
}

// 댓글 좋아요
export async function likeComment(commentId) {
  const res = await api.post(`/posts/comments/${commentId}/like`);
  return res.data;
}

// 댓글 좋아요 해제
export async function unlikeComment(commentId) {
  const res = await api.delete(`/posts/comments/${commentId}/like`);
  return res.data;
}

// 댓글 수정
export async function updateCommentApi(commentId, content) {
  const res = await api.put(`/posts/comments/${commentId}`, { content });
  return res.data.comment;
}

// 댓글 삭제
export async function deleteCommentApi(commentId) {
  const res = await api.delete(`/posts/comments/${commentId}`);
  return res.data;
}