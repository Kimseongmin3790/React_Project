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

// 🔹 나를 팔로우하는 사람들 (followers)
async function getFollowers(userId) {
  const sql = `
    SELECT 
      u.id,
      u.username,
      u.nickname,
      u.avatar_url AS avatarUrl
    FROM follows f
    JOIN users u ON u.id = f.follower_id
    WHERE f.following_id = ?
    ORDER BY f.created_at DESC
  `;
  const [rows] = await db.query(sql, [userId]);
  return rows;
}

// 🔹 내가 팔로우하는 사람들 (following)
async function getFollowing(userId) {
  const sql = `
    SELECT 
      u.id,
      u.username,
      u.nickname,
      u.avatar_url AS avatarUrl
    FROM follows f
    JOIN users u ON u.id = f.following_id
    WHERE f.follower_id = ?
    ORDER BY f.created_at DESC
  `;
  const [rows] = await db.query(sql, [userId]);
  return rows;
}

async function getUserById(userId) {
  const sql = `
    SELECT
      id,
      username,
      nickname,
      avatar_url AS avatarUrl,
      bio
    FROM users
    WHERE id = ?
  `;
  const [rows] = await db.query(sql, [userId]);
  return rows[0] || null;
}

async function blockUser(blockerId, targetId) {
  await db.query(
    `INSERT IGNORE INTO user_blocks (blocker_id, blocked_id)
     VALUES (?, ?)`,
    [blockerId, targetId]
  );
}

async function unblockUser(blockerId, targetId) {
  await db.query(
    `DELETE FROM user_blocks
     WHERE blocker_id = ? AND blocked_id = ?`,
    [blockerId, targetId]
  );
}

async function createReport({ reporterId, targetUserId, targetPostId, reason }) {
  const [result] = await db.query(
    `
    INSERT INTO reports (reporter_id, target_user_id, target_post_id, reason)
    VALUES (?, ?, ?, ?)
  `,
    [reporterId, targetUserId || null, targetPostId || null, reason]
  );
  return result.insertId;
}

module.exports = {
    findByEmail,
    findByUsername,
    findById,
    createUser,
    getFollowers,
    getFollowing,
    getUserById,
    blockUser,
    unblockUser,
    createReport
}