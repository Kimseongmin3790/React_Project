const db = require("../db");

exports.findPostsByTagName = async (tagName) => {
  const [rows] = await db.query(
    `SELECT p.*
     FROM post_tags pt
     JOIN tags t ON pt.tag_id = t.id
     JOIN posts p ON pt.post_id = p.id
     WHERE t.name = ?
     ORDER BY p.created_at DESC
     LIMIT 50`,
    [tagName]
  );
  return rows;
};

exports.findTrendingTags = async () => {
  const [rows] = await db.query(
    `SELECT t.id, t.name, COUNT(*) AS usage_count
     FROM post_tags pt
     JOIN tags t ON pt.tag_id = t.id
     WHERE pt.created_at >= NOW() - INTERVAL 1 DAY
     GROUP BY t.id, t.name
     ORDER BY usage_count DESC
     LIMIT 10`
  );
  return rows;
};