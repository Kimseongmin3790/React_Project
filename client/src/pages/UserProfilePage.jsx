import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Card,
  Avatar,
  Typography,
  Button,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SideNav from "../components/layout/SideNav";
import MainHeader from "../components/layout/MainHeader";
import { buildFileUrl } from "../utils/url";
import { fetchUserProfile, fetchUserPosts } from "../api/userApi";
import {
  followUser,
  unfollowUser,
  getUserRelation,
  fetchFollowerList,
  fetchFollowingList,
} from "../api/followApi";
import { markAllNotificationsRead, getNotificationSummary } from "../api/notificationApi";
import PostDetailDialog from "../components/post/postDetail";
import CreatePostDialog from "../components/post/CreatePostDialog";
import { io } from "socket.io-client";

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

function UserProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { userId } = useParams();

  const [unreadTotal, setUnreadTotal] = useState(0);
  const [notifications, setNotifications] = useState([]);

  const [searchText, setSearchText] = useState("");

  const [selectedMenu, setSelectedMenu] = useState("profile");
  const [createOpen, setCreateOpen] = useState(false);

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({
    postCount: 0,
    followerCount: 0,
    followingCount: 0,
  });

  const [relation, setRelation] = useState({
    isMe: false,
    isFollowing: false,
    isFollower: false,
  });

  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [error, setError] = useState("");

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailPostId, setDetailPostId] = useState(null);

  const handleMenuClick = (key) => {
    setSelectedMenu(key);
    if (key === "main") navigate("/");
    else if (key === "explore") navigate("/explore");
    else if (key === "ranking") navigate("/ranking");
    else if (key === "chat") navigate("/chat");
    else if (key === "write") setCreateOpen(true);
    else if (key === "profile") navigate("/me");
    else if (key === "logout") {
      logout();
      window.location.href = "/login";
    }
  };

  const openDetail = (postId) => {
    setDetailPostId(postId);
    setDetailOpen(true);
  };

  const closeDetail = () => {
    setDetailPostId(null);
    setDetailOpen(false);
  };

  useEffect(() => {
    if (!userId) return;

    if (user && String(user.id) === String(userId)) {
      navigate("/me", { replace: true });
      return;
    }

    (async () => {
      setLoading(true);
      setError("");
      try {
        const [p, postList, rel, followers, followings] = await Promise.all([
          fetchUserProfile(userId),
          fetchUserPosts(userId),
          getUserRelation(userId),
          fetchFollowerList(userId),
          fetchFollowingList(userId),
        ]);

        setProfile(p || null);
        setPosts(postList || []);

        setStats({
          postCount: (postList || []).length,
          followerCount: (followers || []).length,
          followingCount: (followings || []).length,
        });

        setRelation({
          isMe: rel?.isMe || false,
          isFollowing: rel?.isFollowing || false,
          isFollower: rel?.isFollower || false,
        });
      } catch (err) {
        console.error("UserProfilePage load error:", err);
        setError("프로필을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, [userId, user, navigate]);

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

  const handleToggleFollow = async () => {
    if (!user || !profile || relation.isMe) return;
    if (followLoading) return;

    setFollowLoading(true);
    try {
      if (relation.isFollowing) {
        await unfollowUser(profile.id);
        setRelation((prev) => ({ ...prev, isFollowing: false }));
        setStats((prev) => ({
          ...prev,
          followerCount: Math.max(0, prev.followerCount - 1),
        }));
      } else {
        await followUser(profile.id);
        setRelation((prev) => ({ ...prev, isFollowing: true }));
        setStats((prev) => ({
          ...prev,
          followerCount: prev.followerCount + 1,
        }));
      }
    } catch (err) {
      console.error("팔로우 토글 실패:", err);
      alert("팔로우 처리 중 오류가 발생했습니다.");
    } finally {
      setFollowLoading(false);
    }
  };

  if (!user) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography>로그인이 필요합니다.</Typography>
      </Container>
    );
  }

  const handlePostUpdatedFromDetail = (updatedPost) => {
    setPosts((prev) =>
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

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#fafafa" }}>
      {/* 왼쪽 사이드바 */}
      <SideNav selectedMenu={selectedMenu} onMenuClick={handleMenuClick} />

      {/* 오른쪽 메인 영역 */}
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
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

        <Container maxWidth="md" sx={{ py: 3 }}>
          {loading && <Typography>프로필을 불러오는 중...</Typography>}
          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}

          {/* 상단 프로필 헤더 */}
          {profile && (
            <Card
              sx={{
                p: 3,
                mb: 4,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Avatar
                sx={{ width: 120, height: 120 }}
                src={buildFileUrl(profile.avatarUrl) || ""}
              >
                {profile.nickname?.[0] || profile.username?.[0] || "U"}
              </Avatar>

              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  {profile.username}
                </Typography>
                {profile.nickname && (
                  <Typography variant="subtitle2" sx={{ mt: 0.5 }}>
                    {profile.nickname}
                  </Typography>
                )}
                {profile.bio && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {profile.bio}
                  </Typography>
                )}
              </Box>

              <Box
                sx={{
                  display: "flex",
                  gap: 4,
                  flexWrap: "wrap",
                  justifyContent: "center",
                  mt: 1,
                  fontSize: 14,
                }}
              >
                <Typography variant="body2">
                  게시글 <b>{stats.postCount}</b>
                </Typography>
                <Typography variant="body2">
                  팔로워 <b>{stats.followerCount}</b>
                </Typography>
                <Typography variant="body2">
                  팔로우 <b>{stats.followingCount}</b>
                </Typography>
              </Box>

              {!relation.isMe && (
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant={relation.isFollowing ? "outlined" : "contained"}
                    color={relation.isFollowing ? "inherit" : "primary"}
                    size="medium"
                    disabled={followLoading}
                    onClick={handleToggleFollow}
                    sx={{ px: 6, textTransform: "none", borderRadius: 999 }}
                  >
                    {followLoading
                      ? "처리 중..."
                      : relation.isFollowing
                      ? "팔로잉"
                      : "팔로우"}
                  </Button>
                </Box>
              )}
            </Card>
          )}

          {/* 아래: 이 유저가 올린 피드 그리드 */}
          {!loading && profile && (
            <>
              {posts.length === 0 ? (
                <Typography align="center">
                  아직 게시글이 없습니다.
                </Typography>
              ) : (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "repeat(3, 1fr)",
                    },
                    gap: 0.5,
                  }}
                >
                  {posts.map((post) => (
                    <Box
                      key={post.id}
                      sx={{
                        position: "relative",
                        width: "100%",
                        aspectRatio: "1 / 1",
                        overflow: "hidden",
                        cursor: "pointer",
                        bgcolor: "#ddd",
                      }}
                      onClick={() => openDetail(post.id)}
                    >
                      {post.thumbUrl && (
                        <Box
                          component={
                            post.thumbType === "VIDEO" ? "video" : "img"
                          }
                          src={
                            post.thumbUrl.startsWith("http")
                              ? post.thumbUrl
                              : `${process.env.REACT_APP_API_ORIGIN ||
                                  "http://localhost:3020"}${post.thumbUrl}`
                          }
                          controls={post.thumbType === "VIDEO"}
                          sx={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      )}
                    </Box>
                  ))}
                </Box>
              )}
            </>
          )}

          {/* 게시글 상세 모달 */}
          <PostDetailDialog
            open={detailOpen}
            onClose={closeDetail}
            postId={detailPostId}
            onPostUpdated={handlePostUpdatedFromDetail}
          />

          {/* 글쓰기 모달 */}
          <CreatePostDialog
            open={createOpen}
            onClose={() => setCreateOpen(false)}
          />
        </Container>
      </Box>
    </Box>
  );
}

export default UserProfilePage;
