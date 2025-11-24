import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Container,
  Card,
  CardContent,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

function FeedPage() {
  const { user, logout } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ 나중에 백엔드 /api/posts 연결
  useEffect(() => {
    async function fetchFeed() {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");
        // 아직 /api/posts 구현 안 됐으면 이 부분은 추후 연결용입니다.
        const res = await axios.get("http://localhost:3020/api/posts", {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
          },
        });
        setPosts(res.data.posts || res.data || []);
      } catch (err) {
        console.error("피드 가져오기 실패:", err);
        setError("피드를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    }

    // 백엔드가 아직 준비 안 됐다면, 이 호출은 잠시 주석 처리해도 됨.
    // fetchFeed();
    setLoading(false); // 임시로 로딩 false
  }, []);

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#fafafa" }}>
      {/* 상단 바 */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <HomeIcon />
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              Gamegram
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Typography variant="body2">
              {user ? user.nickname || user.username : ""}
            </Typography>
            <Avatar
              sx={{ width: 32, height: 32 }}
              src={user?.avatarUrl || ""}
            >
              {user?.nickname?.[0] || user?.username?.[0] || "G"}
            </Avatar>
            <IconButton size="small" onClick={handleLogout}>
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* 본문 */}
      <Container
        maxWidth="sm"
        sx={{ mt: 3, pb: 4, display: "flex", flexDirection: "column", gap: 2 }}
      >
        <Typography variant="h6" sx={{ mb: 1 }}>
          피드
        </Typography>

        {loading && <Typography>피드를 불러오는 중...</Typography>}
        {error && (
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        )}

        {/* 아직 posts API 없으면 임시로 빈 카드 하나 노출 */}
        {posts.length === 0 && !loading && !error && (
          <Card>
            <CardContent>
              <Typography variant="body1">
                아직 게시글이 없습니다. 첫 번째 겜짤을 올려보세요!
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* 나중에 posts 맵 돌려서 카드 리스트 출력 */}
        {posts.map((post) => (
          <Card key={post.id}>
            <CardContent>
              <Typography variant="subtitle2">
                {post.username} ・ {post.gameName}
              </Typography>
              <Typography variant="body1">{post.caption}</Typography>
            </CardContent>
          </Card>
        ))}
      </Container>
    </Box>
  );
}

export default FeedPage;
