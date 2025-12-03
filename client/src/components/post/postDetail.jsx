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
  Snackbar,
  Alert,
  Paper
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import CommentRichText from "./CommentRichText";
import {
  fetchPost,
  fetchComments,
  createComment,
  likePost,
  unlikePost,
  bookmarkPost,
  unbookmarkPost,
  likeComment,
  unlikeComment,
  updateCommentApi,
  deleteCommentApi,
} from "../../api/postApi";
import { searchUsers } from "../../api/userApi";
import EditPostDialog from "./EditPostDialog";

const API_ORIGIN = "http://localhost:3020";

function getMediaUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API_ORIGIN}${url}`;
}

function PostDetailDialog({ open, onClose, postId, onPostUpdated, gameList = [] }) {
  const [post, setPost] = useState(null);
  const [loadingPost, setLoadingPost] = useState(false);
  const [postError, setPostError] = useState("");

  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [replyTarget, setReplyTarget] = useState(null);

  const [commentInput, setCommentInput] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState("");

  const [mediaIndex, setMediaIndex] = useState(0);
  const [editOpen, setEditOpen] = useState(false);

  const [achievementToastOpen, setAchievementToastOpen] = useState(false);
  const [achievementToastMessage, setAchievementToastMessage] = useState("");

  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionCandidates, setMentionCandidates] = useState([]);
  const mentionDebounceRef = React.useRef(null);
  
  const navigate = useNavigate();
  const { user } = useAuth();

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
    setPost(null);
    setComments([]);
    setCommentInput("");
    setEditOpen(false);
  };

  const handleClickAuthor = () => {
    if (!post) return;

    const authorId = post.userId ?? post.user_id;
    if (!authorId) return;

    if (user && user.id === authorId) {
      navigate("/me");
    } else {
      navigate(`/users/${authorId}`);
    }
  };

  const handleClickTag = (tagName) => {
    if (!tagName) return;
    navigate(`/tags/${encodeURIComponent(tagName)}`);
  };

  const renderCaptionWithHashtags = (text) => {
    if (!text) return null;

    const parts = text.split(/(\#[^\s#]+)/g);

    return parts.map((part, idx) => {
      if (/^\#[^\s#]+$/.test(part)) {
        const tagName = part.slice(1);
        return (
          <Typography
            key={idx}
            component="span"
            sx={{
              color: "primary.main",
              fontWeight: 500,
              cursor: "pointer",
            }}
            onClick={() => handleClickTag(tagName)}
          >
            {part}
          </Typography>
        );
      }

      return (
        <Typography key={idx} component="span">
          {part}
        </Typography>
      );
    });
  };

  const handleOpenEdit = () => {
    if (!post) return;
    setEditOpen(true);
  };

  const handleCloseEdit = () => {
    setEditOpen(false);
  };

  const handleEditSaved = async () => {
    if (!postId) {
      setEditOpen(false);
      return;
    }

    try {
      const refreshed = await fetchPost(postId);
      setPost(refreshed);
      
      if (onPostUpdated) {
        onPostUpdated(refreshed);
      }
    } catch (err) {
      console.error("수정 후 게시글 재로딩 실패:", err);
    } finally {
      setEditOpen(false);
    }
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

      setPost((prev) => {
        if (!prev) return prev;
        const next = {
          ...prev,
          isLiked: liked ? 1 : 0,
          likeCount,
        };
        if (onPostUpdated) {
          onPostUpdated(next);
        }
        return next;
      });
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

      setPost((prev) => {
        if (!prev) return prev;
        const next = {
          ...prev,
          isBookmarked: bookmarked ? 1 : 0,          
        };
        if (onPostUpdated) {
          onPostUpdated(next);
        }
        return next;
      });
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

      let finalText = text;
      let parentId = null;

      if (replyTarget) {
        const targetName = replyTarget.username || replyTarget.nickname || "유저";
        const mentionPrefix = `@${targetName} `;
        if (!text.startsWith("@")) {
          finalText = mentionPrefix + text;
        } else {
          finalText = text;
        }
        parentId = replyTarget.commentId
      }
      
      const res = await createComment(post.id, finalText, parentId);
      const newComment = res.comment;

      setComments((prev) => [...prev, newComment]);
      setCommentInput("");
      setReplyTarget(null);

      setPost((prev) => {
        if (!prev) return prev;
        const next = {
          ...prev,
          commentCount: (prev.commentCount || 0) + 1,          
        };
        if (onPostUpdated) {
          onPostUpdated(next);
        }
        return next;
      });

      const myResult = res.commentAuthorAchievementResult;
      const myNew = myResult?.newlyUnlocked || [];

      if (myNew.length > 0) {
        const names = myNew.map((a) => a.name).join(", ");
        setAchievementToastMessage(
          myNew.length === 1
            ? `새 업적 달성: ${names}`
            : `새 업적 ${myNew.length}개 달성! (${names})`
        );
        setAchievementToastOpen(true);
      }
    } catch (err) {
      console.error("상세 댓글 작성 실패:", err);
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleToggleCommentLike = async (comment) => {
    const currentIsLiked = !!comment.isLiked;
    try {
      const res = currentIsLiked
        ? await unlikeComment(comment.id)
        : await likeComment(comment.id);

      const { liked, likeCount } = res;

      setComments((prev) =>
        prev.map((c) => {
          if (c.id === comment.id) {
            return { ...c, isLiked: liked ? 1 : 0, likeCount };
          }

          if (c.replies && c.replies.length > 0) {
            return {
              ...c,
              replies: c.replies.map((r) =>
                r.id === comment.id
                  ? { ...r, isLiked: liked ? 1 : 0, likeCount }
                  : r
              ),
            };
          }
          return c;
        })
      );
    } catch (err) {
      console.error("댓글 좋아요 토글 실패:", err);
    }
  };

  const startEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditingContent(comment.content);
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditingContent("");
  };

  const submitEditComment = async (commentId) => {
    const text = editingContent.trim();
    if (!text) return;

    try {
      const updated = await updateCommentApi(commentId, text);

      setComments((prev) =>
        prev.map((c) => {
          if (c.id === commentId) {
            return {
              ...c,
              content: updated.content,
              updatedAt: updated.updatedAt || c.updatedAt,
            };
          }

          if (c.replies && c.replies.length > 0) {
            return {
              ...c,
              replies: c.replies.map((r) =>
                r.id === commentId
                  ? {
                      ...r,
                      content: updated.content,
                      updatedAt: updated.updatedAt || r.updatedAt,
                    }
                  : r
              ),
            };
          }

          return c;
        })
      );

      cancelEditComment();
    } catch (err) {
      console.error("댓글 수정 실패:", err);
      alert("댓글 수정 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteComment = async (commentId, isReply = false, parentId = null) => {
    if (!window.confirm("이 댓글을 삭제하시겠습니까?")) return;

    try {
      await deleteCommentApi(commentId);

      setComments((prev) =>
        prev
          .map((c) => {
            if (c.id === commentId) {
              return null;
            }

            if (c.replies && c.replies.length > 0) {
              return {
                ...c,
                replies: c.replies.filter((r) => r.id !== commentId),
              };
            }

            return c;
          })
          .filter(Boolean)
      );

      setPost((prev) => {
        if (!prev) return prev;
        const next = {
          ...prev,
          commentCount: Math.max((prev.commentCount || 1) - 1, 0),
        };
        if (onPostUpdated) onPostUpdated(next);
        return next;
      });
    } catch (err) {
      console.error("댓글 삭제 실패:", err);
      alert("댓글 삭제 중 오류가 발생했습니다.");
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

  const handleChangeCommentInput = (e) => {
    const value = e.target.value;
    setCommentInput(value);

    const match = value.match(/@([A-Za-z0-9_가-힣]{1,20})$/);
    if (!match) {
      setMentionOpen(false);
      setMentionQuery("");
      setMentionCandidates([]);
      return;
    }

    const q = match[1];
    setMentionQuery(q);

    if (q.length < 1) {
      setMentionOpen(false);
      setMentionCandidates([]);
      return;
    }

    // 디바운스
    if (mentionDebounceRef.current) {
      clearTimeout(mentionDebounceRef.current);
    }

    mentionDebounceRef.current = setTimeout(async () => {
      try {
        const list = await searchUsers(q);
        setMentionCandidates(list || []);
        setMentionOpen(list && list.length > 0);
      } catch (err) {
        console.error("mention search error:", err);
        setMentionOpen(false);
      }
    }, 200);
  };

  const handleSelectMention = (u) => {
    setCommentInput((prev) =>
      prev.replace(/@([A-Za-z0-9_가-힣]{1,20})$/, `@${u.username} `)
    );
    setMentionOpen(false);
    setMentionCandidates([]);
  };

  const buildCommentTree = (items) => {
    const byId = new Map();
    const roots = [];

    items.forEach((c) => {
      byId.set(c.id, { ...c, replies: [] });
    });

    byId.forEach((c) => {
      if (c.parentCommentId) {
        const parent = byId.get(c.parentCommentId);
        if (parent) {
          parent.replies.push(c);
        } else {
          roots.push(c);
        }
      } else {
        roots.push(c);
      }
    });

    return roots;
  };

  const commentTree = buildCommentTree(comments);

  const liked = !!post?.isLiked;
  const bookmarked = !!post?.isBookmarked;
  const isMyPost = !!(user && post && user.id === (post.userId ?? post.user_id));

  const renderCommentItem = (comment, depth = 0) => {
    const isMyComment =
      user && (comment.userId === user.id || comment.user_id === user.id);
    const likedComment = !!comment.isLiked;

    return (
      <Box
        key={comment.id}
        sx={{
          mt: depth === 0 ? 1.5 : 1,
          ml: depth > 0 ? 4 : 0, // depth에 따라 들여쓰기
        }}
      >
        <Box sx={{ display: "flex", alignItems: "flex-start" }}>
          <Avatar
            sx={{ width: depth === 0 ? 28 : 24, height: depth === 0 ? 28 : 24, mr: 1 }}
            src={getMediaUrl(comment.avatarUrl) || ""}
          >
            {comment.nickname?.[0] || comment.username?.[0] || "U"}
          </Avatar>

          <Box sx={{ flex: 1 }}>
            <Typography
              variant="body2"
              sx={{ fontWeight: "bold", lineHeight: 1.2 }}
            >
              {comment.nickname || comment.username}
            </Typography>

            {/* 내용 / 수정 모드 */}
            {editingCommentId === comment.id ? (
              <>
                <TextField
                  size="small"
                  fullWidth
                  multiline
                  minRows={1}
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  sx={{ mt: 0.5 }}
                />
                <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => submitEditComment(comment.id)}
                    disabled={!editingContent.trim()}
                  >
                    저장
                  </Button>
                  <Button
                    variant="text"
                    size="small"
                    onClick={cancelEditComment}
                  >
                    취소
                  </Button>
                </Box>
              </>
            ) : (
              <Typography
                variant="body2"
                sx={{
                  lineHeight: 1.4,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  overflowWrap: "anywhere",
                }}
              >
                <CommentRichText text={comment.content} />
              </Typography>
            )}

            {/* 하단: 시간 / 좋아요 / 답글 / 수정삭제 */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mt: 0.5,
              }}
            >
              <Typography
                variant="caption"
                sx={{ color: "text.secondary" }}
              >
                {new Date(comment.createdAt).toLocaleString()}
              </Typography>

              {/* 좋아요 */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.25,
                }}
              >
                <IconButton
                  size="small"
                  onClick={() => handleToggleCommentLike(comment)}
                >
                  {likedComment ? (
                    <FavoriteIcon color="error" fontSize="small" />
                  ) : (
                    <FavoriteBorderIcon fontSize="small" />
                  )}
                </IconButton>
                <Typography variant="caption">
                  {comment.likeCount ?? 0}
                </Typography>
              </Box>

              {/* 답글 버튼 */}
              {editingCommentId !== comment.id && (
                <Button
                  size="small"
                  variant="text"
                  onClick={() =>
                    setReplyTarget({
                      commentId: comment.id,
                      userId: comment.userId,
                      username: comment.username,
                      nickname: comment.nickname || comment.username || "유저",
                    })
                  }
                  sx={{
                    textTransform: "none",
                    fontSize: "0.75rem",
                    px: 0,
                  }}
                >
                  답글
                </Button>
              )}

              {/* 내 댓글이면 수정/삭제 */}
              {isMyComment && editingCommentId !== comment.id && (
                <>
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => startEditComment(comment)}
                    sx={{
                      textTransform: "none",
                      fontSize: "0.75rem",
                      px: 0,
                    }}
                  >
                    수정
                  </Button>
                  <Button
                    size="small"
                    variant="text"
                    color="error"
                    onClick={() => handleDeleteComment(comment.id)}
                    sx={{
                      textTransform: "none",
                      fontSize: "0.75rem",
                      px: 0,
                    }}
                  >
                    삭제
                  </Button>
                </>
              )}
            </Box>

            {/* 🔁 재귀적으로 자식 댓글(대댓글, 그 대댓글의 대댓글...) 렌더 */}
            {comment.replies && comment.replies.length > 0 && (
              <Box sx={{ mt: 0.5 }}>
                {comment.replies.map((child) =>
                  renderCommentItem(child, depth + 1)
                )}
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    );
  };

  return (
    <>
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
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1.5,
                }}
              >
                <Box 
                  sx={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: 1.5, 
                    cursor: "pointer",
                  }}
                  onClick={handleClickAuthor}  
                >
                  <Avatar src={getMediaUrl(post.avatarUrl) || ""}>
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

                {isMyPost && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleOpenEdit}
                    sx={{ textTransform: "none" }}
                  >
                    수정
                  </Button>
                )}
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
              <Box
                sx={{
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  overflowWrap: "anywhere",
                  fontSize: "0.95rem",
                }}
              >
                {renderCaptionWithHashtags(post.caption || "")}
              </Box>

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

                {commentTree.map((c) => renderCommentItem(c, 0))}

                {/* 댓글 입력 */}
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ mt: 2, alignItems: "center" }}
                >
                  <Box sx={{ position: "relative", flexGrow: 1 }}>
                    <TextField
                      size="small"
                      placeholder={
                        replyTarget
                          ? `${replyTarget.nickname}님에게 답글 달기...`
                          : "댓글 달기..."
                      }
                      value={commentInput}
                      onChange={handleChangeCommentInput}
                      fullWidth
                      multiline
                      maxRows={4}
                    />

                    {/* 멘션 후보 드롭다운 */}
                    {mentionOpen && mentionCandidates.length > 0 && (
                      <Paper
                        elevation={3}
                        sx={{
                          position: "absolute",
                          left: 0,
                          right: 0,
                          top: "100%",
                          mt: 0.5,
                          zIndex: 20,
                          maxHeight: 200,
                          overflowY: "auto",
                        }}
                      >
                        {mentionCandidates.map((u) => {
                          const displayName = u.nickname || u.username || `user#${u.id}`;
                          return (
                            <Box
                              key={u.id}
                              sx={{
                                px: 1.5,
                                py: 1,
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                cursor: "pointer",
                                "&:hover": {
                                  backgroundColor: "action.hover",
                                },
                              }}
                              onClick={() => handleSelectMention(u)}
                            >
                              <Avatar
                                sx={{ width: 28, height: 28 }}
                                src={u.avatarUrl ? u.avatarUrl : undefined}
                              >
                                {displayName[0]}
                              </Avatar>
                              <Box>
                                <Typography variant="body2">{displayName}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  @{u.username}
                                </Typography>
                              </Box>
                            </Box>
                          );
                        })}
                      </Paper>
                    )}
                  </Box>

                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleSubmitComment}
                    disabled={!commentInput.trim() || commentSubmitting}
                  >
                    등록
                  </Button>
                </Stack>

                {replyTarget && (
                  <Box sx={{ mt: 0.5 }}>
                    <Button
                      size="small"
                      variant="text"
                      onClick={() => setReplyTarget(null)}
                      sx={{ textTransform: "none", fontSize: "0.75rem", px: 0 }}
                    >
                      답글 취소
                    </Button>
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>

        <Snackbar
          open={achievementToastOpen}
          autoHideDuration={4000}
          onClose={() => setAchievementToastOpen(false)}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={() => setAchievementToastOpen(false)}
            severity="success"
            sx={{ width: "100%" }}
          >
            {achievementToastMessage || "새 업적을 달성했습니다!"}
          </Alert>
        </Snackbar>
      </Dialog>

      <EditPostDialog
        open={editOpen}
        post={post}
        gameList={gameList}
        onClose={handleCloseEdit}
        onSaved={handleEditSaved}
      />
    </>
  );
}

export default PostDetailDialog;
