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

module.exports = {
  getAllGames,
  findById,
};
