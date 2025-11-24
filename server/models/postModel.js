const pool = require('../db');

// 새 게시글 생성
async function createPost({ userId, gameName, caption, imageUrl }) {
  const sql = `
    INSERT INTO posts (user_id, game_name, caption, image_url)
    VALUES (?, ?, ?, ?)
  `;
  const [result] = await pool.execute(sql, [
    userId,
    gameName,
    caption,
    imageUrl,
  ]);

  // 방금 INSERT된 id 리턴
  return result.insertId;
}

// 단일 게시글 조회 (+ 작성자 기본 정보 JOIN 예시)
async function getPostById(postId) {
  const sql = `
    SELECT 
      p.id,
      p.user_id AS userId,
      u.username,
      u.avatar_url AS avatarUrl,
      p.game_name AS gameName,
      p.caption,
      p.image_url AS imageUrl,
      p.like_count AS likeCount,
      p.comment_count AS commentCount,
      p.created_at AS createdAt
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE p.id = ?
  `;
  const [rows] = await pool.execute(sql, [postId]);
  return rows[0] || null;
}

// 피드용 목록 조회 (최신순, 페이징)
async function getPostFeed({ limit = 10, offset = 0 }) {
  const sql = `
    SELECT 
      p.id,
      p.user_id AS userId,
      u.username,
      u.avatar_url AS avatarUrl,
      p.game_name AS gameName,
      p.caption,
      p.image_url AS imageUrl,
      p.like_count AS likeCount,
      p.comment_count AS commentCount,
      p.created_at AS createdAt
    FROM posts p
    JOIN users u ON p.user_id = u.id
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `;
  const [rows] = await pool.execute(sql, [limit, offset]);
  return rows;
}

// 특정 유저의 게시글 목록
async function getPostsByUserId(userId, { limit = 12, offset = 0 }) {
  const sql = `
    SELECT 
      p.id,
      p.user_id AS userId,
      p.game_name AS gameName,
      p.caption,
      p.image_url AS imageUrl,
      p.like_count AS likeCount,
      p.comment_count AS commentCount,
      p.created_at AS createdAt
    FROM posts p
    WHERE p.user_id = ?
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `;
  const [rows] = await pool.execute(sql, [userId, limit, offset]);
  return rows;
}

// 게시글 삭제
async function deletePost(postId) {
  const sql = `DELETE FROM posts WHERE id = ?`;
  const [result] = await pool.execute(sql, [postId]);
  return result.affectedRows; // 0이면 없음, 1이면 삭제됨
}

module.exports = {
  createPost,
  getPostById,
  getPostFeed,
  getPostsByUserId,
  deletePost,
};
