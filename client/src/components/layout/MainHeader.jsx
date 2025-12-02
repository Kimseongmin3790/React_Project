import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  IconButton,
  Avatar,
  TextField,
  Badge,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  LinearProgress,
} from "@mui/material";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import ArticleIcon from "@mui/icons-material/Article";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import { buildFileUrl } from "../../utils/url";
import { useTheme } from "@mui/material/styles";
import { fetchMyStats } from "../../api/userApi";

function MainHeader({
  user,
  unreadTotal = 0,
  notifications = [],
  onNotificationClick,
  onNotificationsOpened,
  onClickLogo,
  onClickProfile,
  showSearch = false,
  searchPlaceholder = "검색",
  searchValue = "",
  onChangeSearch,
  onSearchSubmit,
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const theme = useTheme();

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // 로그인 유저 바뀔 때마다 내 스탯 한 번 조회
  useEffect(() => {
    if (!user) {
      setStats(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setStatsLoading(true);
        const data = await fetchMyStats();
        if (!cancelled) setStats(data.stats);
      } catch (err) {
        console.error("MainHeader fetchMyStats error:", err);
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const level = stats?.level ?? 1;
  const exp = stats?.exp ?? 0;
  const currentExp = exp % 100;
  const levelPercent = Math.min(100, (currentExp / 100) * 100);

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
    if (onNotificationsOpened) {
      onNotificationsOpened();
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleItemClick = (n) => {
    handleClose();
    if (onNotificationClick) {
      onNotificationClick(n);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && onSearchSubmit) {
      onSearchSubmit(searchValue);
    }
  };

  return (
    <>
      {/* 상단 바 */}
      <Box
        sx={{
          bgcolor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          px: 3,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          borderBottom: (t) => `1px solid ${t.palette.divider}`,
          position: "sticky",
          top: 0,
          zIndex: 1100,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: "bold",
            cursor: onClickLogo ? "pointer" : "default",
            mr: 2,
          }}
          onClick={onClickLogo}
        >
          GClip
        </Typography>

        {showSearch && (
          <Box sx={{ flexGrow: 1, mx: 3, maxWidth: 500 }}>
            <TextField
              size="small"
              placeholder={searchPlaceholder}
              fullWidth
              variant="outlined"
              value={searchValue}
              onChange={onChangeSearch}
              onKeyDown={handleKeyDown}
              InputProps={{
                sx: {
                  bgcolor:
                    theme.palette.mode === "light"
                      ? theme.palette.background.default
                      : theme.palette.grey[900],
                  borderRadius: 5,
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "transparent",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "transparent",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: theme.palette.primary.main,
                  },
                },
              }}
            />
          </Box>
        )}

        {/* 오른쪽 아이콘/프로필/레벨 */}
        <Box
          sx={{
            ml: "auto",
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          {/* 알림 버튼 + 배지 */}
          <IconButton color="inherit" onClick={handleOpen}>
            <Badge
              color="error"
              variant={unreadTotal > 0 ? "standard" : "dot"}
              badgeContent={unreadTotal > 0 ? unreadTotal : null}
            >
              <NotificationsNoneIcon />
            </Badge>
          </IconButton>

          {/* 프로필 이미지 */}
          <IconButton color="inherit" onClick={onClickProfile}>
            <Avatar
              sx={{ width: 32, height: 32 }}
              src={buildFileUrl(user?.avatarUrl) || ""}
            >
              {user?.nickname?.[0] || user?.username?.[0] || "U"}
            </Avatar>
          </IconButton>

          {/* 프로필 오른쪽에 레벨/EXP 표시 */}
          {user && stats && (
            <Box
              sx={{
                display: { xs: "none", sm: "flex" },
                flexDirection: "column",
                alignItems: "flex-start",
                minWidth: 120,
                maxWidth: 180,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: "bold", lineHeight: 1.2 }}
                >
                  Lv. {level}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary", lineHeight: 1.2 }}
                >
                  {exp} EXP
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={levelPercent}
                sx={{
                  mt: 0.4,
                  width: "100%",
                  height: 4,
                  borderRadius: 999,
                }}
              />
            </Box>
          )}
        </Box>
      </Box>

      {/* 알림 드롭다운 메뉴 */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            width: 320,
            maxHeight: 400,
            bgcolor: theme.palette.background.paper,
          },
        }}
      >
        {/* 헤더 */}
        <Box
          sx={{
            px: 2,
            py: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
            알림
          </Typography>
          {notifications.length > 0 && (
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              최근 {notifications.length}개
            </Typography>
          )}
        </Box>
        <Divider />

        {/* 내용 */}
        {notifications.length === 0 ? (
          <MenuItem disabled>
            <ListItemText primary="새 알림이 없습니다." />
          </MenuItem>
        ) : (
          notifications.map((n, idx) => {
            const isChat = n.type === "CHAT_MESSAGE";
            const isPost =
              n.type === "FOLLOWED_USER_POST" || n.type === "FOLLOWED_POST";

            let primary, secondary;
            if (isChat) {
              primary = "새 채팅 메시지";
              secondary = n.message || "채팅에서 새 메시지가 도착했습니다.";
            } else if (isPost) {
              primary = "팔로우한 유저의 새 글";
              secondary = n.message || "새 게시글이 등록되었습니다.";
            } else {
              primary = "알림";
              secondary = n.message || "";
            }

            const createdAtText = n.createdAt
              ? new Date(n.createdAt).toLocaleString()
              : "";

            return (
              <MenuItem
                key={
                  n.id ||
                  `${n.type}-${idx}-${n.postId || n.roomId || createdAtText}`
                }
                onClick={() => handleItemClick(n)}
                sx={{ alignItems: "flex-start", whiteSpace: "normal" }}
              >
                <ListItemIcon sx={{ mt: 0.5, minWidth: 32, color: "inherit" }}>
                  {isChat ? (
                    <ChatBubbleOutlineIcon fontSize="small" />
                  ) : isPost ? (
                    <ArticleIcon fontSize="small" />
                  ) : (
                    <NotificationsActiveIcon fontSize="small" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                      {primary}
                    </Typography>
                  }
                  secondary={
                    <>
                      {secondary && (
                        <Typography
                          variant="body2"
                          sx={{
                            display: "block",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {secondary}
                        </Typography>
                      )}
                      {createdAtText && (
                        <Typography
                          variant="caption"
                          sx={{
                            display: "block",
                            color: "text.secondary",
                            mt: 0.5,
                          }}
                        >
                          {createdAtText}
                        </Typography>
                      )}
                    </>
                  }
                />
              </MenuItem>
            );
          })
        )}
      </Menu>
    </>
  );
}

export default MainHeader;
