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
  CardMedia,
  TextField,
  MenuItem
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import LogoutIcon from "@mui/icons-material/Logout";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { fetchFeed, fetchGameList, likePost, unlikePost } from "../api/postApi";

function FeedPage() {
  const { user, logout } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [gameList, setGameList] = useState([]);
  const [selectedGameId, setSelectedGameId] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    async function loadGames() {
      try {
        const games = await fetchGameList();
        setGameList(games);
      } catch (err) {
        console.error("게임 목록 불러오기 실패:", err);
      }
    }
    loadGames();
  }, []);

  // 피드 로딩
  useEffect(() => {
    async function loadFeed() {
      try {
        setLoading(true);
        setError("");

        const res = await fetchFeed({
          page: 1,
          limit: 10,
          gameId: selectedGameId || undefined,
        });

        setPosts(res.posts || []);
      } catch (err) {
        console.error("피드 가져오기 실패:", err);
        setError("피드를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    }
    loadFeed();
  }, [selectedGameId]);

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  const goCreate = () => {
    navigate("/create");
  };

  const API_ORIGIN = "http://localhost:3020";

  function getMediaUrl(url) {
    if (!url) return "";
    // 이미 절대 주소면 그대로 사용
    if (url.startsWith("http")) return url;
    // /uploads/로 시작하면 백엔드 origin 붙이기
    return `${API_ORIGIN}${url}`;
  }

  const handleToggleLike = async (postId, currentIsLiked) => {
  try {
    // optimistic UI 적용하려면 여기서 먼저 setPosts 해도 됨. 일단 서버 기준으로 갈게.
    let result;
    if (currentIsLiked) {
      result = await unlikePost(postId);
    } else {
      result = await likePost(postId);
    }

    const { liked, likeCount } = result;

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, isLiked: liked ? 1 : 0, likeCount }
          : p
      )
    );
  } catch (err) {
    console.error("좋아요 토글 실패:", err);
  }
};

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#fafafa" }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <HomeIcon />
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              Gamegram
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <IconButton onClick={goCreate}>
              <AddCircleOutlineIcon />
            </IconButton>

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
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <TextField
            select
            size="small"
            label="게임 필터"
            value={selectedGameId}
            onChange={(e) => setSelectedGameId(e.target.value)}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">전체</MenuItem>
            {gameList.map((g) => (
              <MenuItem key={g.id} value={g.id}>
                {g.name}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        <Typography variant="h6" sx={{ mb: 1 }}>
          피드
        </Typography>

        {loading && <Typography>피드를 불러오는 중...</Typography>}
        {error && (
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        )}

        {posts.length === 0 && !loading && !error && (
          <Card>
            <CardContent>
              <Typography variant="body1">
                아직 게시글이 없습니다. 첫 번째 겜짤을 올려보세요!
              </Typography>
            </CardContent>
          </Card>
        )}

        {posts.map((post) => {
          const liked = !!post.isLiked;

          return (
            <Card key={post.id}>
              {post.thumbUrl && (
                <CardMedia
                  component={post.thumbType === "VIDEO" ? "video" : "img"}
                  src={getMediaUrl(post.thumbUrl)}
                  controls={post.thumbType === "VIDEO"}
                  sx={{ maxHeight: 400 }}
                />
              )}

              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                  {post.nickname || post.username} ・ {post.gameName}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {new Date(post.createdAt).toLocaleString()}
                </Typography>
                <Typography variant="body1" sx={{ mt: 1, mb: 1 }}>
                  {post.caption}
                </Typography>

                {/* 좋아요 영역 */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <IconButton
                    size="small"
                    onClick={() => handleToggleLike(post.id, liked)}
                  >
                    {liked ? (
                      <FavoriteIcon color="error" fontSize="small" />
                    ) : (
                      <FavoriteBorderIcon fontSize="small" />
                    )}
                  </IconButton>
                  <Typography variant="body2">
                    {post.likeCount ?? 0}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Container>
    </Box>
  );
}

export default FeedPage;
