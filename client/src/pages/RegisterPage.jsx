import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Stack,
} from "@mui/material";
import { register } from "../api/authApi";

function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
    username: "",
    nickname: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await register(form);
      // data = { message, token, user }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate("/login");
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message || "회원가입 중 오류가 발생했습니다.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const goLogin = () => {
    navigate("/login");
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
          Gamegram 회원가입
        </Typography>

        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              label="이메일"
              type="email"
              size="small"
              value={form.email}
              onChange={handleChange("email")}
              required
              fullWidth
            />
            <TextField
              label="비밀번호"
              type="password"
              size="small"
              value={form.password}
              onChange={handleChange("password")}
              required
              fullWidth
            />
            <TextField
              label="아이디 (username)"
              size="small"
              value={form.username}
              onChange={handleChange("username")}
              required
              fullWidth
            />
            <TextField
              label="닉네임"
              size="small"
              value={form.nickname}
              onChange={handleChange("nickname")}
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
              {loading ? "회원가입 중..." : "회원가입"}
            </Button>
          </Stack>
        </form>

        <Box sx={{ mt: 2, textAlign: "center" }}>
          <Typography variant="body2">
            이미 계정이 있으신가요?{" "}
            <Button variant="text" size="small" onClick={goLogin}>
              로그인
            </Button>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}

export default RegisterPage;
