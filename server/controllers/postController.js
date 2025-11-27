const postModel = require('../models/postModel');
const db = require("../db");
const gameModel = require('../models/gameModel');
const notificationService = require('../services/notificationService');
const userStatsModel = require('../models/userStatsModel');

exports.createPost = async (req, res) => {
  const conn = await db.getConnection();
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

    if (imageFiles.length === 0 && videoFiles.length === 0) {
      return res.status(400).json({ message: "이미지나 동영상을 최소 1개 이상 첨부해주세요" });
    }

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

    try {
      await notificationService.notifyFollowersNewPost({
        actor: user,
        postId,
        caption,
      });      
    } catch (notifyErr) {
      console.error("notifyFollowersNewPost error:", notifyErr);
    }

    await userStatsModel.updateOnNewPost(user.id);

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

  const conn = await db.getConnection();
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

    await userStatsModel.updateOnReceivedLike(user.id);

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

  const conn = await db.getConnection();
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

exports.bookmarkPost = async (req, res) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "인증이 필요합니다." });
  }

  const postId = Number.parseInt(req.params.postId, 10);
  if (!postId) {
    return res.status(400).json({ message: "잘못된 게시글입니다." });
  }

  try {
    await db.execute(
      `INSERT IGNORE INTO post_bookmarks (post_id, user_id)
       VALUES (?, ?)`,
      [postId, user.id]
    );

    res.json({ bookmarked: true });
  } catch (err) {
    console.error("bookmarkPost error:", err);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};

exports.unbookmarkPost = async (req, res) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "인증이 필요합니다." });
  }

  const postId = Number.parseInt(req.params.postId, 10);
  if (!postId) {
    return res.status(400).json({ message: "잘못된 게시글입니다." });
  }

  try {
    await db.execute(
      `DELETE FROM post_bookmarks
       WHERE post_id = ? AND user_id = ?`,
      [postId, user.id]
    );

    res.json({ bookmarked: false });
  } catch (err) {
    console.error("unbookmarkPost error:", err);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};

exports.getComments = async (req, res) => {
  try {
    const postId = Number.parseInt(req.params.postId, 10);
    if (!postId) {
      return res.status(400).json({ message: "잘못된 게시글입니다." });
    }

    const [rows] = await db.execute(
      `
      SELECT
        c.id,
        c.post_id AS postId,
        c.user_id AS userId,
        c.content,
        c.created_at AS createdAt,
        u.username,
        u.nickname,
        u.avatar_url AS avatarUrl
      FROM post_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
      `,
      [postId]
    );

    res.json({ comments: rows });
  } catch (err) {
    console.error("getComments error:", err);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};

exports.createComment = async (req, res) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "인증이 필요합니다." });
  }

  const postId = Number.parseInt(req.params.postId, 10);
  const { content } = req.body;

  if (!postId) {
    return res.status(400).json({ message: "잘못된 게시글입니다." });
  }
  if (!content || !content.trim()) {
    return res.status(400).json({ message: "댓글 내용을 입력해주세요." });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1) 댓글 INSERT
    const [result] = await conn.execute(
      `
      INSERT INTO post_comments (post_id, user_id, content)
      VALUES (?, ?, ?)
      `,
      [postId, user.id, content.trim()]
    );
    const commentId = result.insertId;

    // 2) posts.comment_count 증가
    await conn.execute(
      `
      UPDATE posts
      SET comment_count = comment_count + 1
      WHERE id = ?
      `,
      [postId]
    );

    await conn.commit();

    await userStatsModel.updateOnReceivedComment(user.id);

    // 프론트에서 바로 쓸 수 있게 작성자 정보 포함해서 리턴
    res.status(201).json({
      id: commentId,
      postId,
      userId: user.id,
      username: user.username,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      content: content.trim(),
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("createComment error:", err);
    await conn.rollback();
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  } finally {
    conn.release();
  }
};

exports.getPostDetail = async (req, res) => {
  try {
    const postId = Number.parseInt(req.params.postId, 10);
    if (!postId) {
      return res.status(400).json({ message: "잘못된 게시글입니다." });
    }

    const currentUserId = req.user?.id || null;

    const post = await postModel.getPostById({ postId, currentUserId });
    if (!post) {
      return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
    }

    res.json({ post });
  } catch (err) {
    console.error("getPostDetail error:", err);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};

exports.getMyPosts = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    const page = Number.parseInt(req.query.page, 10) || 1;
    const limit = Number.parseInt(req.query.limit, 10) || 10;

    const posts = await postModel.getMyPosts({
      userId: user.id,
      page,
      limit,
    });

    res.json({ page, limit, posts });
  } catch (err) {
    console.error("getMyPosts error:", err);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};

exports.getMyBookmarkedPosts = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    const page = Number.parseInt(req.query.page, 10) || 1;
    const limit = Number.parseInt(req.query.limit, 10) || 10;

    const posts = await postModel.getMyBookmarkedPosts({
      userId: user.id,
      page,
      limit,
    });

    res.json({ page, limit, posts });
  } catch (err) {
    console.error("getMyBookmarkedPosts error:", err);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};

exports.listPosts = async (req, res) => {
  const {
    page = 1,
    limit = 10,
    gameId,
    sort = "latest",
    period = "all",
  } = req.query;

  // 로그인 유저 ID (authMiddleware에서 넣어줬다고 가정)
  const currentUserId = req.user ? req.user.id : null;

  try {
    const posts = await postModel.listPosts({
      page,
      limit,
      gameId,
      currentUserId,
      sort,
      period,
    });

    res.json(posts);
  } catch (err) {
    console.error("listPosts error:", err);
    res.status(500).json({ error: "피드 조회 중 오류가 발생했습니다." });
  }
};

exports.listUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const viewerId = req.user.id; // 현재 로그인한 유저 (좋아요/북마크 표시용)

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 12;

    const posts = await postModel.listUserPosts({
      authorUserId: Number(userId),
      page,
      limit,
      currentUserId: viewerId,
    });

    res.json(posts); // 프론트에서는 배열 그대로 받음
  } catch (err) {
    console.error("listUserPosts error:", err);
    res.status(500).json({ error: "유저 게시글 조회 중 오류가 발생했습니다." });
  }
};

// PUT /api/posts/:postId
exports.updatePost = async (req, res) => {
  try {
    const postId = Number(req.params.postId);
    const userId = req.user.id; // authMiddleware에서 넣어준 값이라고 가정

    const { caption, gameId } = req.body;
    if (!caption || !gameId) {
      return res
        .status(400)
        .json({ message: "caption과 gameId는 필수입니다." });
    }

    const affected = await postModel.updatePost(postId, userId, {
      caption,
      gameId,
    });

    if (affected === 0) {
      return res
        .status(403)
        .json({ message: "수정 권한이 없거나 존재하지 않는 게시글입니다." });
    }

    // 프론트에서 다시 피드를 불러오니까 최소 정보만
    res.json({ ok: true });
  } catch (err) {
    console.error("updatePost error:", err);
    res.status(500).json({ message: "게시글 수정 중 오류가 발생했습니다." });
  }
};

// DELETE /api/posts/:postId
exports.deletePost = async (req, res) => {
  try {
    const postId = Number(req.params.postId);
    const userId = req.user.id;

    const affected = await postModel.deletePost(postId, userId);

    if (affected === 0) {
      return res
        .status(403)
        .json({ message: "삭제 권한이 없거나 존재하지 않는 게시글입니다." });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("deletePost error:", err);
    res.status(500).json({ message: "게시글 삭제 중 오류가 발생했습니다." });
  }
};