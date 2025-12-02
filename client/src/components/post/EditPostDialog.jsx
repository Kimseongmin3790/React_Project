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
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Autocomplete from "@mui/material/Autocomplete";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import { updatePost } from "../../api/postApi";

function EditPostDialog({ open, post, gameList = [], onClose, onSaved }) {
  const [selectedGameId, setSelectedGameId] = useState("");
  const [gameSearch, setGameSearch] = useState("");
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageFiles, setImageFiles] = useState([]);
  const [videoFiles, setVideoFiles] = useState([]);

  const hasNewMedia = imageFiles.length > 0 || videoFiles.length > 0;

  // 다이얼로그 열릴 때, 수정할 게시글 정보로 초기화
  useEffect(() => {
    if (open && post) {
      const gameIdStr = String(post.gameId ?? "");
      setSelectedGameId(gameIdStr);

      const foundGame =
        gameList.find((g) => String(g.id) === gameIdStr) || null;

      setGameSearch(foundGame?.name || post.gameName || "");
      setCaption(post.caption || "");
      setError("");
      setLoading(false);

      setImageFiles([]);
      setVideoFiles([]);
    }
    if (!open) {
      setError("");
      setLoading(false);
      setImageFiles([]);
      setVideoFiles([]);
    }
  }, [open, post, gameList]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!post) return;

    if (!selectedGameId) {
      setError("게임을 선택해주세요.");
      return;
    }

    if (!caption.trim()) {
      setError("설명을 입력해주세요.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await updatePost(post.id, {
        caption,
        gameId: selectedGameId,
        images: imageFiles,
        videos: videoFiles,
        replaceMedia: hasNewMedia,
      });

      const updatedGame =
        gameList.find((g) => String(g.id) === String(selectedGameId)) || null;

      const updatedPost = {
        id: post.id,
        caption,
        gameId: Number(selectedGameId),
        gameName: updatedGame?.name || post.gameName,
        gameSlug: updatedGame?.slug || post.gameSlug,
      };

      if (onSaved) onSaved(updatedPost);
    } catch (err) {
      console.error("updatePost error (EditPostDialog):", err);
      const msg =
        err?.response?.data?.message ||
        "게시글 수정 중 오류가 발생했습니다.";
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
        피드 수정
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
        {post ? (
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              {/* 게임 선택 */}
              <Autocomplete
                size="small"
                options={gameList}
                getOptionLabel={(option) => option.name || ""}
                noOptionsText="게임이 없습니다"
                value={
                  gameList.find(
                    (g) => String(g.id) === String(selectedGameId)
                  ) || null
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

              {/* 미디어 교체 영역 */}
              <Box>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  이미지 / 영상 교체 (선택)
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary", display: "block", mb: 1 }}
                >
                  미디어를 선택하지 않으면 기존 이미지/영상이 유지됩니다.
                  새 이미지/영상을 선택하면 기존 미디어는 모두 교체됩니다.
                </Typography>

                {/* 이미지 업로드 */}
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
                    mb: 1.5,
                  }}
                >
                  <input
                    id="edit-post-images"
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: "none" }}
                    onChange={handleImageChange}
                  />
                  <label htmlFor="edit-post-images">
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

                {/* 영상 업로드 */}
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
                    id="edit-post-video"
                    type="file"
                    accept="video/*"
                    style={{ display: "none" }}
                    onChange={handleVideoChange}
                  />
                  <label htmlFor="edit-post-video">
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
        ) : (
          <Typography variant="body2">
            수정할 게시글 정보를 불러오는 중입니다.
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          취소
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={
            loading || !selectedGameId || !caption.trim() || !post
          }
        >
          {loading ? "수정 중..." : "수정하기"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default EditPostDialog;
