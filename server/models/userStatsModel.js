const db = require("../db");

// 경험치/카운트 업데이트 + 레벨 재계산
async function updateUserStats(
  userId,
  {
    post = 0,
    like = 0,
    comment = 0,
    writtenComment = 0,   
    mentioned = 0,      
    exp = 0,
  }
) {
  await db.query(
    `INSERT INTO user_stats (
        user_id,
        post_count,
        received_likes,
        received_comments,
        written_comments,
        mentioned_count,
        exp,
        level
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, 1)
     ON DUPLICATE KEY UPDATE
       post_count        = post_count        + VALUES(post_count),
       received_likes    = received_likes    + VALUES(received_likes),
       received_comments = received_comments + VALUES(received_comments),
       written_comments  = written_comments  + VALUES(written_comments),
       mentioned_count   = mentioned_count   + VALUES(mentioned_count),
       exp               = exp               + VALUES(exp)
    `,
    [userId, post, like, comment, writtenComment, mentioned, exp]
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

exports.updateOnWriteComment = (authorId) => {
  return updateUserStats(authorId, { writtenComment: 1, exp: 3 });
};

exports.updateOnMentioned = (userId) => {
  return updateUserStats(userId, { mentioned: 1, exp: 1 });
};

exports.getMyStats = async (userId) => {
  const [rows] = await db.query(
    `SELECT
        user_id,
        post_count,
        received_likes,
        received_comments,
        written_comments,
        mentioned_count,
        exp,
        level
     FROM user_stats
     WHERE user_id = ?`,
    [userId]
  );

  const row = rows[0];
  return (
    row || {
      user_id: userId,
      post_count: 0,
      received_likes: 0,
      received_comments: 0,
      written_comments: 0,
      mentioned_count: 0,
      exp: 0,
      level: 1,
    }
  );
};

exports.addExpFromAchievement = async (userId, exp) => {
  if (!exp || exp === 0) {
    return exports.getMyStats(userId);
  }

  await updateUserStats(userId, { exp });

  // 업데이트된 값 다시 조회해서 리턴
  return exports.getMyStats(userId);
};
