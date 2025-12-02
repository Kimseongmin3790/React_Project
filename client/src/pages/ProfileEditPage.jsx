import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Avatar,
  Stack,
  Paper,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  updateProfile,
  uploadAvatar,
  verifyPassword,
} from "../api/userApi";

import MainHeader from "../components/layout/MainHeader";
import SideNav from "../components/layout/SideNav";
import CreatePostDialog from "../components/post/CreatePostDialog";

import { io } from "socket.io-client";
import {
  getNotificationSummary,
  markAllNotificationsRead,
} from "../api/notificationApi";

const API_BASE_URL = "http://localhost:3020";
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

function ProfileEditPage() {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuth();

  const [selectedMenu, setSelectedMenu] = useState("profile");

  const [createOpen, setCreateOpen] = useState(false);

  const [unreadTotal, setUnreadTotal] = useState(0);
  const [notifications, setNotifications] = useState([]);

  const [searchText, setSearchText] = useState("");

  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [saving, setSaving] = useState(false);

  const [verified, setVerified] = useState(false);
  const [passwordCheck, setPasswordCheck] = useState("");
  const [passwordCheckError, setPasswordCheckError] = useState("");
  const [checking, setChecking] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");

  useEffect(() => {
    if (user) {
      setNickname(user.nickname || "");
      setBio(user.bio || "");
      if (user.avatarUrl) {
        setAvatarPreview(
          user.avatarUrl.startsWith("http")
            ? user.avatarUrl
            : API_BASE_URL + user.avatarUrl
        );
      }
    }
  }, [user]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleVerifyPassword = async () => {
    setPasswordCheckError("");
    if (!passwordCheck) {
      setPasswordCheckError("현재 비밀번호를 입력해주세요.");
      return;
    }

    try {
      setChecking(true);
      const res = await verifyPassword(passwordCheck);
      if (res.ok) {
        setVerified(true);
      } else {
        setPasswordCheckError(
          res.message || "비밀번호가 일치하지 않습니다."
        );
      }
    } catch (err) {
      console.error("비밀번호 확인 실패:", err);
      setPasswordCheckError("비밀번호 확인 중 오류가 발생했습니다.");
    } finally {
      setChecking(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setNewPasswordError("");

    const payload = { nickname, bio };

    if (newPassword || newPasswordConfirm) {
      if (newPassword !== newPasswordConfirm) {
        setNewPasswordError("새 비밀번호가 일치하지 않습니다.");
        setSaving(false);
        return;
      }
      payload.newPassword = newPassword;
    }

    try {
      let updatedUser = await updateProfile(payload);

      if (avatarFile) {
        updatedUser = await uploadAvatar(avatarFile);
      }

      setUser(updatedUser);

      alert("프로필이 저장되었습니다.");
      navigate("/me");
    } catch (err) {
      console.error("프로필 저장 실패:", err);
      alert("프로필 저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleMenuClick = (key) => {
    setSelectedMenu(key);

    if (key === "main") {
      navigate("/");
    } else if (key === "explore") {
      navigate("/explore");
    } else if (key === "write") {
      setCreateOpen(true);
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

  const handlePostCreated = () => {
    setCreateOpen(false);
  };

  if (!user) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Typography>로그인 정보가 없습니다.</Typography>
      </Container>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: (theme) => theme.palette.background.default,
      }}
    >
      {/* ┌──────────── 왼쪽 사이드바 ────────────┐ */}
      <SideNav selectedMenu={selectedMenu} onMenuClick={handleMenuClick} />

      {/* ┌──────────── 오른쪽 메인 영역 ────────────┐ */}
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        {/* 상단 공통 헤더 */}
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

        {/* 프로필 수정 본문 */}
        <Box sx={{ bgcolor: "#fafafa", flexGrow: 1, py: 4 }}>
          <Container maxWidth="sm">
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
                프로필 수정
              </Typography>

              {!verified ? (
                <>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    보안을 위해 프로필을 수정하기 전에 현재 비밀번호를 한 번 더
                    입력해주세요.
                  </Typography>
                  <TextField
                    label="현재 비밀번호"
                    type="password"
                    fullWidth
                    value={passwordCheck}
                    onChange={(e) => setPasswordCheck(e.target.value)}
                    error={!!passwordCheckError}
                    helperText={passwordCheckError || " "}
                    sx={{ mb: 3 }}
                  />
                  <Stack
                    direction="row"
                    spacing={2}
                    justifyContent="flex-end"
                  >
                    <Button
                      variant="text"
                      onClick={() => navigate(-1)}
                      disabled={checking}
                    >
                      취소
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleVerifyPassword}
                      disabled={checking}
                    >
                      {checking ? "확인 중..." : "확인"}
                    </Button>
                  </Stack>
                </>
              ) : (
                <>
                  {/* 아바타 + 파일 업로드 */}
                  <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    sx={{ mb: 3 }}
                  >
                    <Avatar
                      src={avatarPreview}
                      sx={{ width: 72, height: 72, fontSize: 28 }}
                    >
                      {(user.nickname || user.username || "U")[0]}
                    </Avatar>
                    <Button variant="outlined" component="label">
                      프로필 사진 변경
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={handleAvatarChange}
                      />
                    </Button>
                  </Stack>

                  {/* 닉네임 */}
                  <TextField
                    label="닉네임"
                    fullWidth
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    sx={{ mb: 2 }}
                  />

                  {/* 자기소개 */}
                  <TextField
                    label="소개 (bio)"
                    fullWidth
                    multiline
                    minRows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    sx={{ mb: 3 }}
                  />

                  {/* 비밀번호 변경 섹션 */}
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: "bold", mb: 1 }}
                  >
                    비밀번호 변경
                  </Typography>
                  <TextField
                    label="새 비밀번호"
                    type="password"
                    fullWidth
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setNewPasswordError("");
                    }}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    label="새 비밀번호 확인"
                    type="password"
                    fullWidth
                    value={newPasswordConfirm}
                    onChange={(e) => {
                      setNewPasswordConfirm(e.target.value);
                      setNewPasswordError("");
                    }}
                    error={!!newPasswordError}
                    helperText={newPasswordError || " "}
                    sx={{ mb: 3 }}
                  />

                  <Stack
                    direction="row"
                    spacing={2}
                    justifyContent="flex-end"
                  >
                    <Button
                      variant="text"
                      onClick={() => navigate(-1)}
                      disabled={saving}
                    >
                      취소
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? "저장 중..." : "저장"}
                    </Button>
                  </Stack>
                </>
              )}
            </Paper>
          </Container>
        </Box>

        {/* 글쓰기 모달 */}
        <CreatePostDialog
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreated={handlePostCreated}
        />
      </Box>
    </Box>
  );
}

export default ProfileEditPage;
