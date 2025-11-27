const pool = require('../db');

// 새 게시글 생성
async function createPost({ userId, gameId, caption }) {
  const sql = `
    INSERT INTO posts (user_id, gameId, caption)
    VALUES (?, ?, ?)
  `;
  const [result] = await pool.execute(sql, [
    userId,
    gameId,
    caption
  ]);

  return result.insertId;
}

// 피드 조회
async function getFeed({ page = 1, limit = 10, gameId = null, currentUserId = null }) {
  const pageNum = Number.isFinite(page) ? Number(page) : 1;
  const limitNum = Number.isFinite(limit) ? Number(limit) : 10;
  const offset = (pageNum - 1) * limitNum;

  const userIdParam = currentUserId || 0;

  const params = [userIdParam, userIdParam]; // 좋아요, 북마크
  let whereSql = "";

  if (gameId) {
    whereSql = "WHERE p.game_id = ?";
    params.push(gameId);
  }

  const sql = `
    SELECT 
      p.id,
      p.user_id AS userId,
      u.username,
      u.nickname,
      u.avatar_url AS avatarUrl,
      g.id AS gameId,
      g.name AS gameName,
      g.slug AS gameSlug,
      p.caption,
      p.like_count AS likeCount,
      p.comment_count AS commentCount,
      p.created_at AS createdAt,
      m.url AS thumbUrl,
      m.media_type AS thumbType,
      IF(pl.user_id IS NULL, 0, 1) AS isLiked,
      IF(pb.user_id IS NULL, 0, 1) AS isBookmarked
    FROM posts p
    JOIN users u ON p.user_id = u.id
    JOIN games g ON p.game_id = g.id
    LEFT JOIN post_media m ON m.post_id = p.id AND m.sort_order = 0
    LEFT JOIN post_likes pl ON pl.post_id = p.id AND pl.user_id = ?
    LEFT JOIN post_bookmarks pb ON pb.post_id = p.id AND pb.user_id = ?
    ${whereSql}
    ORDER BY p.created_at DESC
    LIMIT ${offset}, ${limitNum}
  `;

  const [rows] = await pool.query(sql, params);
  return rows;
}

async function getPostById({ postId, currentUserId = null }) {
  const userIdParam = currentUserId || 0; // 0이면 어떤 like/bookmark도 매칭 안 됨

  const sqlPost = `
    SELECT 
      p.id,
      p.user_id AS userId,
      u.username,
      u.nickname,
      u.avatar_url AS avatarUrl,
      g.id AS gameId,
      g.name AS gameName,
      g.slug AS gameSlug,
      p.caption,
      p.like_count AS likeCount,
      p.comment_count AS commentCount,
      p.created_at AS createdAt,
      IF(pl.user_id IS NULL, 0, 1) AS isLiked,
      IF(pb.user_id IS NULL, 0, 1) AS isBookmarked
    FROM posts p
    JOIN users u ON p.user_id = u.id
    JOIN games g ON p.game_id = g.id
    LEFT JOIN post_likes pl
      ON pl.post_id = p.id AND pl.user_id = ?
    LEFT JOIN post_bookmarks pb
      ON pb.post_id = p.id AND pb.user_id = ?
    WHERE p.id = ?
    LIMIT 1
  `;

  const [postRows] = await pool.query(sqlPost, [
    userIdParam,
    userIdParam,
    postId,
  ]);
  if (postRows.length === 0) return null;

  const post = postRows[0];

  // 이미지/영상 전체 목록
  const [mediaRows] = await pool.execute(
    `
    SELECT
      id,
      media_type AS mediaType,
      url,
      sort_order AS sortOrder
    FROM post_media
    WHERE post_id = ?
    ORDER BY sort_order ASC
    `,
    [postId]
  );

  post.media = mediaRows;
  return post;
}

async function getMyPosts({ userId, page = 1, limit = 10 }) {
  const pageNum = Number.isFinite(Number(page)) ? Number(page) : 1;
  const limitNum = Number.isFinite(Number(limit)) ? Number(limit) : 10;
  const offset = (pageNum - 1) * limitNum;

  const params = [userId, userId, userId]; 
  const sql = `
    SELECT 
      p.id,
      p.user_id AS userId,
      u.username,
      u.nickname,
      u.avatar_url AS avatarUrl,
      g.id AS gameId,
      g.name AS gameName,
      g.slug AS gameSlug,
      p.caption,
      p.like_count AS likeCount,
      p.comment_count AS commentCount,
      p.created_at AS createdAt,
      m.url AS thumbUrl,
      m.media_type AS thumbType,
      IF(pl.user_id IS NULL, 0, 1) AS isLiked,
      IF(pb.user_id IS NULL, 0, 1) AS isBookmarked
    FROM posts p
    JOIN users u ON p.user_id = u.id
    JOIN games g ON p.game_id = g.id
    LEFT JOIN post_media m
      ON m.post_id = p.id AND m.sort_order = 0
    LEFT JOIN post_likes pl
      ON pl.post_id = p.id AND pl.user_id = ?
    LEFT JOIN post_bookmarks pb
      ON pb.post_id = p.id AND pb.user_id = ?
    WHERE p.user_id = ?
    ORDER BY p.created_at DESC
    LIMIT ${offset}, ${limitNum}
  `;

  const [rows] = await pool.query(sql, params);
  return rows;
}

async function getMyBookmarkedPosts({ userId, page = 1, limit = 10 }) {
  const pageNum = Number.isFinite(Number(page)) ? Number(page) : 1;
  const limitNum = Number.isFinite(Number(limit)) ? Number(limit) : 10;
  const offset = (pageNum - 1) * limitNum;

  // 1) 내가 북마크한 post 목록 기준
  const params = [userId, userId]; // like용, where용
  const sql = `
    SELECT 
      p.id,
      p.user_id AS userId,
      u.username,
      u.nickname,
      u.avatar_url AS avatarUrl,
      g.id AS gameId,
      g.name AS gameName,
      g.slug AS gameSlug,
      p.caption,
      p.like_count AS likeCount,
      p.comment_count AS commentCount,
      p.created_at AS createdAt,
      m.url AS thumbUrl,
      m.media_type AS thumbType,
      IF(pl.user_id IS NULL, 0, 1) AS isLiked,
      1 AS isBookmarked
    FROM post_bookmarks pbk
    JOIN posts p ON pbk.post_id = p.id
    JOIN users u ON p.user_id = u.id
    JOIN games g ON p.game_id = g.id
    LEFT JOIN post_media m
      ON m.post_id = p.id AND m.sort_order = 0
    LEFT JOIN post_likes pl
      ON pl.post_id = p.id AND pl.user_id = ?
    WHERE pbk.user_id = ?
    ORDER BY pbk.created_at DESC
    LIMIT ${offset}, ${limitNum}
  `;

  const [rows] = await pool.query(sql, params);
  return rows;
}

// 3) 새 listPosts: 지금은 getFeed를 그대로 래핑만 해도 됨
async function listPosts(options) {
  return getFeed(options);
}

async function listUserPosts({ authorUserId, page = 1, limit = 12, currentUserId }) {
  const pageNum = Number.isFinite(page) ? Number(page) : 1;
  const limitNum = Number.isFinite(limit) ? Number(limit) : 12;
  const offset = (pageNum - 1) * limitNum;

  const viewerId = currentUserId || 0;

  const params = [viewerId, viewerId, authorUserId];

  const sql = `
    SELECT 
      p.id,
      p.user_id AS userId,
      u.username,
      u.nickname,
      u.avatar_url AS avatarUrl,
      g.id AS gameId,
      g.name AS gameName,
      g.slug AS gameSlug,
      p.caption,
      p.like_count AS likeCount,
      p.comment_count AS commentCount,
      p.created_at AS createdAt,
      m.url AS thumbUrl,
      m.media_type AS thumbType,
      IF(pl.user_id IS NULL, 0, 1) AS isLiked,
      IF(pb.user_id IS NULL, 0, 1) AS isBookmarked
    FROM posts p
    JOIN users u ON p.user_id = u.id
    JOIN games g ON p.game_id = g.id
    LEFT JOIN post_media m ON m.post_id = p.id AND m.sort_order = 0
    LEFT JOIN post_likes pl ON pl.post_id = p.id AND pl.user_id = ?
    LEFT JOIN post_bookmarks pb ON pb.post_id = p.id AND pb.user_id = ?
    WHERE p.user_id = ?
    ORDER BY p.created_at DESC
    LIMIT ${offset}, ${limitNum}
  `;

  const [rows] = await pool.query(sql, params);
  return rows;
}

// 글 내용/게임만 수정 (이미지 수정은 나중에 별도)
async function updatePost(postId, userId, { caption, gameId }) {
  const [result] = await pool.query(
    `
    UPDATE posts
    SET caption = ?, game_id = ?
    WHERE id = ? AND user_id = ?
  `,
    [caption, gameId, postId, userId]
  );

  return result.affectedRows; // 1이면 성공, 0이면 권한없음/없는글
}

async function deletePost(postId, userId) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 관련 미디어 먼저 삭제
    await conn.query("DELETE FROM post_media WHERE post_id = ?", [postId]);

    const [result] = await conn.query(
      "DELETE FROM posts WHERE id = ? AND user_id = ?",
      [postId, userId]
    );

    await conn.commit();
    return result.affectedRows;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = {
  createPost,
  getFeed,
  getPostById,
  getMyPosts,
  getMyBookmarkedPosts,
  listPosts,
  listUserPosts,
  updatePost,
  deletePost,
};