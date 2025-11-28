const express = require('express')
const bcrypt = require('bcrypt')
const router = express.Router()
const db = require("../db")
const authMiddleware = require("../middleware/auth");
const path = require("path");
const multer = require("multer");
const userController = require("../controllers/userController");

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads/avatar"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname); // .jpg, .png 등
    const filename = `avatar-${req.user.id}-${Date.now()}${ext}`;
    cb(null, filename);
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("이미지 파일만 업로드할 수 있습니다."));
    }
    cb(null, true);
  },
});

// GET /api/users/search?q=검색어
router.get("/search", authMiddleware, async (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) {
    return res.json({ users: [] });
  }

  try {
    const like = `%${q}%`;
    const [rows] = await db.query(
      `
      SELECT
        id,
        username,
        nickname,
        avatar_url AS avatarUrl
      FROM users
      WHERE username LIKE ? OR nickname LIKE ?
      ORDER BY nickname IS NULL, nickname, username
      LIMIT 20
      `,
      [like, like]
    );

    res.json({ users: rows });
  } catch (err) {
    console.error("GET /api/users/search error:", err);
    res.status(500).json({ message: "사용자 검색 중 오류가 발생했습니다." });
  }
});

// 내 정보
router.patch("/me", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { nickname, bio, newPassword } = req.body;

  try {
    const fields = [];
    const params = [];

    if (nickname !== undefined) {
      fields.push("nickname = ?");
      params.push(nickname ?? null);
    }

    if (bio !== undefined) {
      fields.push("bio = ?");
      params.push(bio ?? null);
    }

    // 새 비밀번호가 들어온 경우에만 비번 변경
    if (newPassword) {
      const hash = await bcrypt.hash(newPassword, 10);
      fields.push("password_hash = ?");
      params.push(hash);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: "변경할 항목이 없습니다." });
    }

    params.push(userId);

    await db.query(
      `
      UPDATE users
      SET ${fields.join(", ")}
      WHERE id = ?
      `,
      params
    );

    const [rows] = await db.query(
      `
      SELECT
        id,
        username,
        nickname,
        avatar_url AS avatarUrl,
        bio
      FROM users
      WHERE id = ?
      `,
      [userId]
    );

    const user = rows[0];

    res.json({ user });
  } catch (err) {
    console.error("PATCH /api/users/me error:", err);
    res.status(500).json({ message: "프로필 수정 중 오류가 발생했습니다." });
  }
});

// 프로필사진 수정
router.post("/me/avatar", authMiddleware, avatarUpload.single("avatar"), async (req, res) => {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ message: "파일이 업로드되지 않았습니다." });
    }

    try {
      // DB에는 상대 경로만 저장 (예: /uploads/avatar/파일명)
      const relativePath = `/uploads/avatar/${req.file.filename}`;

      await db.query(
        `
        UPDATE users
        SET avatar_url = ?
        WHERE id = ?
        `,
        [relativePath, userId]
      );

      const [rows] = await db.query(
        `
        SELECT
          id,
          username,
          nickname,
          avatar_url AS avatarUrl,
          bio
        FROM users
        WHERE id = ?
        `,
        [userId]
      );

      const user = rows[0];

      res.json({ user });
    } catch (err) {
      console.error("POST /api/users/me/avatar error:", err);
      res.status(500).json({ message: "프로필 사진 업로드 중 오류가 발생했습니다." });
    }
  }
);

// 내가 작성한 글
router.get("/me/posts", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
    const [rows] = await db.query(
      `
      SELECT
        p.id,
        p.user_id AS userId,
        u.username,
        u.nickname,
        u.avatar_url AS avatarUrl,
        p.caption,
        p.game_id AS gameId,
        g.name AS gameName,
        p.like_count AS likeCount,
        p.comment_count AS commentCount,
        p.created_at AS createdAt,
        pm.url AS thumbnailUrl,
        pm.media_type AS thumbType
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN games g ON p.game_id = g.id
      LEFT JOIN post_media pm ON p.id = pm.post_id AND pm.sort_order = 0
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
      `,
      [userId]
    );

    res.json({ posts: rows });
  } catch (err) {
    console.error("GET /api/users/me/posts error:", err);
    res.status(500).json({ message: "내 게시글 조회 중 오류가 발생했습니다." });
  }
});

// 내가 좋아요한 글
router.get("/me/likes", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
    const [rows] = await db.query(
      `
      SELECT
        p.id,
        p.user_id AS userId,
        u.username,
        u.nickname,
        u.avatar_url AS avatarUrl,
        p.caption,
        p.game_id AS gameId,
        g.name AS gameName,
        p.like_count AS likeCount,
        p.comment_count AS commentCount,
        p.created_at AS createdAt,
        pm.url AS thumbnailUrl
      FROM post_likes pl
      JOIN posts p ON pl.post_id = p.id
      JOIN users u ON p.user_id = u.id
      LEFT JOIN games g ON p.game_id = g.id
      LEFT JOIN post_media pm ON p.id = pm.post_id AND pm.sort_order = 0
      WHERE pl.user_id = ?
      ORDER BY pl.created_at DESC
      `,
      [userId]
    );

    res.json({ posts: rows });
  } catch (err) {
    console.error("GET /api/users/me/likes error:", err);
    res.status(500).json({ message: "좋아요한 게시글 조회 중 오류가 발생했습니다." });
  }
});

// 내가 북마크한 글
router.get("/me/bookmarks", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
    const [rows] = await db.query(
      `
      SELECT
        p.id,
        p.user_id AS userId,
        u.username,
        u.nickname,
        u.avatar_url AS avatarUrl,
        p.caption,
        p.game_id AS gameId,
        g.name AS gameName,
        p.like_count AS likeCount,
        p.comment_count AS commentCount,
        p.created_at AS createdAt,
        pm.url AS thumbnailUrl
      FROM post_bookmarks pb
      JOIN posts p ON pb.post_id = p.id
      JOIN users u ON p.user_id = u.id
      LEFT JOIN games g ON p.game_id = g.id
      LEFT JOIN post_media pm ON p.id = pm.post_id AND pm.sort_order = 0
      WHERE pb.user_id = ?
      ORDER BY pb.created_at DESC
      `,
      [userId]
    );

    res.json({ posts: rows });
  } catch (err) {
    console.error("GET /api/users/me/bookmarks error:", err);
    res.status(500).json({ message: "북마크한 게시글 조회 중 오류가 발생했습니다." });
  }
});

// 팔로우
router.post("/:targetUserId/follow", authMiddleware, async (req, res) => {
  const followerId = req.user.id;
  const targetUserId = parseInt(req.params.targetUserId, 10);

  if (followerId === targetUserId) {
    return res.status(400).json({ message: "자기 자신은 팔로우할 수 없습니다." });
  }

  try {
    await db.query(
      `
      INSERT IGNORE INTO follows (follower_id, following_id)
      VALUES (?, ?)
      `,
      [followerId, targetUserId]
    );

    res.json({ success: true, following: true });
  } catch (err) {
    console.error("POST /api/users/:id/follow error:", err);
    res.status(500).json({ message: "팔로우 중 오류가 발생했습니다." });
  }
});

// 언팔
router.delete("/:targetUserId/follow", authMiddleware, async (req, res) => {
  const followerId = req.user.id;
  const targetUserId = parseInt(req.params.targetUserId, 10);

  try {
    await db.query(
      `
      DELETE FROM follows
      WHERE follower_id = ? AND following_id = ?
      `,
      [followerId, targetUserId]
    );

    res.json({ success: true, following: false });
  } catch (err) {
    console.error("DELETE /api/users/:id/follow error:", err);
    res.status(500).json({ message: "언팔로우 중 오류가 발생했습니다." });
  }
});

// 내 팔로우/팔로워 수 (마이페이지 상단 숫자용)
router.get("/me/follow-stats", authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    const [[followings]] = await db.query(
      `SELECT COUNT(*) AS followingCount FROM follows WHERE follower_id = ?`,
      [userId]
    );
    const [[followers]] = await db.query(
      `SELECT COUNT(*) AS followerCount FROM follows WHERE following_id = ?`,
      [userId]
    );

    res.json({
      followerCount: followers.followerCount,
      followingCount: followings.followingCount,
    });
  } catch (err) {
    console.error("GET /api/users/me/follow-stats error:", err);
    res.status(500).json({ message: "팔로우 정보 조회 중 오류가 발생했습니다." });
  }
});

// 특정 유저에 대한 관계 (프로필/카드에서 버튼 초기 상태 확인용)
router.get("/:targetUserId/relation", authMiddleware, async (req, res) => {
  const me = req.user.id;
  const targetUserId = parseInt(req.params.targetUserId, 10);

  if (me === targetUserId) {
    return res.json({
      isMe: true,
      isFollowing: false,
      isFollower: false,
    });
  }

  try {
    const [[followingRow]] = await db.query(
      `SELECT COUNT(*) AS cnt FROM follows WHERE follower_id = ? AND following_id = ?`,
      [me, targetUserId]
    );
    const [[followerRow]] = await db.query(
      `SELECT COUNT(*) AS cnt FROM follows WHERE follower_id = ? AND following_id = ?`,
      [targetUserId, me]
    );

    res.json({
      isMe: false,
      isFollowing: followingRow.cnt > 0, // 내가 저 사람을 팔로우하고 있는지
      isFollower: followerRow.cnt > 0,   // 저 사람이 나를 팔로우하는지
    });
  } catch (err) {
    console.error("GET /api/users/:id/relation error:", err);
    res.status(500).json({ message: "관계 정보 조회 중 오류가 발생했습니다." });
  }
});

router.post("/verify-password", authMiddleware, async (req, res) => {
  const userId = req.user && req.user.id;
  const { password } = req.body;

  if (!userId) {
    return res.status(401).json({
      ok: false,
      message: "인증이 필요합니다.",
    });
  }

  if (!password) {
    return res.status(400).json({
      ok: false,
      message: "현재 비밀번호를 입력해주세요.",
    });
  }

  try {    
    const [rows] = await db.query(
      "SELECT password_hash FROM users WHERE id = ?",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "사용자를 찾을 수 없습니다.",
      });
    }

    const hash = rows[0].password_hash;
    const isMatch = await bcrypt.compare(password, hash);

    if (!isMatch) {
      // 200 + ok:false 로 내려서 프론트에서 메시지만 보여주게
      return res.json({
        ok: false,
        message: "비밀번호가 일치하지 않습니다.",
      });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("POST /api/users/verify-password error:", err);
    return res.status(500).json({
      ok: false,
      message: "비밀번호 확인 중 오류가 발생했습니다.",
    });
  }
});

router.get("/me/stats", authMiddleware, userController.getMyStats);

router.get("/:userId", authMiddleware, userController.getUserProfile);

router.get("/:userId/followers", authMiddleware, userController.listFollowers);
router.get("/:userId/following", authMiddleware, userController.listFollowing);

router.post("/:targetUserId/block", authMiddleware, userController.blockUser);
router.delete("/:targetUserId/block", authMiddleware, userController.unblockUser);

router.post("/reports", authMiddleware, userController.createReport);

router.get("/me/stats", authMiddleware, userController.getMyStats);

module.exports = router;