// src/pages/FeedPage.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  Avatar,
  Container,
  Card,
  CardContent,
  CardMedia,
  TextField,
  MenuItem,
  Button,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  Badge,
} from "@mui/material";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import ShareIcon from "@mui/icons-material/Share";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  fetchFeed,
  fetchGameList,
  likePost,
  unlikePost,
  bookmarkPost,
  unbookmarkPost,
  createComment
} from "../api/postApi";
import PostDetailDialog from "../components/post/postDetail";

const API_ORIGIN = "http://localhost:3020";

function getMediaUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API_ORIGIN}${url}`;
}

function FeedPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [gameList, setGameList] = useState([]);
  const [selectedGameId, setSelectedGameId] = useState("");

  const [selectedMenu, setSelectedMenu] = useState("main");

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailPostId, setDetailPostId] = useState(null);

  const [commentInputs, setCommentInputs] = useState({});

  const openDetail = (postId) => {
    setDetailPostId(postId);
    setDetailOpen(true);
  };
  const closeDetail = () => {
    setDetailOpen(false);
    setDetailPostId(null);
  };

  // 왼쪽 메뉴 클릭
  const handleMenuClick = (key) => {
    setSelectedMenu(key);

    if (key === "write") {
      navigate("/create");
    } else if (key === "profile") {
      navigate("/me");
    } else if (key === "chat") {
      navigate("/chat");
    } else if (key === "logout") {
      logout();
      window.location.href = "/login";
    }
    // "최신 글", "인기 글", "게임 순위", "실시간 채팅", "더보기"는
    // 나중에 API/페이지 만들면 여기에서 분기 처리하면 됨.
  };

  // 게임 목록 로딩
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

  // 피드 로딩 (게임 필터 바뀔 때마다)
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

  const handleToggleLike = async (postId, currentIsLiked) => {
    try {
      let res;
      if (currentIsLiked) {
        res = await unlikePost(postId);
      } else {
        res = await likePost(postId);
      }
      const { liked, likeCount } = res;

      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, isLiked: liked ? 1 : 0, likeCount } : p
        )
      );
    } catch (err) {
      console.error("좋아요 토글 실패:", err);
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

      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, isBookmarked: bookmarked ? 1 : 0 }
            : p
        )
      );
    } catch (err) {
      console.error("북마크 토글 실패:", err);
    }
  };

  const handleShare = (postId) => {
      const url = `${window.location.origin}/posts/${postId}`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(
          () => {
            alert("게시글 링크가 클립보드에 복사되었습니다.");
          },
          () => {
            alert("복사에 실패했습니다. 직접 주소창의 주소를 복사해 주세요.");
          }
        );
      } else {
        alert("복사 기능을 지원하지 않는 브라우저입니다.");
      }
    };

  const handleChangeCommentInput = (postId, value) => {
    setCommentInputs((prev) => ({
      ...prev,
      [postId]: value,
    }));
  };

  const handleSubmitComment = async (postId) => {
    const text = (commentInputs[postId] || "").trim();
    if (!text) return;

    try {
      const newComment = await createComment(postId, text);
      // 입력창 비우기
      setCommentInputs((prev) => ({
        ...prev,
        [postId]: "",
      }));
      // 해당 카드의 댓글 개수 +1
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, commentCount: (p.commentCount || 0) + 1 }
            : p
        )
      );
    } catch (err) {
      console.error("피드에서 댓글 작성 실패:", err);
      alert("댓글 작성 중 오류가 발생했습니다.");
    }
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f5f5f5" }}>
      {/* ┌──────────────── 왼쪽 사이드바 ────────────────┐ */}
      <Box
        sx={{
          width: 200,
          bgcolor: "#b0b0b0",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* 상단 로고 영역 */}
        <Box
          sx={{
            p: 2,
            borderBottom: "1px solid rgba(0,0,0,0.1)",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Box
            sx={{
              width: 90,
              height: 90,
              borderRadius: "50%",
              bgcolor: "#e0e0e0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              fontSize: 18,              
            }}
          >
            로고
          </Box>
        </Box>

        {/* 메뉴 리스트 */}
        <List sx={{ flexGrow: 1, p: 0 }}>
          <ListItemButton
            selected={selectedMenu === "main"}
            onClick={() => handleMenuClick("main")}
          >
            <ListItemText primary="메인" />
          </ListItemButton>
          
          <ListItemButton
            selected={selectedMenu === "ranking"}
            onClick={() => handleMenuClick("ranking")}
          >
            <ListItemText primary="인기 TOP 10 게임" />
          </ListItemButton>

          <ListItemButton
            selected={selectedMenu === "chat"}
            onClick={() => handleMenuClick("chat")}
          >
            <ListItemText primary="실시간 채팅" />
          </ListItemButton>

          <ListItemButton
            selected={selectedMenu === "write"}
            onClick={() => handleMenuClick("write")}
          >
            <ListItemText primary="글 쓰기" />
          </ListItemButton>

          <ListItemButton
            selected={selectedMenu === "profile"}
            onClick={() => handleMenuClick("profile")}
          >
            <ListItemText primary="프로필" />
          </ListItemButton>

          <ListItemButton
            selected={selectedMenu === "more"}
            onClick={() => handleMenuClick("more")}
          >
            <ListItemText primary="더보기" />
          </ListItemButton>

          <ListItemButton
            selected={selectedMenu === "logout"}
            onClick={() => handleMenuClick("logout")}
          >
            <ListItemText primary="로그아웃" />
          </ListItemButton>
        </List>
      </Box>

      {/* ┌──────────────── 오른쪽 메인 영역 ────────────────┐ */}
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        {/* 상단 검은바: 검색창 + 알림 + 프로필 아이콘 */}
        <Box
          sx={{
            bgcolor: "#333",
            color: "#fff",
            px: 3,
            py: 1.5,
            display: "flex",
            alignItems: "center",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            GClip
          </Typography>

          {/* 검색창 */}
          <Box sx={{ flexGrow: 1, mx: 3, maxWidth: 500 }}>
            <TextField
              size="small"
              placeholder="검색창"
              fullWidth
              variant="outlined"
              InputProps={{
                sx: {
                  bgcolor: "#f5f5f5",
                  borderRadius: 5,
                },
              }}
            />
          </Box>

          <Box
            sx={{
              ml: "auto",
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <IconButton color="inherit">
              <Badge color="error" variant="dot">
                <NotificationsNoneIcon />
              </Badge>
            </IconButton>

            <IconButton color="inherit" onClick={() => navigate("/me")}>
              <Avatar
                sx={{ width: 32, height: 32 }}
                src={user?.avatarUrl || ""}
              >
                {user?.nickname?.[0] || user?.username?.[0] || "U"}
              </Avatar>
            </IconButton>
          </Box>
        </Box>

        {/* 게임 필터 안내 바 */}
        <Box sx={{ bgcolor: "#e0e0e0", p: 2 }}>
          <Box sx={{ maxWidth: 260 }}>
            <TextField
              select
              size="small"
              label="게임 필터"
              value={selectedGameId}
              onChange={(e) => setSelectedGameId(e.target.value)}
              fullWidth
            >
              <MenuItem value="">전체</MenuItem>
              {gameList.map((g) => (
                <MenuItem key={g.id} value={g.id}>
                  {g.name}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </Box>

        {/* 피드 카드 영역 */}
        <Container
          maxWidth="md"
          sx={{
            flexGrow: 1,
            py: 3,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {loading && <Typography>피드를 불러오는 중...</Typography>}
          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}

          {!loading && posts.length === 0 && !error && (
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
            const bookmarked = !!post.isBookmarked;
            const name = post.nickname || post.username || "U";
            const caption = post.caption || "";
            const captionTooLong = caption.length > 50;
            return (
              <Card key={post.id}>
                {/* 1) 썸네일 위: 프로필 / 이름 / 날짜 */}
                <Box
                  sx={{
                    px: 2,
                    pt: 1.5,
                    pb: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    bgcolor: "#eeeeee",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Avatar
                      sx={{ width: 28, height: 28 }}
                      src={post.avatarUrl || ""}
                    >
                      {name[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                        {name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        {post.gameName}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="caption">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>

                {/* 2) 썸네일 (이미지/영상) */}
                {post.thumbUrl && (
                  <CardMedia
                    component={post.thumbType === "VIDEO" ? "video" : "img"}
                    src={getMediaUrl(post.thumbUrl)}
                    controls={post.thumbType === "VIDEO"}
                    sx={{ maxHeight: 400 }}
                  />
                )}
                
                <CardContent sx={{ p: 0 }}>
                  {/* 좋아요 / 북마크 / 공유 */}
                  <Box
                    sx={{
                      px: 1,
                      py: 0.5,
                      bgcolor: "#f0f0f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      gap: 0.5
                    }}
                  >
                    {/* 좋아요 */}
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

                    {/* 북마크 */}
                    <IconButton
                      size="small"
                      onClick={() => handleToggleBookmark(post.id, bookmarked)}
                    >
                      {bookmarked ? (
                        <BookmarkIcon fontSize="small" />
                      ) : (
                        <BookmarkBorderIcon fontSize="small" />
                      )}
                    </IconButton>

                    {/* 공유 */}
                    <IconButton size="small" onClick={() => handleShare(post.id)}>
                      <ShareIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  <Box sx={{ px: 2, pt: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                      좋아요 {post.likeCount ?? 0}개
                    </Typography>
                  </Box>

                  {/* 캡션: [작성자 이름] [한 줄 캡션 …] + 더보기 */}
                  <Box
                    sx={{
                      px: 2,
                      pt: 0.5,
                      pb: 0.5,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: "bold", mr: 1, whiteSpace: "nowrap" }}
                    >
                      {name}
                    </Typography>

                    {/* 캡션 텍스트 (1줄, … 처리) */}
                    <Box sx={{ flexGrow: 1, overflow: "hidden" }}>
                      <Typography
                        variant="body2"
                        sx={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          wordBreak: "break-all",
                        }}
                      >
                        {caption}
                      </Typography>
                    </Box>

                    {/* 캡션 길면 더보기 버튼 → 상세 모달 */}
                    {captionTooLong && (
                      <Button
                        size="small"
                        onClick={() => openDetail(post.id)}
                        sx={{
                          textTransform: "none",
                          ml: 1,
                          p: 0,
                          minWidth: "auto",
                          fontSize: "0.8rem",
                          whiteSpace: "nowrap"
                        }}
                      >
                        더보기
                      </Button>
                    )}
                  </Box>

                  {/* 댓글 모두 보기 */}
                  <Box
                    sx={{
                      px: 2,                      
                      pb: 0.5,                    
                    }}
                  >
                    <Button
                      size="small"
                      onClick={() => openDetail(post.id)}
                      sx={{ textTransform: "none", p: 0, minWidth: 0 }}
                    >
                      댓글 {post.commentCount ?? 0}개 모두보기
                    </Button>
                  </Box>

                  {/* 댓글 입력창 */}
                  <Box
                    sx={{
                      px: 2,                      
                      pt: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      borderTop: "1px solid #e0e0e0",
                    }}
                  >
                    <TextField
                      size="small"
                      placeholder="댓글 달기..."
                      value={commentInputs[post.id] || ""}
                      onChange={(e) => handleChangeCommentInput(post.id, e.target.value)}
                      fullWidth
                    />
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleSubmitComment(post.id)}
                      disabled={!(commentInputs[post.id] || "").trim()}
                      sx={{ whiteSpace: "nowrap" }}
                    >
                      등록
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Container>

        {/* 상세 모달 */}
        <PostDetailDialog
          open={detailOpen}
          onClose={closeDetail}
          postId={detailPostId}
        />
      </Box>
    </Box>
  );
}

export default FeedPage;
