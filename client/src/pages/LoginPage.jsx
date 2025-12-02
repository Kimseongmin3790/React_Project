import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { login as loginApi, resetPassword } from "../api/authApi";
import { useAuth } from "../context/AuthContext";

function LoginPage() {
  const navigate = useNavigate();
  const { user, initialized, login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotResult, setForgotResult] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  // 이미 로그인된 상태면 메인으로 리다이렉트
  if (initialized && user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await loginApi({ email, password });
      login(data.token, data.user);
      navigate("/");
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message || "로그인 중 오류가 발생했습니다.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const goRegister = () => {
    navigate("/register");
  };

  // 비밀번호 찾기 열기
  const handleOpenForgot = () => {
    setForgotEmail(email);
    setForgotResult("");
    setForgotOpen(true);
  };

  const handleCloseForgot = () => {
    setForgotOpen(false);
  };

  // 비밀번호 찾기 제출 (임시 비밀번호 발급)
  const handleSubmitForgot = async () => {
    if (!forgotEmail.trim()) {
      setForgotResult("이메일을 입력해주세요.");
      return;
    }

    setForgotLoading(true);
    setForgotResult("");

    try {      
      const res = await resetPassword(forgotEmail);
      if (res.ok) {
        setForgotResult(
          `임시 비밀번호: ${res.tempPassword}\n로그인 후 마이페이지에서 비밀번호를 변경해주세요.`
        );
      } else {
        setForgotResult(res.message || "비밀번호 재설정에 실패했습니다.");
      }
    } catch (err) {
      console.error("resetPassword error:", err);

      const status = err.response?.status;
      const msgFromServer = err.response?.data?.message;

      if (status == 404) {
        setForgotResult(msgFromServer || "가입되지 않은 이메일입니다.");
      } else {
        setForgotResult(msgFromServer || "비밀번호 재설정 중 오류가 발생했습니다.");
      }
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#fafafa",
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: 360,
          p: 4,
          borderRadius: 3,
        }}
      >
        <Typography
          variant="h5"
          align="center"
          sx={{ fontWeight: "bold", mb: 3 }}
        >
          GClip 로그인
        </Typography>

        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              label="이메일"
              type="email"
              size="small"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="비밀번호"
              type="password"
              size="small"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
            />

            {error && (
              <Typography variant="body2" color="error">
                {error}
              </Typography>
            )}

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
            >
              {loading ? "로그인 중..." : "로그인"}
            </Button>

            {/* 비밀번호 찾기 버튼 */}
            <Button
              variant="text"
              size="small"
              onClick={handleOpenForgot}
              sx={{ textTransform: "none", alignSelf: "flex-end" }}
            >
              비밀번호 찾기
            </Button>
          </Stack>
        </form>

        <Box sx={{ mt: 2, textAlign: "center" }}>
          <Typography variant="body2">
            아직 회원이 아니신가요?{" "}
            <Button variant="text" size="small" onClick={goRegister}>
              회원가입
            </Button>
          </Typography>
        </Box>
      </Paper>

      {/* 비밀번호 찾기 Dialog */}
      <Dialog open={forgotOpen} onClose={handleCloseForgot} fullWidth maxWidth="xs">
        <DialogTitle>비밀번호 찾기</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="가입한 이메일"
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              fullWidth
            />
            {forgotResult && (
              <Typography
                variant="body2"
                sx={{ whiteSpace: "pre-line" }}
                color={
                  forgotResult.startsWith("임시 비밀번호")
                    ? "primary"
                    : "error"
                }
              >
                {forgotResult}
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseForgot}>닫기</Button>
          <Button
            onClick={handleSubmitForgot}
            disabled={forgotLoading}
            variant="contained"
          >
            {forgotLoading ? "처리 중..." : "임시 비밀번호 발급"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default LoginPage;
