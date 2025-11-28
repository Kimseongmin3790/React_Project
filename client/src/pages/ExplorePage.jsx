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
import { useTheme } from "@mui/material/styles";

import SideNav from "../components/layout/SideNav";
import MainHeader from "../components/layout/MainHeader";
import CreatePostDialog from "../components/post/CreatePostDialog";
import PostDetailDialog from "../components/post/postDetail";
import { fetchExploreSummary } from "../api/exploreApi";
import { markAllNotificationsRead } from "../api/notificationApi";

import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import ShuffleIcon from "@mui/icons-material/Shuffle";

const API_ORIGIN = "http://localhost:3020";

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
            onPostUpdated={() => {}}
          />
        </Container>
      </Box>
    </Box>
  );
}

export default ExplorePage;
