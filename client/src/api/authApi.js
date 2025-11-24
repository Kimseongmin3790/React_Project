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

// 회원가입
export async function register({ email, password, username, nickname }) {
  const res = await api.post("/auth/register", {
    email,
    password,
    username,
    nickname,
  });
  // res.data = { message, token, user }
  return res.data;
}

// 로그인
export async function login({ email, password }) {
  const res = await api.post("/auth/login", {
    email,
    password,
  });
  // res.data = { message, token, user }
  return res.data;
}

// 내 정보 가져오기 (토큰 필요)
export async function getMe() {
  const res = await api.get("/auth/me");
  // res.data = { user }
  return res.data;
}