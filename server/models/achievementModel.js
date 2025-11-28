// models/achievementModel.js
const db = require("../db");

// 전체 업적 목록
exports.getAllAchievements = async () => {
  const [rows] = await db.query(
    `SELECT id, code, name, description, icon_url
     FROM achievements
     ORDER BY id ASC`
  );
  return rows;
};

// 해당 유저가 가진 업적 목록
exports.getUserAchievements = async (userId) => {
  const [rows] = await db.query(
    `SELECT ua.achievement_id, ua.achieved_at,
            a.code, a.name, a.description, a.icon_url
     FROM user_achievements ua
     JOIN achievements a ON ua.achievement_id = a.id
     WHERE ua.user_id = ?
     ORDER BY ua.achieved_at ASC`,
    [userId]
  );
  return rows;
};

// 유저가 가진 업적 id 리스트만
exports.getUserAchievementIds = async (userId) => {
  const [rows] = await db.query(
    `SELECT achievement_id
     FROM user_achievements
     WHERE user_id = ?`,
    [userId]
  );
  return rows.map((r) => r.achievement_id);
};

// 업적 획득 (중복 방지를 위해 UNIQUE(user_id, achievement_id) + INSERT IGNORE 추천)
exports.insertUserAchievement = async (userId, achievementId) => {
  await db.query(
    `INSERT IGNORE INTO user_achievements (user_id, achievement_id, achieved_at)
     VALUES (?, ?, NOW())`,
    [userId, achievementId]
  );
};
