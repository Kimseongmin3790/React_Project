// src/components/post/CreatePostDialog.jsx
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  TextField,
  Typography,
  Stack,
  MenuItem,
  IconButton,
} from "@mui/material";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import CloseIcon from "@mui/icons-material/Close";
import Autocomplete from "@mui/material/Autocomplete";

import { createPost, fetchGameList } from "../../api/postApi";

function CreatePostDialog({ open, onClose, onCreated }) {
  const [gameList, setGameList] = useState([]);
  const [selectedGameId, setSelectedGameId] = useState("");
  const [caption, setCaption] = useState("");
  const [gameSearch, setGameSearch] = useState("");

  const [imageFiles, setImageFiles] = useState([]);
  const [videoFiles, setVideoFiles] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const hasMedia = imageFiles.length > 0 || videoFiles.length > 0;

  // 게임 목록 로딩
  useEffect(() => {
    if (!open) return;
    async function loadGames() {
      try {
        const games = await fetchGameList();
        setGameList(games);
      } catch (err) {
        console.error("게임 목록 불러오기 실패:", err);
      }
    }
    loadGames();
  }, [open]);

  // 모달 닫힐 때 폼 초기화
  useEffect(() => {
    if (!open) {
      setSelectedGameId("");
      setCaption("");
      setImageFiles([]);
      setVideoFiles([]);
      setError("");
      setLoading(false);
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError("");

    if (!selectedGameId) {
      setError("게임을 선택해주세요.");
      return;
    }

    if (!hasMedia) {
      setError("이미지나 동영상을 최소 1개 이상 첨부해주세요.");
      return;
    }

    setLoading(true);
    try {
      await createPost({
        gameId: selectedGameId,
        caption,
        images: imageFiles,
        videos: videoFiles,
      });

      if (onCreated) onCreated(); // 피드 새로고침 등
      onClose();
    } catch (err) {
      console.error("createPost error:", err);
      const msg =
        err?.response?.data?.message ||
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
    setVideoFiles(files.slice(0, 1)); // 영상은 1개만
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pr: 2,
        }}
      >
        새 게시글
        <IconButton
          size="small"
          onClick={onClose}
          disabled={loading}
          sx={{ ml: 1 }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2}>
            {/* 게임 선택 */}
            <Autocomplete
              size="small"
              options={gameList}
              getOptionLabel={(option) => option.name || ""}
              noOptionsText="게임이 없습니다"
              value={
                gameList.find((g) => String(g.id) === String(selectedGameId)) || null
              }
              onChange={(e, newValue) => {
                if (newValue) {
                  setSelectedGameId(String(newValue.id));
                  setGameSearch(newValue.name || "");
                } else {
                  setSelectedGameId("");
                  setGameSearch("");
                }
              }}
              inputValue={gameSearch}
              onInputChange={(e, value) => {
                setGameSearch(value);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="게임"
                  required
                  fullWidth
                  placeholder="게임 이름을 입력하세요"
                />
              )}
            />

            {/* 설명 */}
            <TextField
              label="설명 (하이라이트 설명, 상황 등)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              multiline
              minRows={3}
              fullWidth
            />

            {/* 이미지 업로드 박스 */}
            <Box>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                이미지 (여러 장 선택 가능)
              </Typography>

              <Box
                sx={{
                  border: "1px dashed #bdbdbd",
                  borderRadius: 2,
                  p: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  flexWrap: "wrap",
                  bgcolor: "#fafafa",
                }}
              >
                <input
                  id="create-post-images"
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: "none" }}
                  onChange={handleImageChange}
                />
                <label htmlFor="create-post-images">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<PhotoCameraIcon />}
                    sx={{ textTransform: "none" }}
                  >
                    이미지 선택
                  </Button>
                </label>

                {imageFiles.length === 0 && (
                  <Typography
                    variant="body2"
                    sx={{ color: "text.secondary" }}
                  >
                    선택된 이미지가 없습니다.
                  </Typography>
                )}

                {imageFiles.length > 0 && (
                  <Box
                    sx={{
                      display: "flex",
                      gap: 1,
                      flexWrap: "wrap",
                      mt: 1,
                    }}
                  >
                    {imageFiles.map((file, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          width: 72,
                          height: 72,
                          borderRadius: 1,
                          overflow: "hidden",
                          border: "1px solid #e0e0e0",
                        }}
                      >
                        <Box
                          component="img"
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          sx={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Box>

            {/* 영상 업로드 박스 */}
            <Box>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                영상 (최대 1개)
              </Typography>

              <Box
                sx={{
                  border: "1px dashed #bdbdbd",
                  borderRadius: 2,
                  p: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  flexWrap: "wrap",
                  bgcolor: "#fafafa",
                }}
              >
                <input
                  id="create-post-video"
                  type="file"
                  accept="video/*"
                  style={{ display: "none" }}
                  onChange={handleVideoChange}
                />
                <label htmlFor="create-post-video">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<VideoLibraryIcon />}
                    sx={{ textTransform: "none" }}
                  >
                    영상 선택
                  </Button>
                </label>

                {videoFiles.length === 0 && (
                  <Typography
                    variant="body2"
                    sx={{ color: "text.secondary" }}
                  >
                    선택된 영상이 없습니다.
                  </Typography>
                )}

                {videoFiles[0] && (
                  <Typography variant="body2">
                    {videoFiles[0].name}
                  </Typography>
                )}
              </Box>
            </Box>

            {error && (
              <Typography variant="body2" color="error">
                {error}
              </Typography>
            )}
          </Stack>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          취소
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={
            loading || !selectedGameId || !hasMedia || !caption.trim()
          }
        >
          {loading ? "작성 중..." : "게시하기"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default CreatePostDialog;
