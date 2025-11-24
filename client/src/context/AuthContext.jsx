import React, { createContext, useContext, useEffect, useState } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { getMe } from "../api/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initialized, setInitialized] = useState(false); // 앱 시작 시 체크 끝났는지

  useEffect(() => {
    async function init() {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          // 토큰 없으면 비로그인 상태로 초기화
          setUser(null);
          setInitialized(true);
          return;
        }
        // 토큰 있으면 서버에 확인
        const res = await getMe(); // { user: {...} }
        setUser(res.user);
      } catch (err) {
        const status = err.response?.status;

        if(status !== 401) {
            console.error("getMe() 실패:", err);
        }
        
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
      } finally {
        setInitialized(true);
      }
    }
    init();
  }, []);

  const login = (token, user) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, initialized, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth는 AuthProvider 안에서만 사용해야 합니다.");
  }
  return ctx;
}

// ✅ 보호 라우트용 컴포넌트
export function RequireAuth({ children }) {
  const { user, initialized } = useAuth();
  const location = useLocation();

  // 아직 getMe 체크 중이면 로딩 화면
  if (!initialized) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        로그인 상태 확인 중...
      </div>
    );
  }

  // 로그인 안 되어 있으면 /login으로
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname || "/" }}
      />
    );
  }

  // 통과
  return children;
}
