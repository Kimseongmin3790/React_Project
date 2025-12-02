const db = require("../db");

// 유저 검색
exports.searchUsers = async (q) => {
  const like = `%${q}%`;
  const [rows] = await db.query(
    "SELECT id, username, nickname, avatar_url AS avatarUrl FROM users WHERE username LIKE ? OR nickname LIKE ? order by username LIMIT 20",
    [like, like]
  );
  return rows;
};

// 피드 검색
exports.searchPosts = async (q) => {
  const like = `%${q}%`;
  const [rows] = await db.query(
    `SELECT p.id, p.caption, pm.url AS thumbnailUrl, pm.media_type AS thumbType, g.name AS gameName, p.like_count AS likeCount, p.comment_count AS commentCount, p.created_at AS createdAt
     FROM posts p
     LEFT JOIN post_media pm ON p.id = pm.post_id
     LEFT JOIN games g ON p.game_id = g.id
     WHERE p.caption LIKE ?
     ORDER BY p.created_at DESC
     LIMIT 50`,
    [like]
  );
  return rows;
};

// 태그 검색
exports.searchTags = async (q) => {
  const like = `%${q}%`;
  const [rows] = await db.query(
    "SELECT id, name FROM tags WHERE name LIKE ? ORDER BY name LIMIT 20",
    [like]
  );
  return rows;
};

// 게임 검색
exports.searchGames = async (q) => {
  const like = `%${q}%`;
  const [rows] = await db.query(
    "SELECT id, name, thumbnail_url FROM games WHERE name LIKE ? ORDER BY name LIMIT 20",
    [`%${q}%`]
  );
  return rows;
};