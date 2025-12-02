import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Grid,
  CircularProgress,
  useTheme,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import MainHeader from "../components/layout/MainHeader";
import SideNav from "../components/layout/SideNav";
import { fetchAchievements } from "../api/achievementApi";
import { markAllNotificationsRead, getNotificationSummary } from "../api/notificationApi";
import { io } from "socket.io-client";

const API_ORIGIN = "http://localhost:3020";

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

function AchievementsPage() {
  const { user } = useAuth();
  const theme = useTheme();
  const navigate = useNavigate();

  // 사이드바에서 "더보기"를 선택된 상태로
  const [selectedMenu, setSelectedMenu] = useState("more");

  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [unreadTotal, setUnreadTotal] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [searchText, setSearchText] = useState("");

  // 업적 목록 로딩
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const list = await fetchAchievements();
        if (!cancelled) {
          setAchievements(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        console.error("fetchAchievements error:", err);
        console.error("SERVER RESPONSE:", err.response?.data);
        if (!cancelled) {
          setError("업적 목록을 불러오는 중 오류가 발생했습니다.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

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

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  const handleMenuClick = (key) => {
    setSelectedMenu(key);

    if (key === "main") {
      navigate("/");
    } else if (key === "explore") {
      navigate("/explore");
    } else if (key === "ranking") {
      navigate("/ranking");
    } else if (key === "chat") {
      navigate("/chat");
    } else if (key === "write") {
      navigate("/");
    } else if (key === "profile") {
      navigate("/me");
    } else if (key === "more") {
    }
  };

  if (!user) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography>로그인이 필요합니다.</Typography>
      </Container>
    );
  }

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
      if (n.roomId) {
        navigate("/chat", { state: { openRoomId: n.roomId } });
      } else {
        navigate("/chat");
      }
      return;
    }
    if (
      n.type === "FOLLOWED_USER_POST" ||
      n.type === "FOLLOWED_POST" || 
      n.type === "COMMENT_MENTION"
    ) {
      if (n.postId) {
        navigate("/", { state: { openPostId: n.postId } });
      } else {
        navigate("/");
      }
      return;
    }

    console.log("unknown notification type:", n);
  };

  const handleSubmitSearch = (value) => {
    const q = (value ?? "").trim();
    if (!q) return;
    navigate(`/search?query=${encodeURIComponent(q)}`);
  };

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: theme.palette.background.default,
      }}
    >
      {/* 왼쪽 사이드바 */}
      <SideNav selectedMenu={selectedMenu} onMenuClick={handleMenuClick} />

      {/* 오른쪽 메인 영역 */}
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
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

        <Container maxWidth="md" sx={{ py: 3, flexGrow: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: "bold", mb: 1 }}>
            모든 업적
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "text.secondary", mb: 3 }}
          >
            해금한 업적 {unlockedCount}개 / 전체 {achievements.length}개
          </Typography>

          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Typography color="error" variant="body2" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}

          {!loading && achievements.length === 0 && !error && (
            <Typography>등록된 업적이 없습니다.</Typography>
          )}

          <Grid container spacing={2}>
            {achievements.map((ach) => {
              const unlocked = ach.unlocked;
              const achievedAtText = ach.achievedAt
                ? new Date(ach.achievedAt).toLocaleString()
                : null;

              const iconSrc = ach.iconUrl
                ? ach.iconUrl
                : null;

              return (
                <Grid item xs={12} sm={6} md={4} key={ach.id}>
                  <Card
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      opacity: unlocked ? 1 : 0.6,
                    }}
                  >
                    {/* 아이콘 */}
                    {iconSrc && (
                      <CardMedia
                        component="img"
                        image={iconSrc}
                        alt={ach.name}
                        sx={{
                          height: 120,
                          objectFit: "contain",
                          p: 1,
                        }}
                      />
                    )}

                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          mb: 1,
                        }}
                      >
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: "bold" }}
                        >
                          {ach.name}
                        </Typography>
                        <Chip
                          size="small"
                          label={unlocked ? "달성 완료" : "잠김"}
                          color={unlocked ? "primary" : "default"}
                        />
                      </Box>

                      {ach.description && (
                        <Typography
                          variant="body2"
                          sx={{ mb: 1, whiteSpace: "pre-line" }}
                        >
                          {ach.description}
                        </Typography>
                      )}

                      {achievedAtText && (
                        <Typography
                          variant="caption"
                          sx={{ color: "text.secondary", display: "block" }}
                        >
                          달성일: {achievedAtText}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}

export default AchievementsPage;
