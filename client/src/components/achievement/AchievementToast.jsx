// src/components/achievement/AchievementToast.jsx
import React from "react";
import {
  Snackbar,
  Alert,
  Box,
  Avatar,
  Typography,
  Stack,
} from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";

function AchievementToast({ open, onClose, achievement, count = 1 }) {
  if (!achievement) return null;

  return (
    <Snackbar
      open={open}
      autoHideDuration={5000}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
    >
      <Alert
        onClose={onClose}
        severity="success"
        icon={<EmojiEventsIcon fontSize="inherit" />}
        sx={{
          width: "100%",
          alignItems: "flex-start",
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            src={achievement.icon_url || ""}
            sx={{ width: 40, height: 40 }}
          >
            {!achievement.icon_url && <EmojiEventsIcon />}
          </Avatar>

          <Box>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: "bold", mb: 0.3 }}
            >
              🎉 새 업적 달성!
              {count > 1 && ` 외 ${count - 1}개`}
            </Typography>

            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {achievement.name}
            </Typography>

            {achievement.description && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.3 }}
              >
                {achievement.description}
              </Typography>
            )}
          </Box>
        </Stack>
      </Alert>
    </Snackbar>
  );
}

export default AchievementToast;
