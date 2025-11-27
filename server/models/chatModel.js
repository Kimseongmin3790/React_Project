const pool = require("../db");

// 1) 게임 방 가져오거나 생성
async function getOrCreateGameRoom(gameId) {
  // 이미 있는지 먼저 확인
  const [rows] = await pool.query(
    "SELECT * FROM chat_room WHERE type = 'GAME' AND game_id = ? LIMIT 1",
    [gameId]
  );
  if (rows.length > 0) return rows[0];

  // 없으면 생성
  const [result] = await pool.query(
    "INSERT INTO chat_room (type, game_id) VALUES ('GAME', ?)",
    [gameId]
  );

  return {
    id: result.insertId,
    type: "GAME",
    game_id: gameId,
  };
}

// 2) DM 방 가져오거나 생성 (userId1 ↔ userId2)
async function getOrCreateDmRoom(userId1, userId2) {
  // 두 사람 w가 모두 들어있는 DM방을 찾는다
  const [rows] = await pool.query(
    `
    SELECT cr.*
    FROM chat_room cr
    JOIN chat_room_user cru1 ON cr.id = cru1.room_id
    JOIN chat_room_user cru2 ON cr.id = cru2.room_id
    WHERE cr.type = 'DM'
      AND cru1.user_id = ?
      AND cru2.user_id = ?
    LIMIT 1
    `,
    [userId1, userId2]
  );

  if (rows.length > 0) return rows[0];

  // 없으면 새로 방 만들고 두 유저 연결
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [roomResult] = await conn.query(
      "INSERT INTO chat_room (type) VALUES ('DM')"
    );
    const roomId = roomResult.insertId;

    await conn.query(
      "INSERT INTO chat_room_user (room_id, user_id) VALUES (?, ?), (?, ?)",
      [roomId, userId1, roomId, userId2]
    );

    await conn.commit();
    return { id: roomId, type: "DM" };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// 3) 메시지 저장
async function insertMessage({ roomId, senderId, content }) {
  const [result] = await pool.query(
    "INSERT INTO chat_message (room_id, sender_id, content) VALUES (?, ?, ?)",
    [roomId, senderId, content]
  );

  const [rows] = await pool.query(
    `
    SELECT
      m.id,
      m.room_id AS roomId,
      m.sender_id AS senderId,
      u.username,
      u.nickname,
      m.content,
      m.created_at AS createdAt,
      cr.type AS roomType,
      cr.game_id AS gameId
    FROM chat_message m
    JOIN users u ON m.sender_id = u.id
    JOIN chat_room cr ON m.room_id = cr.id
    WHERE m.id = ?
    `,
    [result.insertId]
  );

  return rows[0];
}

// 4) 최근 N개 메시지 (히스토리 불러오기용)
async function getRecentMessages(roomId, limit = 50) {
  const [rows] = await pool.query(
    `
    SELECT
      m.id,
      m.room_id AS roomId,
      m.sender_id AS senderId,
      u.username,
      u.nickname,
      u.avatar_url AS avatarUrl,
      m.content,
      m.created_at AS createdAt
    FROM chat_message m
    JOIN users u ON m.sender_id = u.id
    WHERE m.room_id = ?
    ORDER BY m.created_at DESC
    LIMIT ?
    `,
    [roomId, limit]
  );

  // 최신 → 오래된 순으로 뒤집기
  return rows.reverse();
}

async function addUserToRoom(roomId, userId) {
  await pool.query(
    "INSERT IGNORE INTO chat_room_user (room_id, user_id) VALUES (?, ?)",
    [roomId, userId]
  );
}

async function upsertLastRead(roomId, userId, date) {
  await pool.query(
    `
    INSERT INTO chat_read (room_id, user_id, last_read_at)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE last_read_at = VALUES(last_read_at)
    `,
    [roomId, userId, date]
  );
}

async function getRoomMembers(roomId) {
  const [rows] = await pool.query(
    "SELECT user_id AS userId FROM chat_room_user WHERE room_id = ?",
    [roomId]
  );
  return rows; // [{ userId: 1 }, { userId: 2 }, ...]
}

async function getUnreadSummary(userId) {
  const [rows] = await pool.query(
    `
    SELECT
      m.room_id AS roomId,
      COUNT(*) AS unreadCount
    FROM chat_message m
    JOIN chat_room_user cru
      ON m.room_id = cru.room_id
      AND cru.user_id = ?
    LEFT JOIN chat_read r
      ON m.room_id = r.room_id
     AND r.user_id = ?
    WHERE m.sender_id <> ?
      AND m.created_at > COALESCE(r.last_read_at, '1970-01-01')
    GROUP BY m.room_id
    `,
    [userId, userId, userId]
  );
  return rows; // [{ roomId: 3, unreadCount: 5 }, ...]
}

module.exports = {
  getOrCreateGameRoom,
  getOrCreateDmRoom,
  insertMessage,
  getRecentMessages,
  addUserToRoom,
  upsertLastRead,
  getRoomMembers,
  getUnreadSummary,
};
