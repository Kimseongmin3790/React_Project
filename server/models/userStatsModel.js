const db = require("../db");

// 경험치/카운트 업데이트 + 레벨 재계산
async function updateUserStats(userId, { post = 0, like = 0, comment = 0, exp = 0 }) {
  // upsert 느낌으로
  await db.query(
    `INSERT INTO user_stats (user_id, post_count, received_likes, received_comments, exp, level)
     VALUES (?, ?, ?, ?, ?, 1)
     ON DUPLICATE KEY UPDATE
       post_count = post_count + VALUES(post_count),
       received_likes = received_likes + VALUES(received_likes),
       received_comments = received_comments + VALUES(received_comments),
       exp = exp + VALUES(exp)`,
    [userId, post, like, comment, exp]
  );

  // 레벨 재계산
  await db.query(
    `UPDATE user_stats
     SET level = FLOOR(exp / 100) + 1
     WHERE user_id = ?`,
    [userId]
  );
}

exports.updateOnNewPost = (authorId) => {
  return updateUserStats(authorId, { post: 1, exp: 20 });
};

exports.updateOnReceivedLike = (authorId) => {
  return updateUserStats(authorId, { like: 1, exp: 2 });
};

exports.updateOnReceivedComment = (authorId) => {
  return updateUserStats(authorId, { comment: 1, exp: 3 });
};

exports.getMyStats = async (userId) => {
  const [rows] = await db.query(
    `SELECT user_id, post_count, received_likes, received_comments, exp, level
     FROM user_stats
     WHERE user_id = ?`,
    [userId]
  );
  return rows[0] || {
    user_id: userId,
    post_count: 0,
    received_likes: 0,
    received_comments: 0,
    exp: 0,
    level: 1,
  };
};