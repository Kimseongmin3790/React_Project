import React, { useEffect, useState } from "react";
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Container,
  Avatar,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardMedia,
  CircularProgress,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  fetchMyPosts,
  fetchMyBookmarkedPosts,
  likePost,
  unlikePost,
  bookmarkPost,
  unbookmarkPost,
} from "../api/postApi";
import PostDetailDialog from "../components/post/postDetail";

const API_ORIGIN = "http://localhost:3020";

function getMediaUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API_ORIGIN}${url}`;
}

function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tab, setTab] = useState(0); // 0: 내 글, 1: 북마크
  const [myPosts, setMyPosts] = useState([]);
  const [myPostsLoading, setMyPostsLoading] = useState(true);

  const [bookmarkPosts, setBookmarkPosts] = useState([]);
  const [bookmarkLoading, setBookmarkLoading] = useState(true);

  const [error, setError] = useState("");

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailPostId, setDetailPostId] = useState(null);

  const openDetail = (postId) => {
    setDetailPostId(postId);
    setDetailOpen(true);
  };
  const closeDetail = () => {
    setDetailOpen(false);
    setDetailPostId(null);
  };

  const loadMyPosts = async () => {
    try {
      setMyPostsLoading(true);
      setError("");
      const res = await fetchMyPosts({ page: 1, limit: 20 });
      setMyPosts(res.posts || []);
    } catch (err) {
      console.error("내 게시글 불러오기 실패:", err);
      setError("내 게시글을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setMyPostsLoading(false);
    }
  };

  const loadBookmarks = async () => {
    try {
      setBookmarkLoading(true);
      setError("");
      const res = await fetchMyBookmarkedPosts({ page: 1, limit: 20 });
      setBookmarkPosts(res.posts || []);
    } catch (err) {
      console.error("북마크 불러오기 실패:", err);
      setError("북마크를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setBookmarkLoading(false);
    }
  };

  useEffect(() => {
    // 최초에 내 글 로딩
    loadMyPosts();
  }, []);

  useEffect(() => {
    if (tab === 0) {
      loadMyPosts();
    } else {
      loadBookmarks();
    }
  }, [tab]);

  const handleToggleLike = async (postId, currentIsLiked, fromBookmarks = false) => {
    try {
      let res;
      if (currentIsLiked) {
        res = await unlikePost(postId);
      } else {
        res = await likePost(postId);
      }
      const { liked, likeCount } = res;

      const update = (list) =>
        list.map((p) =>
          p.id === postId ? { ...p, isLiked: liked ? 1 : 0, likeCount } : p
        );

      setMyPosts((prev) => update(prev));
      setBookmarkPosts((prev) => update(prev));
    } catch (err) {
      console.error("프로필 좋아요 토글 실패:", err);
    }
  };

  const handleToggleBookmark = async (postId, currentIsBookmarked) => {
    try {
      let res;
      if (currentIsBookmarked) {
        res = await unbookmarkPost(postId);
      } else {
        res = await bookmarkPost(postId);
      }
      const { bookmarked } = res;

      const update = (list, removeIfUnbookmark = false) =>
        list
          .map((p) =>
            p.id === postId ? { ...p, isBookmarked: bookmarked ? 1 : 0 } : p
          )
          .filter((p) => (removeIfUnbookmark ? p.isBookmarked : true));

      // 내 글 목록에서는 상태만 바꿈
      setMyPosts((prev) => update(prev, false));
      // 북마크 탭에서는 해제 시 목록에서 제거
      setBookmarkPosts((prev) => update(prev, true));
    } catch (err) {
      console.error("프로필 북마크 토글 실패:", err);
    }
  };

  const currentList = tab === 0 ? myPosts : bookmarkPosts;
  const currentLoading = tab === 0 ? myPostsLoading : bookmarkLoading;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#fafafa" }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <IconButton edge="start" onClick={() => navigate(-1)}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ ml: 1, fontWeight: "bold" }}>
            내 프로필
          </Typography>
        </Toolbar>
      </AppBar>

      <Container
        maxWidth="sm"
        sx={{
          mt: 3,
          pb: 4,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {/* 프로필 헤더 */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar
            sx={{ width: 56, height: 56 }}
            src={user?.avatarUrl || ""}
          >
            {user?.nickname?.[0] || user?.username?.[0] || "U"}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
              {user?.nickname || user?.username}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              @{user?.username}
            </Typography>
          </Box>
        </Box>

        {/* 탭 */}
        <Tabs
          value={tab}
          onChange={(e, v) => setTab(v)}
          variant="fullWidth"
          sx={{ mt: 2 }}
        >
          <Tab label="내 게시글" />
          <Tab label="북마크" />
        </Tabs>

        {error && (
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        )}

        {currentLoading && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {!currentLoading && currentList.length === 0 && (
          <Card>
            <CardContent>
              <Typography variant="body2">
                {tab === 0
                  ? "아직 작성한 게시글이 없습니다."
                  : "북마크한 게시글이 없습니다."}
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* 게시글 카드들 */}
        {currentList.map((post) => {
          const liked = !!post.isLiked;
          const bookmarked = !!post.isBookmarked;

          return (
            <Card key={post.id}>
              {post.thumbUrl && (
                <CardMedia
                  component={post.thumbType === "VIDEO" ? "video" : "img"}
                  src={getMediaUrl(post.thumbUrl)}
                  controls={post.thumbType === "VIDEO"}
                  sx={{ maxHeight: 300 }}
                />
              )}
              <CardContent>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: "bold", mb: 0.5 }}
                >
                  {post.gameName}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    display: "-webkit-box",
                    overflow: "hidden",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {post.caption}
                </Typography>

                <Box
                  sx={{
                    mt: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <IconButton
                        size="small"
                        onClick={() =>
                          handleToggleLike(post.id, liked, tab === 1)
                        }
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

                    <IconButton
                      size="small"
                      onClick={() =>
                        handleToggleBookmark(post.id, bookmarked)
                      }
                    >
                      {bookmarked ? (
                        <BookmarkIcon fontSize="small" />
                      ) : (
                        <BookmarkBorderIcon fontSize="small" />
                      )}
                    </IconButton>
                  </Box>

                  <Typography
                    variant="body2"
                    sx={{
                      cursor: "pointer",
                      color: "primary.main",
                    }}
                    onClick={() => openDetail(post.id)}
                  >
                    자세히
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          );
        })}

        {/* 상세 모달 재사용 */}
        <PostDetailDialog
          open={detailOpen}
          onClose={closeDetail}
          postId={detailPostId}
        />
      </Container>
    </Box>
  );
}

export default ProfilePage;
