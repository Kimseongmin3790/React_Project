import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Container,
  TextField,
  Button,
  Avatar,
  Paper,
  Tabs,
  Tab,
  MenuItem,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchGameList } from "../api/postApi";
import { searchUsers } from "../api/userApi";
import { fetchUnreadSummary } from "../api/ChatApi";

const SOCKET_URL = "http://localhost:3020";

function ChatPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const socketRef = useRef(null);
  const currentRoomIdRef = useRef(null);
  const bottomRef = useRef(null);

  const [mode, setMode] = useState("GAME"); // GAME | DM
  const [gameList, setGameList] = useState([]);
  const [selectedGameId, setSelectedGameId] = useState("");  

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

  const [unreadSummary, setUnreadSummary] = useState({}); // { [roomId]: count }
  const [lastNotification, setLastNotification] = useState(null); // 마지막 알림용

  // ────────────────────────── 소켓 연결 ──────────────────────────
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
      console.log("socket connected");
    });

    s.on("connect_error", (err) => {
      console.error("socket connect_error:", err.message);
    });

    // 새 메시지 수신
    s.on("chat:message", (msg) => {
      setMessages((prev) => {
        if (!currentRoomIdRef.current) return prev;
        // 현재 보고 있는 방 메시지만 화면에 추가
        if (msg.roomId !== currentRoomIdRef.current) {
          // TODO: 여기서 알림용 로직 추가 가능 (나중에)
          return prev;
        }
        return [...prev, msg];
      });
    });

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
  const handleJoinGameRoom = () => {
    joinGameRoomById(selectedGameId);
    const s = socketRef.current;
    if (!s) return;

    const gameId = Number(selectedGameId);

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
      setUnreadSummary((prev) => ({
      ...prev,
      [res.roomId]: 0,
      }));
    });
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

  // ────────────────────────── UI render ──────────────────────────
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
  // ────────────────────────── 기타 함수 ──────────────────────────
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

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#fafafa",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* 상단 AppBar */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <IconButton edge="start" onClick={() => navigate(-1)}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ ml: 1, fontWeight: "bold" }}>
            실시간 채팅
          </Typography>
        </Toolbar>
      </AppBar>

      {/* 메인 영역 */}
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
        {/* 모드 탭 (게임 / DM) */}
        <Tabs
          value={mode}
          onChange={handleChangeMode}
          sx={{ borderBottom: "1px solid #e0e0e0" }}
        >
          <Tab label="게임 채팅" value="GAME" />
          <Tab label="DM" value="DM" />
        </Tabs>

        {/* 전체 안읽음 수 표시 */}
        {totalUnread > 0 && (
          <Typography
            variant="body2"
            sx={{ mt: 1, color: "primary.main", fontWeight: "bold" }}
          >
            전체 안읽은 메시지: {totalUnread}개
        </Typography>
        )}

        {lastNotification && (
          <Paper
            elevation={0}
            sx={{
            mt: 1,
            p: 1.5,
            bgcolor: "#fffbe6",
            border: "1px solid #ffe58f",
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
            }}
          >
            <TextField
              select
              size="small"
              label="게임 선택"
              value={selectedGameId}
              onChange={(e) => setSelectedGameId(e.target.value)}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="">선택 안 함</MenuItem>
              {gameList.map((g) => (
                <MenuItem key={g.id} value={g.id}>
                  {g.name}
                </MenuItem>
              ))}
            </TextField>
            <Button variant="contained" onClick={handleJoinGameRoom}>
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
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
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
                  border: "1px solid #e0e0e0",
                  borderRadius: 1,
                  bgcolor: "#fff",
              }}
            >
              {dmSearchResults.length === 0 && !dmSearchLoading && !dmSearchError && (
                <Typography
                  variant="body2"
                  sx={{ p: 1, color: "text.secondary" }}
                >
                  사용자 검색 결과가 여기에 표시됩니다.
                </Typography>
              )}

              {dmSearchResults.map((u) => {
                const displayName = u.nickname || u.username || `user#${u.id}`;
                return (
                  <ListItemButton
                      key={u.id}
                      onClick={() => handleJoinDmRoom(u.id)}
                  >
                    <ListItemAvatar>
                      <Avatar src={u.avatarUrl || ""}>
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
            bgcolor: "#f5f5f5",
            borderRadius: 2,
            overflowY: "auto",
          }}
        >
          {(!roomInfo || messages.length === 0) && !loadingHistory && (
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {roomInfo
                ? "아직 메시지가 없습니다. 첫 메시지를 보내보세요!"
                : "왼쪽에서 게임을 선택하거나 DM 대상을 선택해 채팅방에 입장하세요."}
            </Typography>
          )}

          {messages.map((m) => {
            const isMe = m.senderId === user?.id;
            const name = m.nickname || m.username || "U";

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
                  <Avatar sx={{ width: 28, height: 28, mr: 1 }}>
                    {name[0]}
                  </Avatar>
                )}

                <Box
                  sx={{
                    maxWidth: "70%",
                    bgcolor: isMe ? "#1976d2" : "#ffffff",
                    color: isMe ? "#fff" : "#000",
                    borderRadius: 2,
                    px: 1.5,
                    py: 0.8,
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
                    {new Date(m.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Typography>
                </Box>

                {isMe && (
                  <Avatar sx={{ width: 28, height: 28, ml: 1 }}>
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
      </Container>
    </Box>
  );
}

export default ChatPage;
