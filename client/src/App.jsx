import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import FeedPage from "./pages/FeedPage";
import CreatePostPage from "./pages/CreatePostPage";
import PostDetailPage from "./pages/PostDetailPage";
import ChatPage from "./pages/ChatPage";
import ProfileEditPage from "./pages/ProfileEditPage";
import MyPage from "./pages/MyPage";
import GameRankingPage from "./pages/GameRankingPage";
import { AuthProvider, RequireAuth } from "./context/AuthContext";

function App() {
  return (
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/" element={
            <RequireAuth>
              <FeedPage />
            </RequireAuth>
          }
          />

          <Route path="/create" element={
            <RequireAuth>
              <CreatePostPage />
            </RequireAuth>
          }
          />

          <Route path="/posts/:postId" element={
            <RequireAuth>
              <PostDetailPage />
            </RequireAuth>
          }
          />

          <Route path="/chat" element={
            <RequireAuth>
              <ChatPage />
            </RequireAuth>
          }
          />

          <Route path="/me/edit" element={
            <RequireAuth>
              <ProfileEditPage />
            </RequireAuth>
          }
          />

          <Route path="/me" element={
            <RequireAuth>
              <MyPage />
            </RequireAuth>
          }
          />

          <Route path="/ranking" element={
            <RequireAuth>
              <GameRankingPage />
            </RequireAuth>
          }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
  );
}

export default App;
