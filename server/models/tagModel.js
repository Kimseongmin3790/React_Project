const db = require("../db");

// 인기 태그
exports.findPopularTags = async ({ limit = 20, days = null }) => {
  const params = [];
  let where = "";

  if (days && Number.isFinite(days)) {
    where = "WHERE p.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)";
    params.push(days);
  }

  const [rows] = await db.query(
    `
      SELECT
        t.id,
        t.name,
        COUNT(DISTINCT pt.post_id) AS postCount
      FROM tags t
      JOIN post_tags pt ON pt.tag_id = t.id
      JOIN posts p ON p.id = pt.post_id
      ${where}
      GROUP BY t.id, t.name
      ORDER BY postCount DESC, t.id ASC
      LIMIT ?
    `,
    [...params, limit]
  );

  return rows;
};
