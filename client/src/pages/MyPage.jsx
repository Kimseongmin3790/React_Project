import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Typography,
  IconButton,
  Avatar,
  Container,
  Card,
  CardContent,
  CardMedia,
  TextField,
  Button,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Menu,
  MenuItem
} from "@mui/material";

import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import ShareIcon from "@mui/icons-material/Share";
import MoreVertIcon from "@mui/icons-material/MoreVert";

import { io } from "socket.io-client";
import {
  getNotificationSummary,
  markAllNotificationsRead,
} from "../api/notificationApi";
import { useAuth } from "../context/AuthContext";
import { buildFileUrl } from "../utils/url";
import { 
  getFollowStats, 
  fetchFollowerList, 
  fetchFollowingList 
} from "../api/followApi";
import { useNavigate } from "react-router-dom";
import {
  likePost,
  unlikePost,
  bookmarkPost,
  unbookmarkPost,
  createComment,
  deletePost
} from "../api/postApi";
import {
  fetchMyPosts,
  fetchMyLikedPosts,
  fetchMyBookmarkedPosts,
} from "../api/userApi";
import PostDetailDialog from "../components/post/postDetail";
import CreatePostDialog from "../components/post/CreatePostDialog";
import MainHeader from "../components/layout/MainHeader";
import SideNav from "../components/layout/SideNav";
import CaptionWithHashtags from "../components/post/CaptionWithHashtags";
import EditPostDialog from "../components/post/EditPostDialog";
import MyStatsPanel from "../components/user/MyStatsPanel";
import { useGameList } from "../hooks/useGameList";

const API_ORIGIN = "http://localhost:3020";

function getMediaUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API_ORIGIN}${url}`;
}

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

function MyPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { gameList } = useGameList();

  const [selectedMenu, setSelectedMenu] = useState("profile");
  const [statsRefreshKey, setStatsRefreshKey] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [tab, setTab] = useState("posts");

  const [myPosts, setMyPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [bookmarkedPosts, setBookmarkedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailPostId, setDetailPostId] = useState(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

  const [commentInputs, setCommentInputs] = useState({});

  const [followStats, setFollowStats] = useState({
    followerCount: 0,
    followingCount: 0,
  });

  const [followerDialogOpen, setFollowerDialogOpen] = useState(false);
  const [followingDialogOpen, setFollowingDialogOpen] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [followings, setFollowings] = useState([]);
  const [followListLoading, setFollowListLoading] = useState(false);

  const [unreadTotal, setUnreadTotal] = useState(0);
  const [notifications, setNotifications] = useState([]);

  const [searchText, setSearchText] = useState("");

  const [postMenuAnchor, setPostMenuAnchor] = useState(null);
  const [postMenuTarget, setPostMenuTarget] = useState(null);

  // ───────── 공통 /me 데이터 로딩 ─────────
  const loadMyData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");

    try {
      const [posts, likes, bookmarks, follow] = await Promise.all([
        fetchMyPosts(),
        fetchMyLikedPosts(),
        fetchMyBookmarkedPosts(),
        getFollowStats(),
      ]);

      setMyPosts(posts || []);
      setLikedPosts(likes || []);
      setBookmarkedPosts(bookmarks || []);
      setFollowStats(follow);      
    } catch (err) {
      console.error("/me 데이터 로딩 실패:", err);
      setError("내 피드를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [user, reloadKey]);

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

  useEffect(() => {
    loadMyData();
  }, [loadMyData]);

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

  const handleTabChange = (e, value) => {
    setTab(value);
  };

  const openDetail = (postId) => {
    setDetailPostId(postId);
    setDetailOpen(true);
  };
  const closeDetail = () => {
    setDetailOpen(false);
    setDetailPostId(null);
  };

  const currentPosts =
    tab === "posts" ? myPosts : tab === "likes" ? likedPosts : bookmarkedPosts;

  const handleToggleLike = async (postId, currentIsLiked) => {
    try {
      if (currentIsLiked) {
        await unlikePost(postId);
      } else {
        await likePost(postId);
      }
      await loadMyData();
    } catch (err) {
      console.error("좋아요 토글 실패:", err);
    }
  };

  const handleToggleBookmark = async (postId, currentIsBookmarked) => {
    try {
      if (currentIsBookmarked) {
        await unbookmarkPost(postId);
      } else {
        await bookmarkPost(postId);
      }
      await loadMyData();
    } catch (err) {
      console.error("북마크 토글 실패:", err);
    }
  };

  const handleShare = (postId) => {
    const url = `${window.location.origin}/posts/${postId}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(
        () => {
          alert("게시글 링크가 클립보드에 복사되었습니다.");
        },
        () => {
          alert("복사에 실패했습니다. 직접 주소창의 주소를 복사해 주세요.");
        }
      );
    } else {
      alert("복사 기능을 지원하지 않는 브라우저입니다.");
    }
  };

  const handleChangeCommentInput = (postId, value) => {
    setCommentInputs((prev) => ({
      ...prev,
      [postId]: value,
    }));
  };

  const handleSubmitComment = async (postId) => {
    const text = (commentInputs[postId] || "").trim();
    if (!text) return;

    try {
      await createComment(postId, text);
      setCommentInputs((prev) => ({
        ...prev,
        [postId]: "",
      }));
      await loadMyData();
    } catch (err) {
      console.error("댓글 작성 실패:", err);
      alert("댓글 작성 중 오류가 발생했습니다.");
    }
  };

  const openFollowersDialog = async () => {
    if (!user) return;
    setFollowListLoading(true);
    try {
      const list = await fetchFollowerList(user.id);
      setFollowers(list || []);
      setFollowerDialogOpen(true);
    } catch (err) {
      console.error("팔로워 목록 불러오기 실패:", err);
      alert("팔로워 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setFollowListLoading(false);
    }
  };

  const openFollowingsDialog = async () => {
    if (!user) return;
    setFollowListLoading(true);
    try {
      const list = await fetchFollowingList(user.id);
      setFollowings(list || []);
      setFollowingDialogOpen(true);
    } catch (err) {
      console.error("팔로잉 목록 불러오기 실패:", err);
      alert("팔로잉 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setFollowListLoading(false);
    }
  };

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

  if (!user) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography>로그인이 필요합니다.</Typography>
      </Container>
    );
  }

  const myPostCount = myPosts.length;

  const handlePostUpdatedFromDetail = (updatedPost) => {
    setMyPosts((prev) =>
      prev.map((p) =>
        p.id === updatedPost.id
          ? {
              ...p,
              isLiked: updatedPost.isLiked,
              isBookmarked: updatedPost.isBookmarked,
              likeCount: updatedPost.likeCount,
              commentCount: updatedPost.commentCount,
            }
          : p
      )
    );
  };

  const handlePostCreated = () => {
    setReloadKey((k) => k + 1);

    setStatsRefreshKey((k) => k + 1);

    setCreateOpen(false);
  };

  const handleOpenPostMenu = (event, postId) => {
    setPostMenuAnchor(event.currentTarget);
    setPostMenuTarget(postId);
  };

  const handleClosePostMenu = () => {
    setPostMenuAnchor(null);
    setPostMenuTarget(null);
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("이 게시글을 삭제하시겠습니까?")) return;
    try {
      await deletePost(postId);
      await loadMyData();
    } catch (err) {
      console.error("마이페이지 삭제 실패:", err);
      alert("게시글 삭제 중 오류가 발생했습니다.");
    } finally {
      handleClosePostMenu();
    }
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
    setEditOpen(true);
    handleClosePostMenu();
  };

  const handlePostEditSaved = (updatedPost) => {
    setEditOpen(false);
    setEditingPost(null);

    if (!updatedPost) return;

    setMyPosts((prev) =>
      prev.map((p) =>
        p.id === updatedPost.id
          ? {
              ...p,
              caption: updatedPost.caption,
              gameId: updatedPost.gameId,
              gameName: updatedPost.gameName ?? p.gameName,
              gameSlug: updatedPost.gameSlug ?? p.gameSlug,
            }
          : p
      )
    );

    setReloadKey(k=>k+1)
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: (theme) => theme.palette.background.default }}>
      {/* ┌──────────────── 왼쪽 사이드바 ────────────────┐ */}
      <SideNav selectedMenu={selectedMenu} onMenuClick={handleMenuClick} />

      {/* ┌──────────────── 오른쪽 메인 영역 ────────────────┐ */}
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* 상단 헤더 */}
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

        {/* 메인 컨테이너 */}
        <Container
          maxWidth="md"
          sx={{
            flexGrow: 1,
            py: 3,
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          {/* 레벨 / 업적 패널 */}
          <MyStatsPanel refreshKey={statsRefreshKey} />

          {/* 내 프로필 헤더 */}
          <Card sx={{ p: 3 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                flexWrap: "wrap",
              }}
            >
              {/* 프로필 사진 */}
              <Avatar
                sx={{ width: 96, height: 96 }}
                src={buildFileUrl(user.avatarUrl) || ""}
              >
                {user.nickname?.[0] || user.username?.[0] || "U"}
              </Avatar>

              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                {/* username + 버튼 */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    flexWrap: "wrap",
                    mb: 2,
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    {user.username}
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => navigate("/me/edit")}
                    sx={{ textTransform: "none" }}
                  >
                    프로필 편집
                  </Button>
                </Box>

                {/* 게시글 / 팔로워 / 팔로우 숫자 */}
                <Box
                  sx={{
                    display: "flex",
                    gap: 3,
                    flexWrap: "wrap",
                    mb: 2,
                    fontSize: 14,
                  }}
                >
                  <Typography variant="body2">
                    게시글 <b>{myPostCount}</b>
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ cursor: "pointer" }}
                    onClick={openFollowersDialog}
                  >
                    팔로워 <b>{followStats.followerCount}</b>
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ cursor: "pointer" }}
                    onClick={openFollowingsDialog}
                  >
                    팔로우 <b>{followStats.followingCount}</b>
                  </Typography>
                </Box>

                {/* 닉네임 + 소개 */}
                {user.nickname && (
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: "bold", mb: 0.5 }}
                  >
                    {user.nickname}
                  </Typography>
                )}
                {user.bio && (
                  <Typography variant="body2">{user.bio}</Typography>
                )}
              </Box>
            </Box>
          </Card>

          {/* 탭: 작성한 글 / 좋아요 / 북마크 */}
          <Tabs
            value={tab}
            onChange={handleTabChange}
            sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}
          >
            <Tab label="작성한 글" value="posts" />
            <Tab label="좋아요한 글" value="likes" />
            <Tab label="북마크" value="bookmarks" />
          </Tabs>

          {loading && <Typography>피드를 불러오는 중...</Typography>}
          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}

          {!loading && currentPosts.length === 0 && !error && (
            <Card>
              <CardContent>
                <Typography variant="body1">
                  {tab === "posts"
                    ? "작성한 게시글이 없습니다."
                    : tab === "likes"
                    ? "좋아요한 게시글이 없습니다."
                    : "북마크한 게시글이 없습니다."}
                </Typography>
              </CardContent>
            </Card>
          )}

          
          {/* 피드 카드들 */}
          {currentPosts.map((post) => {
            const liked = tab === "likes" ? true : !!post.isLiked;
            const bookmarked = tab === "bookmarks" ? true : !!post.isBookmarked;
            const name = post.nickname || post.username || "U";
            const caption = post.caption || "";
            const captionTooLong = caption.length > 50;
            const isMyPost = user && post.userId === user.id;          
            const targetPost = postMenuTarget && currentPosts.find((p) => p.id === postMenuTarget);

            return (
              <Card key={post.id}>
                {/* 1) 위쪽 영역 */}
                <Box
                  sx={{
                    px: 2,
                    pt: 1.5,
                    pb: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    bgcolor: (theme) => theme.palette.action.hover, p: 2,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Avatar
                      sx={{ width: 28, height: 28 }}
                      src={buildFileUrl(post.avatarUrl) || ""}
                    >
                      {name[0]}
                    </Avatar>
                    <Box>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: "bold" }}
                      >
                        {name}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary" }}
                      >
                        {post.gameName}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Typography variant="caption">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </Typography>
                    {isMyPost && (
                      <IconButton
                        size="small"
                        onClick={(e) => handleOpenPostMenu(e, post.id)}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </Box>

                {/* 2) 썸네일 */}
                {post.thumbnailUrl && (
                  <CardMedia
                    component={post.thumbType === "VIDEO" ? "video" : "img"}
                    src={getMediaUrl(post.thumbnailUrl)}
                    controls={post.thumbType === "VIDEO"}
                    sx={{ maxHeight: 400 }}
                  />
                )}

                <CardContent sx={{ p: 0 }}>
                  {/* 좋아요 / 북마크 / 공유 */}
                  <Box
                    sx={{
                      px: 1,
                      py: 0.5,
                      bgcolor: (theme) => theme.palette.action.hover, p: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      gap: 0.5,
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={() => handleToggleLike(post.id, liked)}
                    >
                      {liked ? (
                        <FavoriteIcon color="error" fontSize="small" />
                      ) : (
                        <FavoriteBorderIcon fontSize="small" />
                      )}
                    </IconButton>

                    <IconButton
                      size="small"
                      onClick={() =>
                        handleToggleBookmark(post.id, bookmarked)
                      }
                    >
                      {bookmarked ? (
                        <BookmarkIcon fontSize="small" />
                      ) : (
                        <BookmarkBorderIcon fontSize="small" />
                      )}
                    </IconButton>

                    <IconButton
                      size="small"
                      onClick={() => handleShare(post.id)}
                    >
                      <ShareIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  <Box sx={{ px: 2, pt: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: "bold" }}
                    >
                      좋아요 {post.likeCount ?? 0}개
                    </Typography>
                  </Box>

                  {/* 캡션 */}
                  <Box
                    sx={{
                      px: 2,
                      pt: 0.5,
                      pb: 0.5,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: "bold",
                        mr: 1,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {name}
                    </Typography>

                    <Box sx={{ flexGrow: 1, overflow: "hidden" }}>
                      <Typography
                        variant="body2"
                        sx={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          wordBreak: "break-all",
                        }}
                      >
                        <CaptionWithHashtags text={caption} />
                      </Typography>
                    </Box>

                    {captionTooLong && (
                      <Button
                        size="small"
                        onClick={() => openDetail(post.id)}
                        sx={{
                          textTransform: "none",
                          ml: 1,
                          p: 0,
                          minWidth: "auto",
                          fontSize: "0.8rem",
                          whiteSpace: "nowrap",
                        }}
                      >
                        더보기
                      </Button>
                    )}
                  </Box>

                  {/* 댓글 모두 보기 */}
                  <Box
                    sx={{
                      px: 2,
                      pb: 0.5,
                    }}
                  >
                    <Button
                      size="small"
                      onClick={() => openDetail(post.id)}
                      sx={{ textTransform: "none", p: 0, minWidth: 0 }}
                    >
                      댓글 {post.commentCount ?? 0}개 모두보기
                    </Button>
                  </Box>

                  {/* 댓글 입력창 */}
                  <Box
                    sx={{
                      px: 2,
                      pt: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      borderTop: "1px solid #e0e0e0",
                    }}
                  >
                    <TextField
                      size="small"
                      placeholder="댓글 달기..."
                      value={commentInputs[post.id] || ""}
                      onChange={(e) =>
                        handleChangeCommentInput(post.id, e.target.value)
                      }
                      fullWidth
                    />
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleSubmitComment(post.id)}
                      disabled={!(commentInputs[post.id] || "").trim()}
                      sx={{ whiteSpace: "nowrap" }}
                    >
                      등록
                    </Button>
                  </Box>
                </CardContent>
                <Menu
                  anchorEl={postMenuAnchor}
                  open={Boolean(postMenuAnchor) && !!targetPost}
                  onClose={handleClosePostMenu}
                >
                  {targetPost && (
                    <>
                      <MenuItem onClick={() => handleEditPost(targetPost)}>수정</MenuItem>
                      <MenuItem onClick={() => handleDeletePost(targetPost.id)}>삭제</MenuItem>
                    </>
                  )}
                </Menu>
              </Card>
            );
          })}

          <PostDetailDialog
            open={detailOpen}
            onClose={closeDetail}
            postId={detailPostId}
            gameList={gameList}
            onPostUpdated={handlePostUpdatedFromDetail}
          />

          <EditPostDialog
            open={editOpen}
            post={editingPost}
            gameList={gameList}
            onClose={() => {
              setEditOpen(false);
              setEditingPost(null);
            }}
            onSaved={handlePostEditSaved}
          />

          <CreatePostDialog
            open={createOpen}
            onClose={() => setCreateOpen(false)}
            onCreated={handlePostCreated}
          />

          {/* 팔로워 목록 모달 */}
          <Dialog
            open={followerDialogOpen}
            onClose={() => setFollowerDialogOpen(false)}
            fullWidth
            maxWidth="xs"
          >
            <DialogTitle>팔로워</DialogTitle>
            <DialogContent dividers>
              {followListLoading && (
                <Typography variant="body2">불러오는 중...</Typography>
              )}
              {!followListLoading && followers.length === 0 && (
                <Typography variant="body2">
                  아직 팔로워가 없습니다.
                </Typography>
              )}
              <List>
                {followers.map((u) => (
                  <ListItemButton
                    key={u.id}
                    onClick={() => {
                      setFollowerDialogOpen(false);
                      navigate(`/users/${u.id}`);
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar src={buildFileUrl(u.avatarUrl) || ""}>
                        {u.nickname?.[0] || u.username?.[0] || "U"}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={u.nickname || u.username}
                      secondary={`@${u.username}`}
                    />
                  </ListItemButton>
                ))}
              </List>
            </DialogContent>
          </Dialog>

          {/* 팔로우(팔로잉) 목록 모달 */}
          <Dialog
            open={followingDialogOpen}
            onClose={() => setFollowingDialogOpen(false)}
            fullWidth
            maxWidth="xs"
          >
            <DialogTitle>팔로우</DialogTitle>
            <DialogContent dividers>
              {followListLoading && (
                <Typography variant="body2">불러오는 중...</Typography>
              )}
              {!followListLoading && followings.length === 0 && (
                <Typography variant="body2">
                  아직 팔로우한 유저가 없습니다.
                </Typography>
              )}
              <List>
                {followings.map((u) => (
                  <ListItemButton
                    key={u.id}
                    onClick={() => {
                      setFollowingDialogOpen(false);
                      navigate(`/users/${u.id}`);
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar src={buildFileUrl(u.avatarUrl) || ""}>
                        {u.nickname?.[0] || u.username?.[0] || "U"}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={u.nickname || u.username}
                      secondary={`@${u.username}`}
                    />
                  </ListItemButton>
                ))}
              </List>
            </DialogContent>
          </Dialog>

        </Container>
      </Box>
    </Box>
  );
}

export default MyPage;
