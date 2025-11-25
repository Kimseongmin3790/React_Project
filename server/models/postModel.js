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

  // 방금 INSERT된 id 리턴
  return result.insertId;
}

// 피드 조회
async function getFeed({ page = 1, limit = 10, gameId = null, currentUserId = null }) {
  const pageNum = Number.isFinite(page) ? Number(page) : 1;
  const limitNum = Number.isFinite(limit) ? Number(limit) : 10;
  const offset = (pageNum - 1) * limitNum;

  const userIdParam = currentUserId || 0;

  const params = [userIdParam];
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
      IF(pl.user_id IS NULL, 0, 1) AS isLiked
    FROM posts p
    JOIN users u ON p.user_id = u.id
    JOIN games g ON p.game_id = g.id
    LEFT JOIN post_media m ON m.post_id = p.id AND m.sort_order = 0
    LEFT JOIN post_likes pl ON pl.post_id = p.id AND pl.user_id = ?
    ${whereSql}
    ORDER BY p.created_at DESC
    LIMIT ${offset}, ${limitNum}
  `;

  const [rows] = await pool.query(sql, params);
  return rows;
}

module.exports = {
  createPost,
  getFeed,
};