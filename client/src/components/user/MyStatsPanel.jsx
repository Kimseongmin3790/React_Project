// src/components/user/MyStatsPanel.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
  Stack,
  Tooltip,
} from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { useTheme } from "@mui/material/styles";
import { fetchMyStats } from "../../api/userApi";

function MyStatsPanel({ refreshKey = 0 }) {
  const theme = useTheme();
  const [stats, setStats] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");
        const data = await fetchMyStats();
        setStats(data.stats);
        setAchievements(data.achievements || []);
      } catch (err) {
        console.error("fetchMyStats error:", err);
        setError("레벨 / 업적 정보를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshKey]);

  if (loading) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="body2">레벨 정보를 불러오는 중...</Typography>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <Card
      sx={{
        mb: 3,
        borderRadius: 3,
        background:
          theme.palette.mode === "dark"
            ? "linear-gradient(135deg, #1e293b, #020617)"
            : "linear-gradient(135deg, #e3f2fd, #fff)",
      }}
    >
      <CardContent>
        {/* 상단: 레벨 + 경험치 게이지 */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={2}
          sx={{ mb: 2 }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Chip
              label={`Lv. ${stats.level}`}
              color="primary"
              sx={{ fontWeight: "bold", fontSize: 16 }}
            />
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              EXP {stats.exp} / {stats.expForNextLevel}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={2}>
            <Typography variant="body2">
              게시글{" "}
              <b>
                {stats.postCount}
              </b>
            </Typography>
            <Typography variant="body2">
              받은 좋아요{" "}
              <b>
                {stats.receivedLikes}
              </b>
            </Typography>
            <Typography variant="body2">
              받은 댓글{" "}
              <b>
                {stats.receivedComments}
              </b>
            </Typography>
          </Stack>
        </Stack>

        {/* 경험치 진행 바 */}
        <Box sx={{ mb: 2 }}>
          <LinearProgress
            variant="determinate"
            value={stats.expProgressPercent}
            sx={{ height: 10, borderRadius: 5 }}
          />
          <Typography
            variant="caption"
            sx={{ mt: 0.5, display: "block", textAlign: "right" }}
          >
            다음 레벨까지 {100 - stats.expProgressPercent}% 남음
          </Typography>
        </Box>

        {/* 업적 뱃지 */}
        <Box>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <EmojiEventsIcon fontSize="small" color="warning" />
            <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
              획득한 업적
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              {achievements.length}개
            </Typography>
          </Stack>

          {achievements.length === 0 ? (
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              아직 획득한 업적이 없습니다. 열심히 활동해 보세요!
            </Typography>
          ) : (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {achievements.map((a) => (
                <Tooltip
                  key={a.achievement_id}
                  title={
                    <>
                      <div>{a.description}</div>
                      {a.unlocked_at && (
                        <div style={{ fontSize: 11, marginTop: 2 }}>
                          획득일:{" "}
                          {new Date(a.unlocked_at).toLocaleDateString()}
                        </div>
                      )}
                    </>
                  }
                  arrow
                >
                  <Chip
                    icon={<EmojiEventsIcon fontSize="small" />}
                    label={a.name}
                    size="small"
                    color="warning"
                    variant="outlined"
                    sx={{ borderRadius: 999 }}
                  />
                </Tooltip>
              ))}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

export default MyStatsPanel;

