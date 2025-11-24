const db = require('../db');

async function findByEmail(email) {
    try {
        const sql = "SELECT * FROM USERS WHERE EMAIL = ?";
        const [list] = await db.execute(sql, [email]);
            
        return list[0] || null;
    } catch (error) {
        console.log(error);
    }
}

async function findByUsername(username) {
  const [rows] = await db.execute(
    'SELECT * FROM users WHERE username = ?',
    [username]
  );
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await db.execute(
    'SELECT * FROM users WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}

async function createUser({ email, passwordHash, username, nickname }) {
  const [result] = await db.execute(
    `INSERT INTO users (email, password_hash, username, nickname)
     VALUES (?, ?, ?, ?)`,
    [email, passwordHash, username, nickname]
  );
  return result.insertId;
}

module.exports = {
    findByEmail,
    findByUsername,
    findById,
    createUser,
}