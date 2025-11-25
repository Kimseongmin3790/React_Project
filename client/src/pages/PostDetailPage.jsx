import React, { useEffect, useState } from "react";
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Container,
  Card,
  CardContent,
  CardMedia,
  Avatar,
  TextField,
  Button,
  Stack,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchPost,
  fetchComments,
  createComment,
  likePost,
  unlikePost,
  bookmarkPost,
  unbookmarkPost,
} from "../api/postApi";

const API_ORIGIN = "http://localhost:3020";

function getMediaUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API_ORIGIN}${url}`;
}

function PostDetailPage() {
  const { postId } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [loadingPost, setLoadingPost] = useState(true);
  const [postError, setPostError] = useState("");

  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);

  const [commentInput, setCommentInput] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  // 게시글 정보 로딩
  useEffect(() => {
    async function loadPost() {
      try {
        setLoadingPost(true);
        setPostError("");
        const p = await fetchPost(postId);
        setPost(p);
      } catch (err) {
        console.error("게시글 상세 불러오기 실패:", err);
        setPostError("게시글을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoadingPost(false);
      }
    }
    if (postId) {
      loadPost();
    }
  }, [postId]);

  // 댓글 로딩
  useEffect(() => {
    async function loadComments() {
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
    if (postId) {
      loadComments();
    }
  }, [postId]);

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
        prev
          ? {
              ...prev,
              isLiked: liked ? 1 : 0,
              likeCount,
            }
          : prev
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
        prev
          ? {
              ...prev,
              isBookmarked: bookmarked ? 1 : 0,
            }
          : prev
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

      // commentCount 증가
      setPost((prev) =>
        prev
          ? {
              ...prev,
              commentCount: (prev.commentCount || 0) + 1,
            }
          : prev
      );
    } catch (err) {
      console.error("상세 댓글 작성 실패:", err);
    } finally {
      setCommentSubmitting(false);
    }
  };

  const liked = !!post?.isLiked;
  const bookmarked = !!post?.isBookmarked;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#fafafa" }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <IconButton edge="start" onClick={() => navigate(-1)}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ ml: 1, fontWeight: "bold" }}>
            게시글 상세
          </Typography>
        </Toolbar>
      </AppBar>

      <Container
        maxWidth="sm"
        sx={{ mt: 3, pb: 4, display: "flex", flexDirection: "column", gap: 2 }}
      >
        {loadingPost && <Typography>게시글 불러오는 중...</Typography>}
        {postError && (
          <Typography color="error" variant="body2">
            {postError}
          </Typography>
        )}

        {post && (
          <Card>
            <CardContent>
              {/* 작성자 / 게임 / 시간 */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mb: 2,
                  gap: 1.5,
                }}
              >
                <Avatar src={post.avatarUrl || ""}>
                  {post.nickname?.[0] || post.username?.[0] || "U"}
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                    {post.nickname || post.username}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "text.secondary" }}
                  >
                    {post.gameName} ・{" "}
                    {new Date(post.createdAt).toLocaleString()}
                  </Typography>
                </Box>
              </Box>

              {/* 이미지/영상 전체 */}
              {post.media && post.media.length > 0 && (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.5,
                    mb: 2,
                  }}
                >
                  {post.media.map((m) => (
                    <CardMedia
                      key={m.id}
                      component={m.mediaType === "VIDEO" ? "video" : "img"}
                      src={getMediaUrl(m.url)}
                      controls={m.mediaType === "VIDEO"}
                      sx={{ maxHeight: 500, borderRadius: 1 }}
                    />
                  ))}
                </Box>
              )}

              {/* 캡션 */}
              <Typography variant="body1" sx={{ mb: 2 }}>
                {post.caption}
              </Typography>

              {/* 좋아요 / 북마크 / 카운트 */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  mb: 1,
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
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  댓글
                </Typography>

                {commentsLoading && comments.length === 0 && (
                  <Typography variant="body2">
                    댓글 불러오는 중...
                  </Typography>
                )}

                {comments.map((c) => (
                  <Box
                    key={c.id}
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      mt: 1.5,
                    }}
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
                      <Typography variant="body2" sx={{ lineHeight: 1.4 }}>
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
            </CardContent>
          </Card>
        )}
      </Container>
    </Box>
  );
}

export default PostDetailPage;
