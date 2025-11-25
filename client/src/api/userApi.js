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