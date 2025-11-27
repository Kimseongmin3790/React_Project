// client/src/pages/SearchResultsPage.jsx
import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Tabs,
  Tab,
  Typography,
  Card,
  CardContent,
  Avatar,
  CardMedia,
  Button,
  Divider,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { searchAll } from "../api/searchApi";
import MainHeader from "../components/layout/MainHeader";
import SideNav from "../components/layout/SideNav";
import { useAuth } from "../context/AuthContext";
import { buildFileUrl } from "../utils/url";
import {
  markAllNotificationsRead,
  getNotificationSummary,
} from "../api/notificationApi";
import { io } from "socket.io-client";

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

function SearchResultsPage() {
  const theme = useTheme();
  const { user, logout } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("query") || "";

  const [tab, setTab] = useState("all");
  const [data, setData] = useState({
    users: [],
    posts: [],
    tags: [],
    games: [],
  });
  const [loading, setLoading] = useState(false);

  // 🔔 알림
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [notifications, setNotifications] = useState([]);

  // 헤더 검색창 텍스트
  const [searchText, setSearchText] = useState(query);

  // 사이드바 선택
  const [selectedMenu, setSelectedMenu] = useState(null);

  // 🔔 알림 소켓 + 요약
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

  // query 변경될 때 검색 + 헤더 검색칸 동기화
  useEffect(() => {
    setSearchText(query);
    if (!query.trim()) return;

    (async () => {
      try {
        setLoading(true);
        const result = await searchAll(query);
        setData(result);
      } catch (err) {
        console.error("검색 실패:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [query]);

  const handleChangeTab = (e, value) => setTab(value);

  const handleSubmitSearch = (value) => {
    const q = (value ?? "").trim();
    if (!q) return;
    navigate(`/search?query=${encodeURIComponent(q)}`);
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

  // ───────── 사이드바 메뉴 클릭 ─────────
  const handleMenuClick = (key) => {
    setSelectedMenu(key);

    if (key === "main") navigate("/");
    else if (key === "ranking") navigate("/ranking");
    else if (key === "chat") navigate("/chat");
    else if (key === "write") navigate("/create");
    else if (key === "profile") navigate("/me");
    else if (key === "more") {
      // 더보기 눌렀을 때 동작이 있으면 추가
    } else if (key === "logout") {
      logout();
      window.location.href = "/login";
    }
  };

  // ───────── 탭별 렌더링 헬퍼 ─────────
  const renderUsers = () => {
    if (!data.users.length) {
      return <Typography>검색된 유저가 없습니다.</Typography>;
    }
    return data.users.map((u) => (
      <Card
        key={u.id}
        sx={{ mb: 1, cursor: "pointer" }}
        onClick={() => navigate(`/users/${u.id}`)}
      >
        <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar src={buildFileUrl(u.avatarUrl) || ""}>
            {u.nickname?.[0] || u.username?.[0] || "U"}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
              {u.nickname || u.username}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              @{u.username}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    ));
  };

  const renderPosts = () => {
    if (!data.posts.length) {
        return <Typography>검색된 피드가 없습니다.</Typography>;
    }

    return (
        <Box
        sx={{
            display: "grid",
            gridTemplateColumns: {
            xs: "repeat(3, 1fr)",
            },
            gap: 0.5,
        }}
        >
        {data.posts.map((p) => (
            <Box
            key={p.id}
            sx={{
                position: "relative",
                width: "100%",
                aspectRatio: "1 / 1",
                overflow: "hidden",
                cursor: "pointer",
                bgcolor:
                theme.palette.mode === "light"
                    ? "#ddd"
                    : theme.palette.grey[800],
            }}
            onClick={() => navigate(`/posts/${p.id}`)}
            >
            {p.thumbnailUrl && (
                <Box
                component={p.thumbType === "VIDEO" ? "video" : "img"}
                src={getMediaUrl(p.thumbnailUrl)}
                controls={p.thumbType === "VIDEO"}
                sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                }}
                />
            )}
            </Box>
        ))}
        </Box>
    );
  };

  const renderTags = () => {
    if (!data.tags.length) {
      return <Typography>검색된 태그가 없습니다.</Typography>;
    }
    return data.tags.map((t) => (
      <Button
        key={t.id}
        size="small"
        sx={{
          textTransform: "none",
          justifyContent: "flex-start",
          mb: 0.5,
        }}
        onClick={() => navigate(`/tags/${encodeURIComponent(t.name)}`)}
      >
        #{t.name}
      </Button>
    ));
  };

  const renderGames = () => {
    if (!data.games.length) {
      return <Typography>검색된 게임이 없습니다.</Typography>;
    }
    return data.games.map((g) => (
      <Button
        key={g.id}
        size="small"
        sx={{
          textTransform: "none",
          justifyContent: "flex-start",
          mb: 0.5,
        }}
        onClick={() => {
          // 게임별 피드 필터 페이지로 이동 (필요하다면 서버 필터랑 연결)
          navigate(`/?game=${encodeURIComponent(g.name)}`);
        }}
      >
        {g.name}
      </Button>
    ));
  };

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: theme.palette.background.default, // ✅ 다크모드 대응
      }}
    >
      {/* 사이드바 */}
      <SideNav selectedMenu={selectedMenu} onMenuClick={handleMenuClick} />

      {/* 오른쪽 메인 영역 */}
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        {/* 공통 상단 헤더 */}
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
          onSearchSubmit={handleSubmitSearch}
        />

        {/* 콘텐츠 영역 */}
        <Container maxWidth="md" sx={{ py: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
            "{query}" 검색 결과
          </Typography>

          <Tabs value={tab} onChange={handleChangeTab} sx={{ mb: 2 }}>
            <Tab label="통합" value="all" />
            <Tab label="유저" value="user" />
            <Tab label="피드" value="post" />
            <Tab label="태그" value="tag" />
            <Tab label="게임" value="game" />
          </Tabs>

          {loading && <Typography>검색 중...</Typography>}

          {!loading && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {tab === "all" && (
                <>
                  <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                    유저
                  </Typography>
                  {renderUsers()}
                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                    피드
                  </Typography>
                  {renderPosts()}
                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                    태그
                  </Typography>
                  {renderTags()}
                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                    게임
                  </Typography>
                  {renderGames()}
                </>
              )}

              {tab === "user" && renderUsers()}
              {tab === "post" && renderPosts()}
              {tab === "tag" && renderTags()}
              {tab === "game" && renderGames()}
            </Box>
          )}
        </Container>
      </Box>
    </Box>
  );
}

export default SearchResultsPage;
