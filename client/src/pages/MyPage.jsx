// src/pages/MyPage.jsx
import React, { useEffect, useState, useCallback } from "react";
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
  Button,
  List,
  ListItemButton,
  ListItemText,
  Tabs,
  Tab,
} from "@mui/material";

import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import ShareIcon from "@mui/icons-material/Share";

import { io } from "socket.io-client";
import {
  getNotificationSummary,
  markAllNotificationsRead,
} from "../api/notificationApi";
import { useAuth } from "../context/AuthContext";
import { buildFileUrl } from "../utils/url";
import { getFollowStats } from "../api/followApi";
import { useNavigate } from "react-router-dom";
import {
  likePost,
  unlikePost,
  bookmarkPost,
  unbookmarkPost,
  createComment,
} from "../api/postApi";
import {
  fetchMyPosts,
  fetchMyLikedPosts,
  fetchMyBookmarkedPosts,
} from "../api/userApi";
import PostDetailDialog from "../components/post/postDetail";
import MainHeader from "../components/layout/MainHeader"; // 🔥 공통 헤더

const API_ORIGIN = "http://localhost:3020";

function getMediaUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API_ORIGIN}${url}`;
}

function normalizeNotification(raw) {
  if (!raw) return null;

  const {
    id,
    type,
    actorId,
    actor_id,
    postId,
    post_id,
    roomId,
    room_id,
    message,
    createdAt,
    created_at,
  } = raw;

  return {
    id: id ?? null,
    type,
    actorId: actorId ?? actor_id ?? null,
    postId: postId ?? post_id ?? null,
    roomId: roomId ?? room_id ?? null,
    message: message || "",
    createdAt: createdAt || created_at || null,
  };
}

function MyPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // 왼쪽 메뉴 선택
  const [selectedMenu, setSelectedMenu] = useState("profile");

  // 탭: 작성한 글 / 좋아요 / 북마크
  const [tab, setTab] = useState("posts"); // posts | likes | bookmarks

  const [myPosts, setMyPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [bookmarkedPosts, setBookmarkedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailPostId, setDetailPostId] = useState(null);

  const [commentInputs, setCommentInputs] = useState({});

  const [followStats, setFollowStats] = useState({
    followerCount: 0,
    followingCount: 0,
  });

  // 🔔 알림
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [notifications, setNotifications] = useState([]);

  // 검색창 (지금은 사용 X, UI만)
  const [searchText, setSearchText] = useState("");

  // ───────── 공통 /me 데이터 로딩 ─────────
  const loadMyData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");

    try {
      const [posts, likes, bookmarks, follow] = await Promise.all([
        fetchMyPosts(),
        fetchMyLikedPosts(),
        fetchMyBookmarkedPosts(),
        getFollowStats(),
      ]);

      setMyPosts(posts || []);
      setLikedPosts(likes || []);
      setBookmarkedPosts(bookmarks || []);
      setFollowStats(follow);
    } catch (err) {
      console.error("/me 데이터 로딩 실패:", err);
      setError("내 피드를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 🔔 알림 요약 + 소켓
  useEffect(() => {
    if (!user) return;

    let socket;

    (async () => {
      try {
        const summary = await getNotificationSummary();
        setUnreadTotal(summary.unreadTotal || 0);

        if (summary.lastNotification) {
          const n = normalizeNotification(summary.lastNotification);
          if (n) {
            setNotifications((prev) => {
              const exists = prev.some((item) =>
                item.id && n.id
                  ? item.id === n.id
                  : item.type === n.type &&
                    item.postId === n.postId &&
                    item.roomId === n.roomId &&
                    item.createdAt === n.createdAt
              );
              if (exists) return prev;
              return [n, ...prev].slice(0, 20);
            });
          }
        }
      } catch (err) {
        console.error("알림 요약 불러오기 실패:", err);
      }

      socket = io(API_ORIGIN, {
        auth: {
          token: localStorage.getItem("token"),
        },
      });

      socket.on("connect_error", (err) => {
        console.error("notify socket connect_error:", err.message);
      });

      socket.on("notify:new", (payload) => {
        const n = normalizeNotification(payload);
        if (!n) return;

        setUnreadTotal((prev) => prev + 1);
        setNotifications((prev) => [n, ...prev].slice(0, 20));
      });
    })();

    return () => {
      if (socket) socket.disconnect();
    };
  }, [user]);

  useEffect(() => {
    loadMyData();
  }, [loadMyData]);

  const handleMenuClick = (key) => {
    setSelectedMenu(key);

    if (key === "main") {
      navigate("/");
    } else if (key === "write") {
      navigate("/create");
    } else if (key === "profile") {
      navigate("/me");
    } else if (key === "chat") {
      navigate("/chat");
    } else if (key === "logout") {
      logout();
      window.location.href = "/login";
    } else if (key === "ranking") {
      navigate("/ranking");
    }
  };

  const handleTabChange = (e, value) => {
    setTab(value);
  };

  const openDetail = (postId) => {
    setDetailPostId(postId);
    setDetailOpen(true);
  };
  const closeDetail = () => {
    setDetailOpen(false);
    setDetailPostId(null);
  };

  const currentPosts =
    tab === "posts" ? myPosts : tab === "likes" ? likedPosts : bookmarkedPosts;

  // 좋아요 토글 → API 호출 후 내 데이터 다시 로딩
  const handleToggleLike = async (postId, currentIsLiked) => {
    try {
      if (currentIsLiked) {
        await unlikePost(postId);
      } else {
        await likePost(postId);
      }
      await loadMyData();
    } catch (err) {
      console.error("좋아요 토글 실패:", err);
    }
  };

  // 북마크 토글 → API 호출 후 내 데이터 다시 로딩
  const handleToggleBookmark = async (postId, currentIsBookmarked) => {
    try {
      if (currentIsBookmarked) {
        await unbookmarkPost(postId);
      } else {
        await bookmarkPost(postId);
      }
      await loadMyData();
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
      await createComment(postId, text);
      setCommentInputs((prev) => ({
        ...prev,
        [postId]: "",
      }));
      await loadMyData();
    } catch (err) {
      console.error("댓글 작성 실패:", err);
      alert("댓글 작성 중 오류가 발생했습니다.");
    }
  };

  // 🔔 헤더에서 알림 버튼 눌러 메뉴 열릴 때 호출 → 모두 읽음 처리
  const handleNotificationsOpened = async () => {
    if (unreadTotal > 0) {
      try {
        await markAllNotificationsRead();
        setUnreadTotal(0);
      } catch (err) {
        console.error("알림 읽음 처리 실패:", err);
      }
    }
  };

  // 🔔 알림 하나 클릭 시 동작
  const handleNotificationClick = (n) => {
    if (n.type === "CHAT_MESSAGE") {
      navigate("/chat");
    } else if (
      n.type === "FOLLOWED_USER_POST" ||
      n.type === "FOLLOWED_POST"
    ) {
      navigate("/");
    } else {
      console.log("unknown notification type:", n);
    }
  };

  if (!user) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography>로그인이 필요합니다.</Typography>
      </Container>
    );
  }

  const myPostCount = myPosts.length;
  const myLikeCount = likedPosts.length;
  const myBookmarkCount = bookmarkedPosts.length;

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
              overflow: "hidden",
            }}
          >
            <Box
              component="img"
              src="/GClipLogo.png"
              alt="GClip 로고"
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
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
        {/* ✅ 공통 상단 헤더 사용 */}
        <MainHeader
          user={user}
          unreadTotal={unreadTotal}
          notifications={notifications}
          onNotificationClick={handleNotificationClick}
          onNotificationsOpened={handleNotificationsOpened}
          onClickLogo={() => navigate("/")}
          onClickProfile={() => navigate("/me")}
          showSearch={true}
          searchPlaceholder="검색창"
          searchValue={searchText}
          onChangeSearch={(e) => setSearchText(e.target.value)}
        />

        {/* 메인 컨테이너 */}
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
          {/* 내 프로필 헤더 */}
          <Card sx={{ mb: 2, p: 2, display: "flex", alignItems: "center" }}>
            <Avatar
              sx={{ width: 64, height: 64, mr: 2 }}
              src={buildFileUrl(user.avatarUrl) || ""}
            >
              {user.nickname?.[0] || user.username?.[0] || "U"}
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                {user.nickname || user.username}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                @{user.username}
              </Typography>
              {user.bio && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {user.bio}
                </Typography>
              )}
              <Box sx={{ display: "flex", gap: 2, mt: 1, flexWrap: "wrap" }}>
                <Typography variant="body2">게시글 {myPostCount}</Typography>
                <Typography variant="body2">좋아요 {myLikeCount}</Typography>
                <Typography variant="body2">
                  북마크 {myBookmarkCount}
                </Typography>
                <Typography variant="body2">
                  팔로워 {followStats.followerCount}
                </Typography>
                <Typography variant="body2">
                  팔로잉 {followStats.followingCount}
                </Typography>
              </Box>
            </Box>
            <Button
              variant="outlined"
              size="small"
              onClick={() => navigate("/me/edit")}
            >
              프로필 수정
            </Button>
          </Card>

          {/* 탭: 작성한 글 / 좋아요 / 북마크 */}
          <Tabs
            value={tab}
            onChange={handleTabChange}
            sx={{ borderBottom: "1px solid #e0e0e0" }}
          >
            <Tab label="작성한 글" value="posts" />
            <Tab label="좋아요한 글" value="likes" />
            <Tab label="북마크" value="bookmarks" />
          </Tabs>

          {loading && <Typography>피드를 불러오는 중...</Typography>}
          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}

          {!loading && currentPosts.length === 0 && !error && (
            <Card>
              <CardContent>
                <Typography variant="body1">
                  {tab === "posts"
                    ? "작성한 게시글이 없습니다."
                    : tab === "likes"
                    ? "좋아요한 게시글이 없습니다."
                    : "북마크한 게시글이 없습니다."}
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* 피드 카드들 */}
          {currentPosts.map((post) => {
            const liked = tab === "likes" ? true : !!post.isLiked;
            const bookmarked = tab === "bookmarks" ? true : !!post.isBookmarked;
            const name = post.nickname || post.username || "U";
            const caption = post.caption || "";
            const captionTooLong = caption.length > 50;

            return (
              <Card key={post.id}>
                {/* 1) 위쪽 영역 */}
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
                      src={buildFileUrl(post.avatarUrl) || ""}
                    >
                      {name[0]}
                    </Avatar>
                    <Box>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: "bold" }}
                      >
                        {name}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary" }}
                      >
                        {post.gameName}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="caption">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>

                {/* 2) 썸네일 */}
                {post.thumbnailUrl && (
                  <CardMedia
                    component={post.thumbType === "VIDEO" ? "video" : "img"}
                    src={getMediaUrl(post.thumbnailUrl)}
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
                      gap: 0.5,
                    }}
                  >
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

                    <IconButton
                      size="small"
                      onClick={() => handleShare(post.id)}
                    >
                      <ShareIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  <Box sx={{ px: 2, pt: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: "bold" }}
                    >
                      좋아요 {post.likeCount ?? 0}개
                    </Typography>
                  </Box>

                  {/* 캡션 */}
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
                      sx={{
                        fontWeight: "bold",
                        mr: 1,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {name}
                    </Typography>

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
                          whiteSpace: "nowrap",
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
                      onChange={(e) =>
                        handleChangeCommentInput(post.id, e.target.value)
                      }
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

          <PostDetailDialog
            open={detailOpen}
            onClose={closeDetail}
            postId={detailPostId}
          />
        </Container>
      </Box>
    </Box>
  );
}

export default MyPage;
