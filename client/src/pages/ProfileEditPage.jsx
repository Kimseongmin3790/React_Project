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
import { updateProfile, uploadAvatar, verifyPassword } from "../api/userApi";

const API_BASE_URL = "http://localhost:3020";

function ProfileEditPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [saving, setSaving] = useState(false);

  // 🔐 진입 시 비밀번호 확인
  const [verified, setVerified] = useState(false);
  const [passwordCheck, setPasswordCheck] = useState("");
  const [passwordCheckError, setPasswordCheckError] = useState("");
  const [checking, setChecking] = useState(false);

  // 🔐 비밀번호 변경
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

  // 🔐 현재 비밀번호 확인
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
        setPasswordCheckError(res.message || "비밀번호가 일치하지 않습니다.");
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

    // 새 비밀번호 검증
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

  if (!user) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Typography>로그인 정보가 없습니다.</Typography>
      </Container>
    );
  }

  return (
    <Box sx={{ bgcolor: "#fafafa", minHeight: "100vh", py: 4 }}>
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
              <Stack direction="row" spacing={2} justifyContent="flex-end">
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

              <Stack direction="row" spacing={2} justifyContent="flex-end">
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
  );
}

export default ProfileEditPage;
