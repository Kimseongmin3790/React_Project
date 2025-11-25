import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Stack,
  AppBar,
  Toolbar,
  IconButton,
  MenuItem
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";
import { createPost, fetchGameList } from "../api/postApi";

function CreatePostPage() {
  const navigate = useNavigate();
  
  const [gameList, setGameList] = useState([]);
  const [selectedGameId, setSelectedGameId] = useState("");
  const [caption, setCaption] = useState("");

  const [imageFiles, setImageFiles] = useState([]);
  const [videoFiles, setVideoFiles] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!selectedGameId) {
        setError("게임을 선택해주세요.");
        setLoading(false);
        return;
      }

      await createPost({
        gameId: selectedGameId,
        caption,
        images: imageFiles,
        videos: videoFiles,
      });

      // 성공하면 피드로
      navigate("/");
    } catch (err) {
      console.error("createPost error:", err);
      const msg =
        err.response?.data?.message ||
        "게시글 작성 중 오류가 발생했습니다.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    setImageFiles(files);
  };

  const handleVideoChange = (e) => {
    const files = Array.from(e.target.files || []);
    // 영상은 1개만
    setVideoFiles(files.slice(0, 1));
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#fafafa" }}>
      {/* 상단 바 */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <IconButton edge="start" onClick={() => navigate(-1)}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ ml: 1, fontWeight: "bold" }}>
            새 게시글
          </Typography>
        </Toolbar>
      </AppBar>

      {/* 본문 */}
      <Box
        sx={{
          mt: 4,
          display: "flex",
          justifyContent: "center",
          px: 2,
        }}
      >
        <Paper
          elevation={2}
          sx={{
            width: "100%",
            maxWidth: 500,
            p: 3,
            borderRadius: 3,
          }}
        >
          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                select
                label="게임"
                value={selectedGameId}
                onChange={(e) => setSelectedGameId(e.target.value)}
                required
                fullWidth
              >
                {gameList.map((g) => (
                  <MenuItem key={g.id} value={g.id}>
                    {g.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="설명 (하이라이트 설명, 상황 등)"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                multiline
                minRows={3}
                fullWidth
              />

              <div>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  이미지 (여러 장 선택 가능)
                </Typography>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                />
              </div>

              <div>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  영상 (최대 1개)
                </Typography>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoChange}
                />
              </div>

              {error && (
                <Typography variant="body2" color="error">
                  {error}
                </Typography>
              )}

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
              >
                {loading ? "작성 중..." : "게시하기"}
              </Button>
            </Stack>
          </form>
        </Paper>
      </Box>
    </Box>
  );
}

export default CreatePostPage;
