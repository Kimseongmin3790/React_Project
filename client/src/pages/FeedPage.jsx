// src/pages/FeedPage.jsx
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
  MenuItem,
  Button,
  List,
  ListItemButton,
  ListItemText,
} from "@mui/material";

import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import ShareIcon from "@mui/icons-material/Share";

import { useAuth } from "../context/AuthContext";
import { buildFileUrl } from "../utils/url";
import { followUser, unfollowUser, getUserRelation } from "../api/followApi";
import { io } from "socket.io-client";
import {
  getNotificationSummary,
  markAllNotificationsRead,
} from "../api/notificationApi";
import { useNavigate, useLocation } from "react-router-dom";
import {
  fetchFeed,
  fetchGameList,
  likePost,
  unlikePost,
  bookmarkPost,
  unbookmarkPost,
  createComment,
} from "../api/postApi";
import PostDetailDialog from "../components/post/postDetail";
import MainHeader from "../components/layout/MainHeader"; // 공통 헤더

const API_ORIGIN = "http://localhost:3020";

function getMediaUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API_ORIGIN}${url}`;
}

// 알림 payload를 정규화
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

function FeedPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [gameList, setGameList] = useState([]);
  const [selectedGameId, setSelectedGameId] = useState("");

  const [selectedMenu, setSelectedMenu] = useState("main");

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailPostId, setDetailPostId] = useState(null);

  const [commentInputs, setCommentInputs] = useState({});

  // 🔔 알림 요약 + 리스트
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [notifications, setNotifications] = useState([]);

  // 팔로우 관계
  const [relations, setRelations] = useState({});
  const [relationLoading, setRelationLoading] = useState({});

  // 검색창(지금은 UI용)
  const [searchText, setSearchText] = useState("");

  const fetchRelation = useCallback(async (targetUserId) => {
    try {
      setRelationLoading((prev) => ({ ...prev, [targetUserId]: true }));
      const rel = await getUserRelation(targetUserId); // { isMe, isFollowing, isFollower }

      setRelations((prev) => ({
        ...prev,
        [targetUserId]: rel,
      }));
    } catch (err) {
      console.error("관계 조회 실패:", err);
      setRelations((prev) => ({
        ...prev,
        [targetUserId]: { isMe: false, isFollowing: false, isFollower: false },
      }));
    } finally {
      setRelationLoading((prev) => {
        const next = { ...prev };
        delete next[targetUserId];
        return next;
      });
    }
  }, []);

  // 팔로우 / 언팔 토글
  const handleToggleFollow = async (targetUserId) => {
    if (!user || targetUserId === user.id) return;

    const current = relations[targetUserId] || {};
    const prevIsFollowing = !!current.isFollowing;

    // 낙관적 업데이트
    setRelations((prev) => ({
      ...prev,
      [targetUserId]: { ...current, isFollowing: !prevIsFollowing },
    }));

    try {
      if (prevIsFollowing) {
        await unfollowUser(targetUserId);
      } else {
        await followUser(targetUserId);
      }
    } catch (err) {
      console.error("팔로우 토글 실패:", err);
      setRelations((prev) => ({
        ...prev,
        [targetUserId]: current,
      }));
      alert("팔로우 상태 변경 중 오류가 발생했습니다.");
    }
  };

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
    } else if (key === "ranking") {
      navigate("/ranking");
    }
  };

  // 랭킹 페이지에서 게임 선택 후 돌아왔을 때 필터 유지
  useEffect(() => {
    if (location.state && location.state.initialGameId) {
      setSelectedGameId(String(location.state.initialGameId));
    }
  }, [location.state]);

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

  // 🔔 알림 요약 + 소켓 연결
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

      // 소켓 연결
      socket = io("http://localhost:3020", {
        auth: {
          token: localStorage.getItem("token"),
        },
      });

      socket.on("connect_error", (err) => {
        console.error("notify socket connect_error:", err.message);
      });

      // 새 알림 수신
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

  // 피드에 보이는 유저들에 대해 팔로우 관계 조회
  useEffect(() => {
    if (!user || posts.length === 0) return;

    const uniqueAuthorIds = Array.from(
      new Set(
        posts
          .map((p) => p.userId)
          .filter((id) => id && id !== user.id)
      )
    );

    uniqueAuthorIds.forEach((uid) => {
      if (!relations[uid] && !relationLoading[uid]) {
        fetchRelation(uid);
      }
    });
  }, [user, posts, relations, relationLoading, fetchRelation]);

  // 좋아요 토글
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

  // 북마크 토글
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
      await createComment(postId, text);
      setCommentInputs((prev) => ({
        ...prev,
        [postId]: "",
      }));
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

  // 🔔 헤더에서 알림 메뉴가 열릴 때(아이콘 클릭 시) 호출 → 모두 읽음 처리
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

  // 🔔 개별 알림 클릭 시 동작
  const handleNotificationClick = (n) => {
    if (n.type === "CHAT_MESSAGE") {
      navigate("/chat");
    } else if (
      n.type === "FOLLOWED_USER_POST" ||
      n.type === "FOLLOWED_POST"
    ) {
      // 나중에 /posts/:id 로 바로 이동하게 바꿔도 됨
      navigate("/");
    } else {
      console.log("unknown notification type:", n);
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
        {/* ✅ 공통 상단 헤더 */}
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

        {/* 게임 필터 바 */}
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

            const isMe = post.userId === user?.id;
            const relation = relations[post.userId];
            const isFollowing = relation?.isFollowing;
            const isRelationLoading = !!relationLoading[post.userId];

            return (
              <Card key={post.id}>
                {/* 1) 썸네일 위: 프로필 / 이름 / 팔로우 / 날짜 */}
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

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {!isMe && (
                      <Button
                        size="small"
                        variant={isFollowing ? "outlined" : "contained"}
                        color={isFollowing ? "inherit" : "primary"}
                        disabled={isRelationLoading}
                        onClick={() => handleToggleFollow(post.userId)}
                        sx={{
                          textTransform: "none",
                          minWidth: 72,
                          fontSize: "0.75rem",
                          py: 0.3,
                        }}
                      >
                        {isRelationLoading
                          ? "..."
                          : isFollowing
                          ? "팔로잉"
                          : "팔로우"}
                      </Button>
                    )}
                    <Typography variant="caption">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
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
