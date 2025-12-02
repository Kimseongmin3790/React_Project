// src/pages/ExplorePage.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Chip,
  Card,
  CardContent,
  CardMedia,
  Button,
  Grid,
  Stack,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useGameList } from "../hooks/useGameList";
import { useTheme } from "@mui/material/styles";

import SideNav from "../components/layout/SideNav";
import MainHeader from "../components/layout/MainHeader";
import CreatePostDialog from "../components/post/CreatePostDialog";
import PostDetailDialog from "../components/post/postDetail";
import { fetchExploreSummary } from "../api/exploreApi";
import { markAllNotificationsRead, getNotificationSummary } from "../api/notificationApi";

import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import ShuffleIcon from "@mui/icons-material/Shuffle";
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

function getMediaUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API_ORIGIN}${url}`;
}

function ExplorePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  const [selectedMenu, setSelectedMenu] = useState("explore");
  const [createOpen, setCreateOpen] = useState(false);

  const [popularTags, setPopularTags] = useState([]);
  const [trendingGames, setTrendingGames] = useState([]);
  const [randomPosts, setRandomPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [unreadTotal, setUnreadTotal] = useState(0);
  const [notifications, setNotifications] = useState([]);

  const [searchText, setSearchText] = useState("");

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailPostId, setDetailPostId] = useState(null);
  const { gameList } = useGameList();

  const [daysRange, setDaysRange] = useState("7"); // "1" | "7" | "30"

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

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");

        const days =
          daysRange === "1" ? 1 : daysRange === "30" ? 30 : 7;

        const data = await fetchExploreSummary({
          days,
          tagsLimit: 20,
          gamesLimit: 10,
          postsLimit: 18,
        });
        setPopularTags(data.popularTags || []);
        setTrendingGames(data.trendingGames || []);
        setRandomPosts(data.randomPosts || []);
      } catch (err) {
        console.error("fetchExploreSummary error:", err);
        setError("탐색 데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, [daysRange]);

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

  const openDetail = (postId) => {
    setDetailPostId(postId);
    setDetailOpen(true);
  };
  const closeDetail = () => {
    setDetailPostId(null);
    setDetailOpen(false);
  };

  if (!user) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography>로그인이 필요합니다.</Typography>
      </Container>
    );
  }

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

  const handlePostUpdatedFromDetail = (updatedPost) => {
    if (!updatedPost) return;
    setRandomPosts((prev) => 
      prev.map((p) => 
        p.id === updatedPost.id
          ? {
            ...p,
            thumbUrl: updatedPost.thumbUrl ?? p.thumbUrl,
            thumbType: updatedPost.thumbType ?? p.thumbType
            }
          : p
      )
    );
  };

  const rangeLabel =
    daysRange === "1" ? "오늘" : daysRange === "7" ? "7일" : "30일";

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
          onSearchSubmit={(value) => {
            const q = (value || "").trim();
            if (q) navigate(`/search?query=${encodeURIComponent(q)}`);
          }}
        />

        <Container
          maxWidth="lg"
          sx={{
            flexGrow: 1,
            py: 3,
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          {/* ───────── 상단 타이틀 + 기간 Chip 필터 ───────── */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 1,
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              탐색
            </Typography>
            <Stack direction="row" spacing={1}>
              {[
                { value: "1", label: "오늘" },
                { value: "7", label: "7일" },
                { value: "30", label: "30일" },
              ].map((opt) => (
                <Chip
                  key={opt.value}
                  label={opt.label}
                  size="small"
                  clickable
                  color={daysRange === opt.value ? "primary" : "default"}
                  variant={daysRange === opt.value ? "filled" : "outlined"}
                  onClick={() => setDaysRange(opt.value)}
                />
              ))}
            </Stack>
          </Box>

          <Typography
            variant="body2"
            sx={{ color: "text.secondary", mb: 1 }}
          >
            최근 {rangeLabel} 기준으로 인기 태그와 게임, 추천 클립을 모아 보여줘요.
          </Typography>

          {loading && (
            <Typography sx={{ mt: 1 }}>불러오는 중...</Typography>
          )}
          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}

          {!loading && !error && (
            <>
              {/* 🔹 인기 태그 섹션 */}
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                    mb: 0.5,
                  }}
                >
                  <LocalOfferIcon fontSize="small" />
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: "bold" }}
                  >
                    인기 태그
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", mb: 1 }}
                >
                  요즘 가장 많이 쓰이는 해시태그예요. 태그를 눌러 관련 클립을 한 번에
                  모아볼 수 있어요.
                </Typography>

                {popularTags.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    아직 인기 태그가 없습니다.
                  </Typography>
                ) : (
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 1,
                      p: 1,
                      borderRadius: 2,
                      bgcolor:
                        theme.palette.mode === "dark"
                          ? theme.palette.background.paper
                          : "#f5f5f5",
                    }}
                  >
                    {popularTags.map((t) => (
                      <Chip
                        key={t.id}
                        label={`#${t.name} · ${t.postCount ?? 0}`}
                        clickable
                        onClick={() =>
                          navigate(`/tags/${encodeURIComponent(t.name)}`)
                        }
                        sx={{
                          borderRadius: 999,
                          "& .MuiChip-label": {
                            maxWidth: 150,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          },
                        }}
                      />
                    ))}
                  </Box>
                )}
              </Box>

              {/* 🔹 최근 많이 올라오는 게임 섹션 */}
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                    mb: 0.5,
                  }}
                >
                  <SportsEsportsIcon fontSize="small" />
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: "bold" }}
                  >
                    최근 많이 올라오는 게임
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", mb: 1 }}
                >
                  {rangeLabel} 동안 클립이 많이 올라온 게임들이에요.
                </Typography>

                {trendingGames.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    아직 랭킹에 표시할 게임이 없습니다.
                  </Typography>
                ) : (
                  <Grid container spacing={2}>
                    {trendingGames.map((g) => (
                      <Grid item xs={12} sm={6} md={4} key={g.id}>
                        <Card
                          sx={{
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            borderRadius: 2,
                            overflow: "hidden",
                            transition: "all 0.15s ease-out",
                            "&:hover": {
                              boxShadow: 4,
                              transform: "translateY(-2px)",
                            },
                          }}
                        >
                          {g.thumbnailUrl && (
                            <CardMedia
                              component="img"
                              src={getMediaUrl(g.thumbnailUrl)}
                              sx={{
                                height: 140,
                                objectFit: "cover",
                              }}
                            />
                          )}
                          <CardContent
                            sx={{
                              flexGrow: 1,
                              display: "flex",
                              flexDirection: "column",
                              gap: 0.5,
                            }}
                          >
                            <Typography
                              variant="subtitle2"
                              sx={{ fontWeight: "bold" }}
                            >
                              {g.name}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                            >
                              게시글 {g.postCount ?? 0}개
                            </Typography>
                            <Box sx={{ mt: 1 }}>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() =>
                                  navigate("/", {
                                    state: { initialGameId: g.id },
                                  })
                                }
                                sx={{ textTransform: "none" }}
                              >
                                이 게임 피드 보기
                              </Button>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Box>

              {/* 🔹 랜덤 추천 클립 섹션 */}
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                    mb: 0.5,
                  }}
                >
                  <ShuffleIcon fontSize="small" />
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: "bold" }}
                  >
                    랜덤 추천 클립
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", mb: 1 }}
                >
                  다양한 게임의 겜짤을 랜덤으로 골라 보여줘요.
                </Typography>

                {randomPosts.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    아직 추천할 클립이 없습니다.
                  </Typography>
                ) : (
                  <Grid container spacing={1}>
                    {randomPosts.map((p) => {
                      const gameName =
                        p.gameName || p.game_name || "게임";
                      const likeCount =
                        p.likeCount ?? p.like_count ?? 0;

                      return (
                        <Grid item xs={4} sm={3} md={2} key={p.id}>
                          <Box
                            sx={{
                              position: "relative",
                              width: "100%",
                              aspectRatio: "1 / 1",
                              overflow: "hidden",
                              cursor: "pointer",
                              bgcolor: theme.palette.action.hover,
                            }}
                            onClick={() => openDetail(p.id)}
                          >
                            {p.thumbUrl && (
                              <Box
                                component={
                                  p.thumbType === "VIDEO"
                                    ? "video"
                                    : "img"
                                }
                                src={getMediaUrl(p.thumbUrl)}
                                controls={p.thumbType === "VIDEO"}
                                sx={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                  transition: "transform 0.2s ease-out",
                                  "&:hover": {
                                    transform: "scale(1.03)",
                                  },
                                }}
                              />
                            )}

                            {/* 오버레이: 게임명 + 좋아요 수 */}
                            <Box
                              sx={{
                                position: "absolute",
                                left: 0,
                                bottom: 0,
                                width: "100%",
                                px: 0.5,
                                py: 0.3,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                bgcolor: "rgba(0,0,0,0.45)",
                                color: "#fff",
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{
                                  maxWidth: "70%",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {gameName}
                              </Typography>
                              <Typography variant="caption">
                                ♥ {likeCount}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                )}
              </Box>
            </>
          )}

          {/* 글쓰기 모달 */}
          <CreatePostDialog
            open={createOpen}
            onClose={() => setCreateOpen(false)}
          />

          {/* 게시글 상세 모달 */}
          <PostDetailDialog
            open={detailOpen}
            onClose={closeDetail}
            postId={detailPostId}
            gameList={gameList}
            onPostUpdated={handlePostUpdatedFromDetail}
          />
        </Container>
      </Box>
    </Box>
  );
}

export default ExplorePage;
