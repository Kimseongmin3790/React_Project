const db = require("../db");

async function getAllGames() {
  const sql = `
    SELECT id, name, slug, thumbnail_url
    FROM games
    ORDER BY name ASC
  `;
  const [rows] = await db.query(sql);
  return rows;
}

async function findById(id) {
  const [rows] = await db.execute(
    `SELECT id, name, slug FROM games WHERE id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function getRankingGames(rangeDays) {
  const params = [];
  let extraWhere = "";

  if (rangeDays && Number.isInteger(rangeDays) && rangeDays > 0) {
    extraWhere = " AND p.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)";
    params.push(rangeDays);
  }

  const sql = `
    SELECT
      g.id,
      g.name,
      g.slug,
      g.thumbnail_url AS thumbnailUrl,
      COUNT(DISTINCT p.id) AS postCount,
      COALESCE(SUM(p.like_count), 0) AS totalLikes,
      COALESCE(SUM(p.comment_count), 0) AS totalComments,
      MAX(p.created_at) AS lastPostAt
    FROM games g
    JOIN posts p ON p.game_id = g.id
    WHERE p.game_id IS NOT NULL
    ${extraWhere}
    GROUP BY g.id, g.name, g.slug
    HAVING postCount > 0
    ORDER BY totalLikes DESC, postCount DESC, lastPostAt DESC
    LIMIT 10
  `;

  const [rows] = await db.query(sql, params);
  return rows;
}

async function findTrendingGames({ limit = 10, days = 7 }) {
  const params = [];
  let where = "";

  if (days && Number.isFinite(days)) {
    where = "WHERE p.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)";
    params.push(days);
  }

  const [rows] = await db.query(
    `
      SELECT
        g.id,
        g.name,
        g.slug,
        g.thumbnail_url AS thumbnailUrl,
        COUNT(DISTINCT p.id) AS postCount
      FROM games g
      JOIN posts p ON p.game_id = g.id
      ${where}
      GROUP BY g.id, g.name, g.slug, g.thumbnail_url
      ORDER BY postCount DESC, g.id ASC
      LIMIT ?
    `,
    [...params, limit]
  );

  return rows;
}

module.exports = {
  getAllGames,
  findById,
  getRankingGames,
  findTrendingGames
};
