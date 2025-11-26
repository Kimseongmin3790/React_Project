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

// targetUserId: 숫자 (팔로우/언팔 대상)
export async function followUser(targetUserId) {
  const res = await api.post(`/users/${targetUserId}/follow`);
  return res.data;
}

export async function unfollowUser(targetUserId) {
  const res = await api.delete(`/users/${targetUserId}/follow`);
  return res.data;
}

export async function getFollowStats() {
  const res = await api.get("/users/me/follow-stats");
  return res.data; // { followerCount, followingCount }
}

export async function getUserRelation(targetUserId) {
  const res = await api.get(`/users/${targetUserId}/relation`);
  return res.data; // { isMe, isFollowing, isFollower }
}
