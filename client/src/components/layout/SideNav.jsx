// src/components/layout/SideNav.jsx
import React, { useState } from "react";
import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Menu,
  MenuItem,
  Switch,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import ChatIcon from "@mui/icons-material/Chat";
import AddBoxIcon from "@mui/icons-material/AddBox";
import PersonIcon from "@mui/icons-material/Person";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import LogoutIcon from "@mui/icons-material/Logout";
import SettingsIcon from "@mui/icons-material/Settings";
import DarkModeIcon from "@mui/icons-material/DarkMode";

import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "@mui/material/styles";
import { useColorMode } from "../../context/ColorModeContext";

function SideNav({ selectedMenu, onMenuClick }) {    
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { mode, toggleColorMode } = useColorMode();
  const theme = useTheme();

  const [moreAnchorEl, setMoreAnchorEl] = useState(null);
  const moreOpen = Boolean(moreAnchorEl);

  const handleClickItem = (key) => {
    if (key === "logout") {
      logout();
      window.location.href = "/login";
      return;
    }
    if (key === "more") {
      // 더보기 메뉴는 여기서만 처리 (드롭다운)
      return;
    }
    onMenuClick?.(key);
  };

  const handleOpenMore = (event) => {
    setMoreAnchorEl(event.currentTarget);
    onMenuClick?.("more");
  };
  const handleCloseMore = () => setMoreAnchorEl(null);

  return (
    <Box
      sx={{
        width: { xs: 72, md: 200 },
        bgcolor: theme.palette.customSide,
        color: theme.palette.text.primary,
        display: "flex",
        flexDirection: "column",
        position: "sticky",
        top: 0,
        alignSelf: "flex-start",
        height: "100vh",
        zIndex: 10,
      }}
    >
      {/* 로고 영역은 생략, 기존 코드 그대로 */}
      <Box
        sx={{
          px: { xs: 1, md: 2 },
          py: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: { xs: "center", md: "flex-start" },
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        <Box
          component="img"
          src="/GClipLogo.png"
          alt="GClip 로고"
          sx={{
            width: { xs: 40, md: 120 },
            height: "auto",
            borderRadius: 2,
            objectFit: "contain",
            color: "inherit"
          }}
          selected={selectedMenu === "main"}
          onClick={() => handleClickItem("main")}
        />
      </Box>

      <List sx={{ flexGrow: 1, p: 0 }}>
        <ListItemButton
          selected={selectedMenu === "main"}
          onClick={() => handleClickItem("main")}
          sx={{ color: "inherit" }}
        >
          <ListItemIcon sx={{ color: "inherit" }}>
            <HomeIcon />
          </ListItemIcon>
          <ListItemText primary="메인" sx={{ display: { xs: "none", md: "block" } }} />
        </ListItemButton>

        <ListItemButton
          selected={selectedMenu === "ranking"}
          onClick={() => handleClickItem("ranking")}
          sx={{ color: "inherit" }}
        >
          <ListItemIcon sx={{ color: "inherit" }}>
            <WhatshotIcon />
          </ListItemIcon>
          <ListItemText
            primary="인기 TOP 10 게임"
            sx={{ display: { xs: "none", md: "block" } }}
          />
        </ListItemButton>

        <ListItemButton
          selected={selectedMenu === "chat"}
          onClick={() => handleClickItem("chat")}
          sx={{ color: "inherit" }}
        >
          <ListItemIcon sx={{ color: "inherit" }}>
            <ChatIcon />
          </ListItemIcon>
          <ListItemText primary="실시간 채팅" sx={{ display: { xs: "none", md: "block" } }} />
        </ListItemButton>

        <ListItemButton
          selected={selectedMenu === "write"}
          onClick={() => handleClickItem("write")}
          sx={{ color: "inherit" }}
        >
          <ListItemIcon sx={{ color: "inherit" }}>
            <AddBoxIcon />
          </ListItemIcon>
          <ListItemText primary="글 쓰기" sx={{ display: { xs: "none", md: "block" } }} />
        </ListItemButton>

        <ListItemButton
          selected={selectedMenu === "profile"}
          onClick={() => handleClickItem("profile")}
          sx={{ color: "inherit" }}
        >
          <ListItemIcon sx={{ color: "inherit" }}>
            <PersonIcon />
          </ListItemIcon>
          <ListItemText primary="프로필" sx={{ display: { xs: "none", md: "block" } }} />
        </ListItemButton>

        {/* 🔥 더보기 */}
        <ListItemButton
          selected={selectedMenu === "more"}
          onClick={handleOpenMore}
          sx={{ color: "inherit" }}
        >
          <ListItemIcon sx={{ color: "inherit" }}>
            <MoreHorizIcon />
          </ListItemIcon>
          <ListItemText primary="더보기" sx={{ display: { xs: "none", md: "block" } }} />
        </ListItemButton>

        <ListItemButton onClick={() => handleClickItem("logout")} sx={{ color: "inherit" }}>
          <ListItemIcon sx={{ color: "inherit" }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="로그아웃" sx={{ display: { xs: "none", md: "block" } }} />
        </ListItemButton>
      </List>

      {/* 더보기 드롭다운 메뉴 */}
      <Menu
        anchorEl={moreAnchorEl}
        open={moreOpen}
        onClose={handleCloseMore}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        PaperProps={{
          sx: {
            ml: 1, // 사이드바 오른쪽에 붙게
          },
        }}
      >
        <MenuItem
          onClick={() => {
            navigate("/me/edit"); // 계정 설정 페이지
            handleCloseMore();
          }}
        >
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>계정 설정</ListItemText>
        </MenuItem>

        <MenuItem>
          <ListItemIcon>
            <DarkModeIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>다크 모드</ListItemText>
          <Switch
            edge="end"
            checked={mode === "dark"}
            onChange={toggleColorMode}
          />
        </MenuItem>
      </Menu>
    </Box>
  );
}

export default SideNav;
