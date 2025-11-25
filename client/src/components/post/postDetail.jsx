// src/components/PostDetailDialog.jsx
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Avatar,
  TextField,
  Button,
  CardMedia,
  Stack,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import {
  fetchPost,
  fetchComments,
  createComment,
  likePost,
  unlikePost,
  bookmarkPost,
  unbookmarkPost,
} from "../../api/postApi";

const API_ORIGIN = "http://localhost:3020";

function getMediaUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API_ORIGIN}${url}`;
}

function PostDetailDialog({ open, onClose, postId }) {
  const [post, setPost] = useState(null);
  const [loadingPost, setLoadingPost] = useState(false);
  const [postError, setPostError] = useState("");

  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const [commentInput, setCommentInput] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const [mediaIndex, setMediaIndex] = useState(0);

  // 모달 열릴 때마다 데이터 로딩
  useEffect(() => {
    if (!open || !postId) return;

    async function loadData() {
      try {
        setLoadingPost(true);
        setPostError("");
        const p = await fetchPost(postId);
        setPost(p);
        setMediaIndex(0);
      } catch (err) {
        console.error("게시글 상세 불러오기 실패:", err);
        setPostError("게시글을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoadingPost(false);
      }

      try {
        setCommentsLoading(true);
        const list = await fetchComments(postId);
        setComments(list);
      } catch (err) {
        console.error("댓글 불러오기 실패(상세):", err);
      } finally {
        setCommentsLoading(false);
      }
    }

    loadData();
  }, [open, postId]);

  const handleClose = () => {
    onClose();
    // 모달 닫힐 때 상태 초기화 (선택 사항)
    setPost(null);
    setComments([]);
    setCommentInput("");
  };

  const handleToggleLike = async () => {
    if (!post) return;
    const currentIsLiked = !!post.isLiked;
    try {
      let res;
      if (currentIsLiked) {
        res = await unlikePost(post.id);
      } else {
        res = await likePost(post.id);
      }
      const { liked, likeCount } = res;
      setPost((prev) =>
        prev ? { ...prev, isLiked: liked ? 1 : 0, likeCount } : prev
      );
    } catch (err) {
      console.error("상세 좋아요 토글 실패:", err);
    }
  };

  const handleToggleBookmark = async () => {
    if (!post) return;
    const currentIsBookmarked = !!post.isBookmarked;
    try {
      let res;
      if (currentIsBookmarked) {
        res = await unbookmarkPost(post.id);
      } else {
        res = await bookmarkPost(post.id);
      }
      const { bookmarked } = res;
      setPost((prev) =>
        prev ? { ...prev, isBookmarked: bookmarked ? 1 : 0 } : prev
      );
    } catch (err) {
      console.error("상세 북마크 토글 실패:", err);
    }
  };

  const handleSubmitComment = async () => {
    if (!post) return;
    const text = commentInput.trim();
    if (!text) return;

    try {
      setCommentSubmitting(true);
      const newComment = await createComment(post.id, text);
      setComments((prev) => [...prev, newComment]);
      setCommentInput("");
      setPost((prev) =>
        prev
          ? { ...prev, commentCount: (prev.commentCount || 0) + 1 }
          : prev
      );
    } catch (err) {
      console.error("상세 댓글 작성 실패:", err);
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handlePrevMedia = () => {
    if (!post || !post.media || post.media.length === 0) return;
    setMediaIndex((prev) =>
        prev === 0 ? post.media.length - 1 : prev - 1
    );
  };

    const handleNextMedia = () => {
    if (!post || !post.media || post.media.length === 0) return;
    setMediaIndex((prev) =>
        prev === post.media.length - 1 ? 0 : prev + 1
    );
  };

  const liked = !!post?.isLiked;
  const bookmarked = !!post?.isBookmarked;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      scroll="paper"
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", pr: 5 }}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          게시글 상세
        </Typography>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {loadingPost && <Typography>게시글 불러오는 중...</Typography>}
        {postError && (
          <Typography color="error" variant="body2">
            {postError}
          </Typography>
        )}

        {post && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/* 작성자 / 게임 / 시간 */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Avatar src={post.avatarUrl || ""}>
                {post.nickname?.[0] || post.username?.[0] || "U"}
              </Avatar>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                  {post.nickname || post.username}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {post.gameName} ・{" "}
                  {new Date(post.createdAt).toLocaleString()}
                </Typography>
              </Box>
            </Box>

            {/* 이미지/영상 전체 */}
            {post.media && post.media.length > 0 && (
              <Box sx={{ position: "relative", mb: 2 }}>
                {/* 현재 선택된 한 장만 보여주기 */}
                <CardMedia
                component={
                    post.media[mediaIndex].mediaType === "VIDEO" ? "video" : "img"
                }
                src={getMediaUrl(post.media[mediaIndex].url)}
                controls={post.media[mediaIndex].mediaType === "VIDEO"}
                sx={{ maxHeight: 500, borderRadius: 1 }}
                />

                {/* 여러 장일 때만 화살표 / 인디케이터 표시 */}
                {post.media.length > 1 && (
                  <>
                    {/* 왼쪽 화살표 */}
                    <IconButton
                      onClick={handlePrevMedia}
                      sx={{
                          position: "absolute",
                          top: "50%",
                          left: 8,
                          transform: "translateY(-50%)",
                          bgcolor: "rgba(0,0,0,0.4)",
                          "&:hover": {
                          bgcolor: "rgba(0,0,0,0.6)",
                          },
                      }}
                    >
                      <ChevronLeftIcon sx={{ color: "#fff" }} />
                    </IconButton>

                    {/* 오른쪽 화살표 */}
                    <IconButton
                      onClick={handleNextMedia}
                      sx={{
                          position: "absolute",
                          top: "50%",
                          right: 8,
                          transform: "translateY(-50%)",
                          bgcolor: "rgba(0,0,0,0.4)",
                          "&:hover": {
                          bgcolor: "rgba(0,0,0,0.6)",
                          },
                      }}
                    >
                      <ChevronRightIcon sx={{ color: "#fff" }} />
                    </IconButton>

                    {/* 아래쪽 인디케이터 (1 / N) */}
                    <Box
                      sx={{
                          position: "absolute",
                          bottom: 8,
                          right: 12,
                          bgcolor: "rgba(0,0,0,0.6)",
                          color: "#fff",
                          borderRadius: 999,
                          px: 1.2,
                          py: 0.3,
                          fontSize: "0.75rem",
                      }}
                    >
                      {mediaIndex + 1} / {post.media.length}
                    </Box>
                  </>
                )}
              </Box>
            )}

            {/* 캡션 */}
            <Typography
            variant="body1"
            sx={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                overflowWrap: "anywhere",
            }}
            >
            {post.caption}
            </Typography>

            {/* 좋아요 / 북마크 / 댓글 수 */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <IconButton size="small" onClick={handleToggleLike}>
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

              <IconButton size="small" onClick={handleToggleBookmark}>
                {bookmarked ? (
                  <BookmarkIcon fontSize="small" />
                ) : (
                  <BookmarkBorderIcon fontSize="small" />
                )}
              </IconButton>

              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                댓글 {post.commentCount ?? 0}개
              </Typography>
            </Box>

            {/* 댓글 리스트 */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                댓글
              </Typography>

              {commentsLoading && comments.length === 0 && (
                <Typography variant="body2">댓글 불러오는 중...</Typography>
              )}

              {comments.map((c) => (
                <Box
                  key={c.id}
                  sx={{ display: "flex", alignItems: "flex-start", mt: 1.5 }}
                >
                  <Avatar
                    sx={{ width: 28, height: 28, mr: 1 }}
                    src={c.avatarUrl || ""}
                  >
                    {c.nickname?.[0] || c.username?.[0] || "U"}
                  </Avatar>
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: "bold", lineHeight: 1.2 }}
                    >
                      {c.nickname || c.username}
                    </Typography>
                    <Typography variant="body2" 
                    sx={{ 
                        lineHeight: 1.4,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        overflowWrap: "anywhere", 
                    }}
                    >
                      {c.content}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary" }}
                    >
                      {new Date(c.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              ))}

              {/* 댓글 입력 */}
              <Stack
                direction="row"
                spacing={1}
                sx={{ mt: 2, alignItems: "center" }}
              >
                <TextField
                  size="small"
                  placeholder="댓글 달기..."
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  fullWidth
                />
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleSubmitComment}
                  disabled={!commentInput.trim() || commentSubmitting}
                >
                  등록
                </Button>
              </Stack>
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default PostDetailDialog;
