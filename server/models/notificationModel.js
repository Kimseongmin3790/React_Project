// server/models/notificationModel.js
const db = require("../db");

// 팔로워 알림용
async function createForFollowers(actorId, postId, caption) {
  const [followers] = await db.query(
    "SELECT follower_id FROM follows WHERE following_id = ?",
    [actorId]
  );

  if (!followers.length) return { followers: [] };

  const preview = caption ? caption.slice(0, 80) : "";

  const values = followers.map((f) => [
    f.follower_id,
    "FOLLOWED_USER_POST",
    actorId,
    postId,
    null,
    preview,
  ]);

  await db.query(
    `
    INSERT INTO notifications
      (user_id, type, actor_id, post_id, room_id, message)
    VALUES ?
    `,
    [values]
  );

  return { followers };
}

// 채팅 알림용
async function createForChatMessage(receiverIds, senderId, roomId, content) {
  if (!receiverIds.length) return;
  const preview = content.slice(0, 80);

  const values = receiverIds.map((uid) => [
    uid,
    "CHAT_MESSAGE",
    senderId,
    null,
    roomId,
    preview,
  ]);

  await db.query(
    `
    INSERT INTO notifications
      (user_id, type, actor_id, post_id, room_id, message)
    VALUES ?
    `,
    [values]
  );
}

// 요약
async function getSummaryByUserId(userId) {
  const [[counts]] = await db.query(
    `
    SELECT
      SUM(CASE WHEN type = 'CHAT_MESSAGE' THEN 1 ELSE 0 END) AS unreadChat,
      SUM(CASE WHEN type = 'FOLLOWED_USER_POST' THEN 1 ELSE 0 END) AS unreadPost,
      COUNT(*) AS unreadTotal
    FROM notifications
    WHERE user_id = ? AND is_read = 0
    `,
    [userId]
  );

  const [lastRows] = await db.query(
    `
    SELECT id, type, actor_id, post_id, room_id, message, created_at
    FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [userId]
  );

  return {
    unreadChat: counts.unreadChat || 0,
    unreadPost: counts.unreadPost || 0,
    unreadTotal: counts.unreadTotal || 0,
    lastNotification: lastRows[0] || null,
  };
}

async function markAllReadByUserId(userId) {
  await db.query(
    `
    UPDATE notifications
    SET is_read = 1
    WHERE user_id = ?
    `,
    [userId]
  );
}

module.exports = {
  createForFollowers,
  createForChatMessage,
  getSummaryByUserId,
  markAllReadByUserId,
};
