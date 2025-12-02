// src/pages/ChatPage.jsx
import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import {
  Box,
  Container,
  TextField,
  Button,
  Avatar,
  Paper,
  Tabs,
  Tab,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Typography,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";

import { useTheme } from "@mui/material/styles";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchGameList } from "../api/postApi";
import { searchUsers } from "../api/userApi";
import { fetchUnreadSummary, fetchFindChatRoomById } from "../api/ChatApi";
import {
  getNotificationSummary,
  markAllNotificationsRead,
} from "../api/notificationApi";
import { buildFileUrl } from "../utils/url";

import SideNav from "../components/layout/SideNav";
import MainHeader from "../components/layout/MainHeader";
import CreatePostDialog from "../components/post/CreatePostDialog";

const SOCKET_URL = "http://localhost:3020";
const API_ORIGIN = "http://localhost:3020";

// 🔔 피드/마이페이지와 동일한 알림 정규화 함수
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

function ChatPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const theme = useTheme();

  const socketRef = useRef(null);          // 채팅용 소켓
  const currentRoomIdRef = useRef(null);
  const bottomRef = useRef(null);

  const [selectedMenu, setSelectedMenu] = useState("chat");
  const [createOpen, setCreateOpen] = useState(false);

  const [mode, setMode] = useState("GAME"); // GAME | DM
  const [gameList, setGameList] = useState([]);
  const [selectedGameId, setSelectedGameId] = useState("");
  const [gameSearch, setGameSearch] = useState("");

  const [currentRoomId, setCurrentRoomId] = useState(null);
  const [roomInfo, setRoomInfo] = useState(null); // { type, gameId, gameName, otherUserId }

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [joinError, setJoinError] = useState("");

  const [dmSearch, setDmSearch] = useState("");
  const [dmSearchResults, setDmSearchResults] = useState([]);
  const [dmSearchLoading, setDmSearchLoading] = useState(false);
  const [dmSearchError, setDmSearchError] = useState("");

  // 🔔 채팅방별 안읽은 메시지 요약 (ChatApi용)
  const [unreadSummary, setUnreadSummary] = useState({}); // { [roomId]: count }
  const [lastNotification, setLastNotification] = useState(null); // 마지막 채팅 알림용

  // 🔔 상단 헤더용 글로벌 알림 상태
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const initialRoomId = location.state?.openRoomId || null;

  // ────────────────────────── 공통 네비게이션 (SideNav) ──────────────────────────
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

  // ────────────────────────── 채팅 소켓 연결 ──────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const s = io(SOCKET_URL, {
      auth: { token },
    });

    socketRef.current = s;

    s.on("connect", () => {
      console.log("chat socket connected");
    });

    s.on("connect_error", (err) => {
      console.error("chat socket connect_error:", err.message);
    });

    // 새 메시지 수신
    s.on("chat:message", (msg) => {
      setMessages((prev) => {
        if (!currentRoomIdRef.current) return prev;
        // 현재 보고 있는 방 메시지만 화면에 추가
        if (msg.roomId !== currentRoomIdRef.current) {
          // 다른 방 메시지는 여기서는 UI에 안 붙이고 unreadSummary로만 관리
          return prev;
        }
        return [...prev, msg];
      });
    });

    // 채팅용 알림(방별 unread 카운트)
    s.on("chat:notification", (notif) => {
      console.log("chat:notification", notif);
      setUnreadSummary((prev) => {
        const prevCount = prev[notif.roomId] || 0;
        return {
          ...prev,
          [notif.roomId]: prevCount + 1,
        };
      });
      setLastNotification(notif);
    });

    return () => {
      s.disconnect();
    };
  }, [navigate]);

  // 채팅용 unread 요약 초기 로딩
  useEffect(() => {
    async function loadUnread() {
      try {
        const map = await fetchUnreadSummary();
        setUnreadSummary(map);
      } catch (err) {
        console.error("fetchUnreadSummary error:", err);
      }
    }
    loadUnread();
  }, []);

  useEffect(() => {
    if (!initialRoomId) return;
    if (!socketRef.current) return;   // 소켓 아직 준비 안 됐으면 리턴

    // 1) roomId로 방 메타 정보 조회 (GAME/DM, gameId, otherUserId)
    (async () => {
      try {
        const meta = await fetchFindChatRoomById(initialRoomId);
        if (!meta) {
          console.error("room meta 없음");
          return;
        }
        if (meta.type === "GAME" && meta.gameId) {
          setMode("GAME");
          setSelectedGameId(String(meta.gameId));
          joinGameRoomById(meta.gameId);
        } else if (meta.type === "DM" && meta.otherUserId) {
          setMode("DM");
          handleJoinDmRoom(meta.otherUserId);
        } else {
          console.warn("알 수 없는 room meta:", meta);
        }
      } catch (err) {
        console.error("openRoomId 처리 중 오류:", err);
      }
    })();
  }, [initialRoomId]);

  // ────────────────────────── 상단 헤더용 알림 소켓 / 요약 ──────────────────────────
  useEffect(() => {
    if (!user) return;

    let notifySocket;

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
        console.error("알림 요약 불러오기 실패 (ChatPage):", err);
      }

      // 알림 전용 소켓
      notifySocket = io(API_ORIGIN, {
        auth: {
          token: localStorage.getItem("token"),
        },
      });

      notifySocket.on("connect_error", (err) => {
        console.error("notify socket connect_error:", err.message);
      });

      notifySocket.on("notify:new", (payload) => {
        const n = normalizeNotification(payload);
        if (!n) return;

        setUnreadTotal((prev) => prev + 1);
        setNotifications((prev) => [n, ...prev].slice(0, 20));
      });
    })();

    return () => {
      if (notifySocket) notifySocket.disconnect();
    };
  }, [user]);

  // 🔔 헤더에서 알림 버튼 눌러 메뉴 열릴 때 → 모두 읽음 처리
  const handleNotificationsOpened = async () => {
    if (unreadTotal > 0) {
      try {
        await markAllNotificationsRead();
        setUnreadTotal(0);
      } catch (err) {
        console.error("알림 읽음 처리 실패 (ChatPage):", err);
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
      n.type === "FOLLOWED_USER_POST" ||
      n.type === "FOLLOWED_POST" ||
      n.type === "COMMENT_MENTION"
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

  // ────────────────────────── 게임 목록 로딩 ──────────────────────────
  useEffect(() => {
    async function loadGames() {
      try {
        const list = await fetchGameList();
        setGameList(list);
      } catch (err) {
        console.error("게임 목록 불러오기 실패:", err);
      }
    }
    loadGames();
  }, []);

  // 메시지 변경 시 자동 스크롤
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // 모드 전환 (게임 <-> DM)
  const handleChangeMode = (event, newValue) => {
    setMode(newValue);
    setMessages([]);
    setCurrentRoomId(null);
    currentRoomIdRef.current = null;
    setRoomInfo(null);
    setJoinError("");
  };

  // ────────────────────────── 방 입장: 게임 채팅 ──────────────────────────
  const joinGameRoomById = (gameIdParam) => {
    const s = socketRef.current;
    if (!s) return;

    const gameId = Number(gameIdParam);
    if (!gameId) {
      alert("게임을 선택해 주세요.");
      return;
    }

    setLoadingHistory(true);
    setJoinError("");

    s.emit("chat:joinGame", gameId, (res) => {
      setLoadingHistory(false);
      if (!res || !res.ok) {
        console.error("joinGame 실패:", res);
        setJoinError("게임 채팅방 입장 중 오류가 발생했습니다.");
        return;
      }

      setCurrentRoomId(res.roomId);
      currentRoomIdRef.current = res.roomId;
      setMessages(res.messages || []);

      const game = gameList.find((g) => g.id === gameId);
      setRoomInfo({
        type: "GAME",
        gameId,
        gameName: game ? game.name : `게임 #${gameId}`,
      });

      // 이 방은 방금 읽음 → 안읽음 0
      setUnreadSummary((prev) => ({
        ...prev,
        [res.roomId]: 0,
      }));
    });
  };

  const handleJoinGameRoom = () => {
    joinGameRoomById(selectedGameId);
  };

  // ────────────────────────── 방 입장: DM ──────────────────────────
  const handleJoinDmRoom = (otherUserId) => {
    const s = socketRef.current;
    if (!s) return;

    const otherId = parseInt(otherUserId, 10);
    if (!otherId) {
      alert("상대 사용자를 선택해 주세요.");
      return;
    }
    if (user && otherId === user.id) {
      alert("자기 자신과는 DM을 시작할 수 없습니다.");
      return;
    }

    setLoadingHistory(true);
    setJoinError("");

    s.emit("chat:joinDm", otherId, (res) => {
      setLoadingHistory(false);
      if (!res || !res.ok) {
        console.error("joinDm 실패:", res);
        setJoinError("DM 방 입장 중 오류가 발생했습니다.");
        return;
      }

      setCurrentRoomId(res.roomId);
      currentRoomIdRef.current = res.roomId;
      setMessages(res.messages || []);
      setRoomInfo({
        type: "DM",
        otherUserId: otherId,
      });
      setUnreadSummary((prev) => ({
        ...prev,
        [res.roomId]: 0,
      }));
    });
  };

  const handleSearchDmUser = async () => {
    const q = dmSearch.trim();
    if (!q) {
      setDmSearchResults([]);
      setDmSearchError("");
      return;
    }

    setDmSearchLoading(true);
    setDmSearchError("");
    try {
      const list = await searchUsers(q);
      if (list.length === 0) {
        setDmSearchError("검색 결과가 없습니다.");
      }
      setDmSearchResults(list);
    } catch (err) {
      console.error("DM 사용자 검색 실패:", err);
      setDmSearchError("사용자 검색 중 오류가 발생했습니다.");
    } finally {
      setDmSearchLoading(false);
    }
  };

  // ────────────────────────── 메시지 전송 ──────────────────────────
  const handleSend = () => {
    const s = socketRef.current;
    const text = input.trim();
    if (!s) return;
    if (!currentRoomId) {
      alert("먼저 채팅방에 입장해 주세요.");
      return;
    }
    if (!text) return;

    s.emit("chat:message", { roomId: currentRoomId, text });
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ────────────────────────── UI helpers ──────────────────────────
  const renderRoomTitle = () => {
    if (!roomInfo) return "채팅방을 선택하세요";

    if (roomInfo.type === "GAME") {
      return `${roomInfo.gameName} 채팅방`;
    } else if (roomInfo.type === "DM") {
      return `DM : 사용자 #${roomInfo.otherUserId}`;
    }
    return "채팅방";
  };

  const totalUnread = Object.values(unreadSummary).reduce(
    (sum, c) => sum + c,
    0
  );

  const handleOpenRoomFromNotification = (notif) => {
    if (!notif) return;

    if (notif.roomType === "GAME") {
      setMode("GAME");
      setSelectedGameId(String(notif.gameId));
      joinGameRoomById(notif.gameId);
    } else if (notif.roomType === "DM") {
      setMode("DM");
      handleJoinDmRoom(notif.dmUserId);
    }

    setLastNotification(null);
  };

  if (!user) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography>로그인이 필요합니다.</Typography>
      </Container>
    );
  }

  const formatMessageTime = (createdAt) => {
    if (!createdAt) return "";

    const d = new Date(createdAt);
    if (Number.isNaN(d.getTime())) return "";

    const now = new Date();

    const isSameDay =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();

    if (isSameDay) {
      // 오늘 → 시간만
      return d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    // 오늘이 아니면 날짜 + 시간
    return d.toLocaleString([], {
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ────────────────────────── RENDER ──────────────────────────
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
        {/* ✅ 공통 상단 헤더: 이제 진짜 알림/레벨 다 뜸 */}
        <MainHeader
          user={user}
          unreadTotal={unreadTotal}
          notifications={notifications}
          onNotificationClick={handleNotificationClick}
          onNotificationsOpened={handleNotificationsOpened}
          onClickLogo={() => navigate("/")}
          onClickProfile={() => navigate("/me")}
          showSearch={false}
        />

        {/* 채팅 메인 콘텐츠 */}
        <Container
          maxWidth="md"
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            py: 2,
            gap: 2,
          }}
        >
          {/* 제목 */}
          <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
            실시간 채팅
          </Typography>

          {/* 모드 탭 (게임 / DM) */}
          <Tabs
            value={mode}
            onChange={handleChangeMode}
            sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}
          >
            <Tab label="게임 채팅" value="GAME" />
            <Tab label="DM" value="DM" />
          </Tabs>

          {/* 채팅용 전체 안읽음 수 표시 */}
          {totalUnread > 0 && (
            <Typography
              variant="body2"
              sx={{ mt: 1, color: "primary.main", fontWeight: "bold" }}
            >
              전체 안읽은 메시지: {totalUnread}개
            </Typography>
          )}

          {/* 최신 채팅 알림 배너 */}
          {lastNotification && (
            <Paper
              elevation={0}
              sx={{
                mt: 1,
                p: 1.5,
                bgcolor:
                  theme.palette.mode === "dark"
                    ? theme.palette.action.hover
                    : "#fffbe6",
                border: `1px solid ${
                  theme.palette.mode === "dark"
                    ? theme.palette.warning.light
                    : "#ffe58f"
                }`,
                borderRadius: 1.5,
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                새 메시지 ·{" "}
                {lastNotification.roomType === "GAME" ? "게임 채팅" : "DM"}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {lastNotification.senderName}: {lastNotification.content}
              </Typography>
              <Button
                size="small"
                sx={{ mt: 0.5, textTransform: "none" }}
                onClick={() => handleOpenRoomFromNotification(lastNotification)}
              >
                이 방으로 이동
              </Button>
            </Paper>
          )}

          {/* 방 선택 영역 */}
          {mode === "GAME" && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                mt: 1,
                flexWrap: "wrap",
              }}
            >
              <Box sx={{ minWidth: { xs: "100%", sm: 260 }, maxWidth: 360 }}>
                <Autocomplete
                  size="small"
                  options={gameList}
                  getOptionLabel={(option) => option.name || ""}
                  noOptionsText="게임이 없습니다"
                  value={
                    gameList.find(
                      (g) => String(g.id) === String(selectedGameId)
                    ) || null
                  }
                  onChange={(e, newValue) => {
                    if (newValue) {
                      setSelectedGameId(String(newValue.id));
                      setGameSearch(newValue.name || "");
                    } else {
                      setSelectedGameId("");
                      setGameSearch("");
                    }
                  }}
                  inputValue={gameSearch}
                  onInputChange={(e, value) => {
                    setGameSearch(value);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="게임 선택"
                      placeholder="게임 이름 검색"
                    />
                  )}
                />
              </Box>

              <Button
                variant="contained"
                onClick={handleJoinGameRoom}
                sx={{ whiteSpace: "nowrap" }}
              >
                이 게임 채팅방 입장
              </Button>
            </Box>
          )}

          {mode === "DM" && (
            <Box sx={{ mt: 1 }}>
              {/* 검색 입력 + 버튼 */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  mb: 1.5,
                }}
              >
                <TextField
                  size="small"
                  label="닉네임 / 아이디 검색"
                  placeholder="예: 닉네임 또는 @아이디"
                  value={dmSearch}
                  onChange={(e) => setDmSearch(e.target.value)}
                  sx={{ minWidth: 220 }}
                />
                <Button variant="contained" onClick={handleSearchDmUser}>
                  사용자 검색
                </Button>
              </Box>

              {/* 검색 상태 / 에러 */}
              {dmSearchLoading && (
                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", mb: 1 }}
                >
                  검색 중...
                </Typography>
              )}
              {dmSearchError && (
                <Typography variant="body2" color="error" sx={{ mb: 1 }}>
                  {dmSearchError}
                </Typography>
              )}

              {/* 검색 결과 리스트 */}
              <List
                dense
                sx={{
                  maxHeight: 200,
                  overflowY: "auto",
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 1,
                  bgcolor: theme.palette.background.paper,
                }}
              >
                {dmSearchResults.length === 0 &&
                  !dmSearchLoading &&
                  !dmSearchError && (
                    <Typography
                      variant="body2"
                      sx={{ p: 1, color: "text.secondary" }}
                    >
                      사용자 검색 결과가 여기에 표시됩니다.
                    </Typography>
                  )}

                {dmSearchResults.map((u) => {
                  const displayName =
                    u.nickname || u.username || `user#${u.id}`;
                  return (
                    <ListItemButton
                      key={u.id}
                      onClick={() => handleJoinDmRoom(u.id)}
                    >
                      <ListItemAvatar>
                        <Avatar src={buildFileUrl(u.avatarUrl) || ""}>
                          {displayName[0]}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={displayName}
                        secondary={`@${u.username} (id: ${u.id})`}
                      />
                    </ListItemButton>
                  );
                })}
              </List>
            </Box>
          )}

          {/* 현재 방 정보 / 상태 */}
          <Box sx={{ mt: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
              {renderRoomTitle()}
            </Typography>
            {loadingHistory && (
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                이전 채팅 불러오는 중...
              </Typography>
            )}
            {joinError && (
              <Typography variant="body2" color="error">
                {joinError}
              </Typography>
            )}
          </Box>

          {/* 메시지 리스트 */}
          <Paper
            elevation={0}
            sx={{
              flexGrow: 1,
              p: 2,
              bgcolor: theme.palette.background.paper,
              borderRadius: 2,
              overflowY: "auto",
            }}
          >
            {(!roomInfo || messages.length === 0) && !loadingHistory && (
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {roomInfo
                  ? "아직 메시지가 없습니다. 첫 메시지를 보내보세요!"
                  : "위에서 게임을 선택하거나 DM 대상을 선택해 채팅방에 입장하세요."}
              </Typography>
            )}

            {messages.map((m) => {
              const isMe = m.senderId === user?.id;
              const name = m.nickname || m.username || "U";
              const displayTime = formatMessageTime(m.createdAt);

              return (
                <Box
                  key={m.id + m.createdAt}
                  sx={{
                    display: "flex",
                    justifyContent: isMe ? "flex-end" : "flex-start",
                    mb: 1.2,
                  }}
                >
                  {!isMe && (
                    <Avatar
                      sx={{ width: 28, height: 28, mr: 1 }}
                      src={buildFileUrl(m.avatarUrl) || ""}
                    >
                      {name[0]}
                    </Avatar>
                  )}

                  <Box
                    sx={{
                      maxWidth: "70%",
                      bgcolor: isMe
                        ? theme.palette.primary.main
                        : theme.palette.background.paper,
                      color: isMe
                        ? theme.palette.primary.contrastText
                        : theme.palette.text.primary,
                      borderRadius: 2,
                      px: 1.5,
                      py: 0.8,
                      border: !isMe
                        ? `1px solid ${
                            theme.palette.mode === "dark"
                              ? "rgba(255,255,255,0.35)"
                              : "rgba(0,0,0,0.18)"
                          }`
                        : "none",
                    }}
                  >
                    {!isMe && (
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: "bold",
                          display: "block",
                          mb: 0.3,
                        }}
                      >
                        {name}
                      </Typography>
                    )}

                    <Typography
                      variant="body2"
                      sx={{
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {m.content}
                    </Typography>

                    <Typography
                      variant="caption"
                      sx={{
                        opacity: 0.7,
                        display: "block",
                        textAlign: "right",
                        mt: 0.3,
                      }}
                    >
                      {displayTime}
                    </Typography>
                  </Box>

                  {isMe && (
                    <Avatar
                      sx={{ width: 28, height: 28, ml: 1 }}
                      src={buildFileUrl(user?.avatarUrl) || ""}
                    >
                      {(user?.nickname || user?.username || "U")[0]}
                    </Avatar>
                  )}
                </Box>
              );
            })}
            <div ref={bottomRef} />
          </Paper>

          {/* 입력창 */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <TextField
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              multiline
              maxRows={4}
              placeholder={
                currentRoomId ? "메시지를 입력하세요" : "먼저 채팅방에 입장하세요"
              }
              fullWidth
            />
            <Button
              variant="contained"
              onClick={handleSend}
              disabled={!input.trim() || !currentRoomId}
            >
              전송
            </Button>
          </Box>

          {/* 글쓰기 모달 */}
          <CreatePostDialog
            open={createOpen}
            onClose={() => setCreateOpen(false)}
            onCreated={() => setCreateOpen(false)}
          />
        </Container>
      </Box>
    </Box>
  );
}

export default ChatPage;
