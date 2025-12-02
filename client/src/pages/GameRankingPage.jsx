// src/pages/GameRankingPage.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  TextField,
  MenuItem,
  Card,
  CardContent,
  LinearProgress,
  Button,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchGameRanking } from "../api/gameApi";
import { io } from "socket.io-client";
import {
  getNotificationSummary,
  markAllNotificationsRead,
} from "../api/notificationApi";
import MainHeader from "../components/layout/MainHeader";
import SideNav from "../components/layout/SideNav";
import CreatePostDialog from "../components/post/CreatePostDialog";
import { useTheme } from "@mui/material/styles";

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

function GameRankingPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  const [selectedMenu, setSelectedMenu] = useState("ranking");
  const [createOpen, setCreateOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [range, setRange] = useState("7"); // "7" | "30" | "all"
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [unreadTotal, setUnreadTotal] = useState(0);
  const [notifications, setNotifications] = useState([]);

  const [searchText, setSearchText] = useState("");

  // 랭킹 불러오기 + score 계산 + 정렬 + TOP 10 자르기
  const loadRanking = async (rangeValue) => {
    try {
      setLoading(true);
      setError("");

      let rangeDays;
      if (rangeValue === "7") rangeDays = 7;
      else if (rangeValue === "30") rangeDays = 30;
      else rangeDays = undefined; // 전체 기간

      // 1) API 호출
      const raw = await fetchGameRanking(rangeDays);

      // 2) 응답 형태 방어 코드 (배열 or { ranking: [...] } or { games: [...] })
      let list = [];
      if (Array.isArray(raw)) {
        list = raw;
      } else if (raw && Array.isArray(raw.ranking)) {
        list = raw.ranking;
      } else if (raw && Array.isArray(raw.games)) {
        list = raw.games;
      } else {
        list = [];
      }

      // 3) 필드 normalize + score 계산
      const withScore = list.map((g) => {
        const postCount = g.postCount ?? g.post_count ?? 0;
        const totalLikes = g.totalLikes ?? g.total_likes ?? 0;
        const totalComments = g.totalComments ?? g.total_comments ?? 0;

        // 서버에서 score / rankScore / hotScore 같은 걸 주면 그거 우선 사용
        const apiScore = g.score ?? g.rankScore ?? g.hotScore ?? null;

        // 없으면 프론트에서 계산 (가중치는 필요에 따라 조절해도 됨)
        const fallbackScore =
          postCount * 1 + totalLikes * 2 + totalComments * 1;

        const score =
          typeof apiScore === "number" ? apiScore : fallbackScore;

        return {
          ...g,
          // 이름 필드 정리
          name: g.name || g.gameName || g.title || "이름 없는 게임",
          postCount,
          totalLikes,
          totalComments,
          score,
        };
      });

      // 4) score 기준 내림차순 정렬
      withScore.sort((a, b) => (b.score || 0) - (a.score || 0));

      // 5) TOP 10만 사용
      setGames(withScore.slice(0, 10));
    } catch (err) {
      console.error("게임 랭킹 로딩 실패:", err);
      setError("인기 게임 랭킹을 불러오는 중 오류가 발생했습니다.");
      setGames([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRanking(range);
  }, [range, reloadKey]);

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

  const handleMenuClick = (key) => {
    setSelectedMenu(key);

    if (key === "main") {
      navigate("/");
    } else if (key === "explore") {
      navigate("/explore");
    } else if (key === "ranking") {
      // 현재 페이지
    } else if (key === "chat") {
      navigate("/chat");
    } else if (key === "write") {
      setCreateOpen(true);
    } else if (key === "profile") {
      navigate("/me");
    } else if (key === "more") {
      // 추후 기능 추가
    } else if (key === "logout") {
      logout();
      window.location.href = "/login";
    }
  };

  const handleGoGameFeed = (gameId) => {
    // 메인 피드에서 이 게임만 보이도록 state로 넘김
    navigate("/", { state: { initialGameId: gameId } });
  };

  // 🔔 헤더에서 알림 메뉴 열릴 때 → 모두 읽음 처리
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
      if (n.roomId) {
        navigate("/chat", { state: { openRoomId: n.roomId } });
      } else {
        navigate("/chat");
      }
      return;
    }
    // 게시글과 관련된 알림들
    if (
      n.type === "FOLLOWED_USER_POST" || // 팔로우한 유저 새 글
      n.type === "FOLLOWED_POST" ||      // 혹시 나중에 따로 쓸 경우
      n.type === "COMMENT_MENTION"       // 댓글 멘션
    ) {
      if (n.postId) {
        // 메인 피드로 이동하면서 열어야 할 postId를 state로 넘김
        navigate("/", { state: { openPostId: n.postId } });
      } else {
        navigate("/");
      }
      return;
    }

    console.log("unknown notification type:", n);
  };

  // 막대 퍼센트 계산용 최대 score (0이면 1로 보정)
  const maxScore =
    games.reduce((max, g) => {
      const s = g.score || 0;
      return s > max ? s : max;
    }, 0) || 1;

  if (!user) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography>로그인이 필요합니다.</Typography>
      </Container>
    );
  }

  const handlePostCreated = () => {
    setReloadKey((k) => k + 1);
  };

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: theme.palette.background.default,
        color: theme.palette.text.primary,
      }}
    >
      {/* 왼쪽 사이드바 (다크모드는 SideNav 안에서 처리됨) */}
      <SideNav selectedMenu={selectedMenu} onMenuClick={handleMenuClick} />

      {/* 오른쪽 메인 영역 */}
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        {/* 상단 공통 헤더 (이미 다크모드 대응) */}
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
          {/* 헤더 + 기간 필터 */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              인기 TOP 10 게임
            </Typography>

            <TextField
              select
              size="small"
              label="기간"
              value={range}
              onChange={(e) => setRange(e.target.value)}
              sx={{ width: 160 }}
            >
              <MenuItem value="7">최근 7일</MenuItem>
              <MenuItem value="30">최근 30일</MenuItem>
              <MenuItem value="all">전체 기간</MenuItem>
            </TextField>
          </Box>

          {loading && (
            <Box sx={{ mb: 2 }}>
              <LinearProgress />
            </Box>
          )}

          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}

          {!loading && games.length === 0 && !error && (
            <Card sx={{ bgcolor: theme.palette.background.paper }}>
              <CardContent>
                <Typography variant="body1">
                  아직 랭킹에 표시할 게임이 없습니다. 게시글을 먼저 올려보세요!
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* 랭킹 리스트 */}
          {games.map((g, idx) => {
            const rank = idx + 1;
            const percent = Math.round(((g.score || 0) / maxScore) * 100);

            return (
              <Card
                key={g.id ?? g.gameId ?? idx}
                sx={{
                  bgcolor: theme.palette.background.paper,
                }}
              >
                <CardContent
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  {/* 순위 번호 */}
                  <Box
                    sx={{
                      width: 40,
                      textAlign: "center",
                      fontWeight: "bold",
                      fontSize: 20,
                    }}
                  >
                    {rank}
                  </Box>

                  {/* 🔥 게임 썸네일 */}
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: 2,
                      overflow: "hidden",
                      bgcolor: "#ddd",
                      flexShrink: 0,
                    }}
                  >
                    {g.thumbnailUrl && (
                      <Box
                        component="img"
                        src={g.thumbnailUrl}
                        alt={g.name}
                        sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    )}
                  </Box>

                  {/* 게임 정보 */}
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                      {g.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: theme.palette.text.secondary }}
                    >
                      게시글 {g.postCount}개 · 좋아요 {g.totalLikes}개 · 댓글{" "}
                      {g.totalComments}개
                    </Typography>

                    {/* bar 표현 */}
                    <Box sx={{ mt: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={percent}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor:
                            theme.palette.mode === "dark"
                              ? theme.palette.grey[800]
                              : theme.palette.grey[200],
                          "& .MuiLinearProgress-bar": {
                            borderRadius: 3,
                          },
                        }}
                      />
                    </Box>
                  </Box>

                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleGoGameFeed(g.id ?? g.gameId)}
                  >
                    이 게임 피드 보기
                  </Button>
                </CardContent>
              </Card>
            );
          })}

          <CreatePostDialog
            open={createOpen}
            onClose={() => setCreateOpen(false)}
            onCreated={handlePostCreated}
          />
        </Container>
      </Box>
    </Box>
  );
}

export default GameRankingPage;
