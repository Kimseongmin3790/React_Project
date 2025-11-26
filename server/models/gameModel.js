const pool = require("../db");

async function getAllGames() {
  const sql = `
    SELECT id, name, slug
    FROM games
    ORDER BY name ASC
  `;
  const [rows] = await pool.query(sql);
  return rows;
}

async function findById(id) {
  const [rows] = await pool.execute(
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

  const [rows] = await pool.query(sql, params);
  return rows;
}

module.exports = {
  getAllGames,
  findById,
  getRankingGames,
};
