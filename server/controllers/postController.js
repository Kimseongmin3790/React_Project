const postModel = require('../models/postModel');
const pool = require("../db");
const gameModel = require('../models/gameModel');

exports.createPost = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    const { gameId, caption } = req.body;
    const gameIdNum = Number.parseInt(gameId, 10);
    if (!gameIdNum) {
      return res.status(400).json({ message: "유효한 게임을 선택해주세요." });
    }

    const game = await gameModel.findById(gameIdNum);
    if (!game) {
      return res.status(400).json({ message: "존재하지 않는 게임입니다." });
    }

    const files = req.files || {};
    const imageFiles = files.images || [];
    const videoFiles = files.videos || [];

    await conn.beginTransaction();

    // 1) posts INSERT
    const [result] = await conn.execute(
      `INSERT INTO posts (user_id, game_id, caption)
       VALUES (?, ?, ?)`,
      [user.id, gameIdNum, caption || ""]
    );
    const postId = result.insertId;

    // 2) post_media INSERT (이미지 먼저, 그 다음 영상)
    let sortOrder = 0;

    for (const file of imageFiles) {
      const url = `/uploads/${file.filename}`;
      await conn.execute(
        `INSERT INTO post_media (post_id, media_type, url, sort_order)
         VALUES (?, 'IMAGE', ?, ?)`,
        [postId, url, sortOrder++]
      );
    }

    for (const file of videoFiles) {
      const url = `/uploads/${file.filename}`;
      await conn.execute(
        `INSERT INTO post_media (post_id, media_type, url, sort_order)
         VALUES (?, 'VIDEO', ?, ?)`,
        [postId, url, sortOrder++]
      );
    }

    await conn.commit();

    // 간단 응답
    res.status(201).json({
      message: "게시글이 등록되었습니다.",
      post: {
        id: postId,
        userId: user.id,
        username: user.username,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        gameId: game.id,
        gameName: game.name,
        gameSlug: game.slug,
        caption,
        likeCount: 0,
        commentCount: 0,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("createPost error:", err);
    await conn.rollback();
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  } finally {
    conn.release();
  }
};

// GET /api/posts  (피드 조회: 로그인 여부와 상관 없이 전체 피드)
exports.getFeed = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page, 10) || 1;
    const limit = Number.parseInt(req.query.limit, 10) || 10;

    const gameId = req.query.gameId ? Number.parseInt(req.query.gameId, 10) : null;

    const currentUserId = req.user?.id || null;

    const posts = await postModel.getFeed({ page, limit, gameId, currentUserId });

    res.json({
      page,
      limit,
      posts,
    });
  } catch (err) {
    console.error("getFeed error:", err);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};

exports.likePost = async (req, res) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "인증이 필요합니다." });
  }

  const postId = Number.parseInt(req.params.postId, 10);
  if (!postId) {
    return res.status(400).json({ message: "잘못된 게시글입니다." });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 이미 좋아요 되어있는지 확인
    const [exists] = await conn.execute(
      `SELECT 1 FROM post_likes WHERE post_id = ? AND user_id = ?`,
      [postId, user.id]
    );

    if (exists.length === 0) {
      await conn.execute(
        `INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)`,
        [postId, user.id]
      );
      await conn.execute(
        `UPDATE posts SET like_count = like_count + 1 WHERE id = ?`,
        [postId]
      );
    }

    const [rows] = await conn.execute(
      `SELECT like_count FROM posts WHERE id = ?`,
      [postId]
    );
    const likeCount = rows[0]?.like_count ?? 0;

    await conn.commit();

    res.json({ liked: true, likeCount });
  } catch (err) {
    console.error("likePost error:", err);
    await conn.rollback();
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  } finally {
    conn.release();
  }
};

exports.unlikePost = async (req, res) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "인증이 필요합니다." });
  }

  const postId = Number.parseInt(req.params.postId, 10);
  if (!postId) {
    return res.status(400).json({ message: "잘못된 게시글입니다." });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [exists] = await conn.execute(
      `SELECT 1 FROM post_likes WHERE post_id = ? AND user_id = ?`,
      [postId, user.id]
    );

    if (exists.length > 0) {
      await conn.execute(
        `DELETE FROM post_likes WHERE post_id = ? AND user_id = ?`,
        [postId, user.id]
      );
      await conn.execute(
        `UPDATE posts 
         SET like_count = GREATEST(like_count - 1, 0)
         WHERE id = ?`,
        [postId]
      );
    }

    const [rows] = await conn.execute(
      `SELECT like_count FROM posts WHERE id = ?`,
      [postId]
    );
    const likeCount = rows[0]?.like_count ?? 0;

    await conn.commit();

    res.json({ liked: false, likeCount });
  } catch (err) {
    console.error("unlikePost error:", err);
    await conn.rollback();
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  } finally {
    conn.release();
  }
};