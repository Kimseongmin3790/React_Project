import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardMedia,
  CardContent,
  Avatar,
  Button,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";

import { useAuth } from "../context/AuthContext";
import MainHeader from "../components/layout/MainHeader";
import SideNav from "../components/layout/SideNav";
import CreatePostDialog from "../components/post/CreatePostDialog";
import PostDetailDialog from "../components/post/postDetail";

import { fetchTagFeed } from "../api/tagApi";      // /api/tags/:tagName/posts 같은 거
import {
  getNotificationSummary,
  markAllNotificationsRead,
} from "../api/notificationApi";
import { io } from "socket.io-client";
import { buildFileUrl } from "../utils/url";

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

function TagFeedPage() {
  const { tagName } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  const [selectedMenu, setSelectedMenu] = useState("explore"); // 탐색 탭 이름에 맞게
  const [createOpen, setCreateOpen] = useState(false);

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 알림
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [searchText, setSearchText] = useState("");

  // 상세 모달
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailPostId, setDetailPostId] = useState(null);

  // ───────── SideNav ─────────
  const handleMenuClick = (key) => {
    setSelectedMenu(key);

    if (key === "main") navigate("/");
    else if (key === "explore") navigate("/explore");
    else if (key === "ranking") navigate("/ranking");
    else if (key === "chat") navigate("/chat");
    else if (key === "write") setCreateOpen(true);
    else if (key === "profile") navigate("/me");
    else if (key === "logout") {
      logout();
      window.location.href = "/login";
    }
  };

  // ───────── 알림 소켓/요약 ─────────
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
        console.error("알림 요약 실패:", err);
      }

      socket = io("http://localhost:3020", {
        auth: { token: localStorage.getItem("token") },
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

  // ───────── 태그 피드 로딩 ─────────
  useEffect(() => {
    if (!tagName) return;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const list = await fetchTagFeed(tagName); // /api/tags/:tagName/posts
        setPosts(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error("태그 피드 로딩 실패:", err);
        setError("태그 피드를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, [tagName]);

  const openDetail = (postId) => {
    setDetailPostId(postId);
    setDetailOpen(true);
  };

  const closeDetail = () => {
    setDetailPostId(null);
    setDetailOpen(false);
  };

  const handlePostUpdatedFromDetail = (updated) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === updated.id
          ? {
              ...p,
              isLiked: updated.isLiked,
              isBookmarked: updated.isBookmarked,
              likeCount: updated.likeCount,
              commentCount: updated.commentCount,
            }
          : p
      )
    );
  };

  if (!user) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography>로그인이 필요합니다.</Typography>
      </Container>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: theme.palette.background.default,
        color: theme.palette.text.primary,
      }}
    >
      {/* 왼쪽 사이드바 */}
      <SideNav selectedMenu={selectedMenu} onMenuClick={handleMenuClick} />

      {/* 오른쪽 메인 영역 */}
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        {/* 공통 헤더 */}
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
          onSearchSubmit={(value) => {
            const q = (value || "").trim();
            if (q) navigate(`/search?query=${encodeURIComponent(q)}`);
          }}
        />

        <Container
          maxWidth="md"
          sx={{
            py: 3,
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
            #{tagName} 태그 클립
          </Typography>

          {loading && <Typography>불러오는 중...</Typography>}
          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}

          {!loading && !error && posts.length === 0 && (
            <Typography>아직 이 태그로 등록된 클립이 없습니다.</Typography>
          )}

          {/* 유저 프로필 / 검색 결과에서 쓰는 카드 레이아웃 재사용 느낌 */}
          {posts.map((p) => (
            <Card
              key={p.id}
              sx={{
                mb: 2,
                bgcolor: theme.palette.background.paper,
                cursor: "pointer",
              }}
              onClick={() => openDetail(p.id)}
            >
              {p.thumbUrl && (
                <CardMedia
                  component={p.thumbType === "VIDEO" ? "video" : "img"}
                  src={getMediaUrl(p.thumbUrl)}
                  controls={p.thumbType === "VIDEO"}
                  sx={{ maxHeight: 320 }}
                />
              )}
              <CardContent sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                <Avatar src={buildFileUrl(p.avatarUrl) || ""}>
                  {(p.nickname || p.username || "U")[0]}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                    {p.nickname || p.username}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      mt: 0.5,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {p.caption}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ mt: 0.5, display: "block", color: "text.secondary" }}
                  >
                    {p.gameName} · 좋아요 {p.likeCount ?? 0} · 댓글{" "}
                    {p.commentCount ?? 0}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ))}

          {/* 상세 모달 */}
          <PostDetailDialog
            open={detailOpen}
            onClose={closeDetail}
            postId={detailPostId}
            onPostUpdated={handlePostUpdatedFromDetail}
          />

          {/* 글쓰기 모달 */}
          <CreatePostDialog
            open={createOpen}
            onClose={() => setCreateOpen(false)}
          />
        </Container>
      </Box>
    </Box>
  );
}

export default TagFeedPage;
