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

// 타겟 유저 팔로우
export async function followUser(targetUserId) {
  const res = await api.post(`/users/${targetUserId}/follow`);
  return res.data;
}

// 타겟 유저 언팔로우
export async function unfollowUser(targetUserId) {
  const res = await api.delete(`/users/${targetUserId}/follow`);
  return res.data;
}

// 내 팔로우/팔로워 수 가져오기
export async function getFollowStats() {
  const res = await api.get("/users/me/follow-stats");
  return res.data;
}

// 타겟 유저와의 팔로우/팔로잉 여부
export async function getUserRelation(targetUserId) {
  const res = await api.get(`/users/${targetUserId}/relation`);
  return res.data;
}

// 내가 팔로워하는 사람 목록 가져오기
export async function fetchFollowingList(userId) {  
  const res = await api.get(`/users/${userId}/following`);
  return res.data;
}

// 나를 팔로우 하는 사람 목록 가져오기
export async function fetchFollowerList(userId) {
  const res = await api.get(`/users/${userId}/followers`);
  return res.data;
}
