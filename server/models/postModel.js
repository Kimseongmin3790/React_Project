const db = require('../db');

// 피드 조회
async function getFeed({ page = 1, limit = 10, gameId = null, currentUserId = null }) {
  const pageNum = Number.isFinite(page) ? Number(page) : 1;
  const limitNum = Number.isFinite(limit) ? Number(limit) : 10;
  const offset = (pageNum - 1) * limitNum;

  const userIdParam = currentUserId || 0;

  const params = [userIdParam, userIdParam]; // 좋아요, 북마크
  let whereSql = "";

  if (gameId) {
    whereSql = "WHERE p.game_id = ?";
    params.push(gameId);
  }

  const sql = `
    SELECT 
      p.id,
      p.user_id AS userId,
      u.username,
      u.nickname,
      u.avatar_url AS avatarUrl,
      g.id AS gameId,
      g.name AS gameName,
      g.slug AS gameSlug,
      p.caption,
      p.like_count AS likeCount,
      p.comment_count AS commentCount,
      p.created_at AS createdAt,
      m.url AS thumbUrl,
      m.media_type AS thumbType,
      IF(pl.user_id IS NULL, 0, 1) AS isLiked,
      IF(pb.user_id IS NULL, 0, 1) AS isBookmarked
    FROM posts p
    JOIN users u ON p.user_id = u.id
    JOIN games g ON p.game_id = g.id
    LEFT JOIN post_media m ON m.post_id = p.id AND m.sort_order = 0
    LEFT JOIN post_likes pl ON pl.post_id = p.id AND pl.user_id = ?
    LEFT JOIN post_bookmarks pb ON pb.post_id = p.id AND pb.user_id = ?
    ${whereSql}
    ORDER BY p.created_at DESC
    LIMIT ${offset}, ${limitNum}
  `;

  const [rows] = await db.query(sql, params);
  return rows;
}

async function getPostById({ postId, currentUserId = null }) {
  const userIdParam = currentUserId || 0; // 0이면 어떤 like/bookmark도 매칭 안 됨

  const sqlPost = `
    SELECT 
      p.id,
      p.user_id AS userId,
      u.username,
      u.nickname,
      u.avatar_url AS avatarUrl,
      g.id AS gameId,
      g.name AS gameName,
      g.slug AS gameSlug,
      p.caption,
      p.like_count AS likeCount,
      p.comment_count AS commentCount,
      p.created_at AS createdAt,
      IF(pl.user_id IS NULL, 0, 1) AS isLiked,
      IF(pb.user_id IS NULL, 0, 1) AS isBookmarked,
      pm.url AS thumbUrl,
      pm.media_type AS thumbType
    FROM posts p
    JOIN users u ON p.user_id = u.id
    JOIN games g ON p.game_id = g.id
    JOIN post_media pm ON p.id = pm.post_id
    LEFT JOIN post_likes pl
      ON pl.post_id = p.id AND pl.user_id = ?
    LEFT JOIN post_bookmarks pb
      ON pb.post_id = p.id AND pb.user_id = ?
    WHERE p.id = ?
    LIMIT 1
  `;

  const [postRows] = await db.query(sqlPost, [
    userIdParam,
    userIdParam,
    postId,
  ]);
  if (postRows.length === 0) return null;

  const post = postRows[0];

  // 이미지/영상 전체 목록
  const [mediaRows] = await db.execute(
    `
    SELECT
      id,
      media_type AS mediaType,
      url,
      sort_order AS sortOrder
    FROM post_media
    WHERE post_id = ?
    ORDER BY sort_order ASC
    `,
    [postId]
  );

  post.media = mediaRows;
  return post;
}

async function getMyPosts({ userId, page = 1, limit = 10 }) {
  const pageNum = Number.isFinite(Number(page)) ? Number(page) : 1;
  const limitNum = Number.isFinite(Number(limit)) ? Number(limit) : 10;
  const offset = (pageNum - 1) * limitNum;

  const params = [userId, userId, userId]; 
  const sql = `
    SELECT 
      p.id,
      p.user_id AS userId,
      u.username,
      u.nickname,
      u.avatar_url AS avatarUrl,
      g.id AS gameId,
      g.name AS gameName,
      g.slug AS gameSlug,
      p.caption,
      p.like_count AS likeCount,
      p.comment_count AS commentCount,
      p.created_at AS createdAt,
      m.url AS thumbUrl,
      m.media_type AS thumbType,
      IF(pl.user_id IS NULL, 0, 1) AS isLiked,
      IF(pb.user_id IS NULL, 0, 1) AS isBookmarked
    FROM posts p
    JOIN users u ON p.user_id = u.id
    JOIN games g ON p.game_id = g.id
    LEFT JOIN post_media m
      ON m.post_id = p.id AND m.sort_order = 0
    LEFT JOIN post_likes pl
      ON pl.post_id = p.id AND pl.user_id = ?
    LEFT JOIN post_bookmarks pb
      ON pb.post_id = p.id AND pb.user_id = ?
    WHERE p.user_id = ?
    ORDER BY p.created_at DESC
    LIMIT ${offset}, ${limitNum}
  `;

  const [rows] = await db.query(sql, params);
  return rows;
}

async function getMyBookmarkedPosts({ userId, page = 1, limit = 10 }) {
  const pageNum = Number.isFinite(Number(page)) ? Number(page) : 1;
  const limitNum = Number.isFinite(Number(limit)) ? Number(limit) : 10;
  const offset = (pageNum - 1) * limitNum;

  // 1) 내가 북마크한 post 목록 기준
  const params = [userId, userId]; // like용, where용
  const sql = `
    SELECT 
      p.id,
      p.user_id AS userId,
      u.username,
      u.nickname,
      u.avatar_url AS avatarUrl,
      g.id AS gameId,
      g.name AS gameName,
      g.slug AS gameSlug,
      p.caption,
      p.like_count AS likeCount,
      p.comment_count AS commentCount,
      p.created_at AS createdAt,
      m.url AS thumbUrl,
      m.media_type AS thumbType,
      IF(pl.user_id IS NULL, 0, 1) AS isLiked,
      1 AS isBookmarked
    FROM post_bookmarks pbk
    JOIN posts p ON pbk.post_id = p.id
    JOIN users u ON p.user_id = u.id
    JOIN games g ON p.game_id = g.id
    LEFT JOIN post_media m
      ON m.post_id = p.id AND m.sort_order = 0
    LEFT JOIN post_likes pl
      ON pl.post_id = p.id AND pl.user_id = ?
    WHERE pbk.user_id = ?
    ORDER BY pbk.created_at DESC
    LIMIT ${offset}, ${limitNum}
  `;

  const [rows] = await db.query(sql, params);
  return rows;
}

// 3) 새 listPosts: 지금은 getFeed를 그대로 래핑만 해도 됨
async function listPosts(options) {
  return getFeed(options);
}

async function listUserPosts({ authorUserId, page = 1, limit = 12, currentUserId }) {
  const pageNum = Number.isFinite(page) ? Number(page) : 1;
  const limitNum = Number.isFinite(limit) ? Number(limit) : 12;
  const offset = (pageNum - 1) * limitNum;

  const viewerId = currentUserId || 0;

  const params = [viewerId, viewerId, authorUserId];

  const sql = `
    SELECT 
      p.id,
      p.user_id AS userId,
      u.username,
      u.nickname,
      u.avatar_url AS avatarUrl,
      g.id AS gameId,
      g.name AS gameName,
      g.slug AS gameSlug,
      p.caption,
      p.like_count AS likeCount,
      p.comment_count AS commentCount,
      p.created_at AS createdAt,
      m.url AS thumbUrl,
      m.media_type AS thumbType,
      IF(pl.user_id IS NULL, 0, 1) AS isLiked,
      IF(pb.user_id IS NULL, 0, 1) AS isBookmarked
    FROM posts p
    JOIN users u ON p.user_id = u.id
    JOIN games g ON p.game_id = g.id
    LEFT JOIN post_media m ON m.post_id = p.id AND m.sort_order = 0
    LEFT JOIN post_likes pl ON pl.post_id = p.id AND pl.user_id = ?
    LEFT JOIN post_bookmarks pb ON pb.post_id = p.id AND pb.user_id = ?
    WHERE p.user_id = ?
    ORDER BY p.created_at DESC
    LIMIT ${offset}, ${limitNum}
  `;

  const [rows] = await db.query(sql, params);
  return rows;
}

// 글 내용/게임만 수정 (이미지 수정은 나중에 별도)
async function updatePost(postId, userId, { caption, gameId }) {
  const [result] = await db.query(
    `
    UPDATE posts
    SET caption = ?, game_id = ?
    WHERE id = ? AND user_id = ?
  `,
    [caption, gameId, postId, userId]
  );

  return result.affectedRows; // 1이면 성공, 0이면 권한없음/없는글
}

async function deletePost(postId, userId) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 관련 미디어 먼저 삭제
    await conn.query("DELETE FROM post_tags WHERE post_id = ?", [postId]);
    await conn.query("DELETE FROM post_media WHERE post_id = ?", [postId]);

    const [result] = await conn.query(
      "DELETE FROM posts WHERE id = ? AND user_id = ?",
      [postId, userId]
    );

    await conn.commit();
    return result.affectedRows;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function findRandomPosts({ limit = 20 }) {
  const [rows] = await db.query(
    `
      SELECT
        p.id,
        p.caption,
        p.created_at AS createdAt,
        u.id AS userId,
        u.username,
        u.nickname,
        u.avatar_url AS avatarUrl,
        g.id AS gameId,
        g.name AS gameName,
        pm.url AS thumbUrl,
        pm.media_type AS thumbType
      FROM posts p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN games g ON g.id = p.game_id
      LEFT JOIN post_media pm
        ON pm.post_id = p.id
       AND pm.sort_order = 0      
      ORDER BY RAND()
      LIMIT ?
    `,
    [limit]
  );

  return rows;
}

// (A) 댓글 좋아요 추가
async function insertCommentLike(commentId, userId) {
  await db.query(
    `INSERT IGNORE INTO comment_likes (comment_id, user_id)
     VALUES (?, ?)`,
    [commentId, userId]
  );
};

// (B) 댓글 좋아요 취소
async function deleteCommentLike(commentId, userId) {
  await db.query(
    `DELETE FROM comment_likes
     WHERE comment_id = ? AND user_id = ?`,
    [commentId, userId]
  );
};

// (C) 댓글 좋아요 수
async function countCommentLikes(commentId) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS cnt
     FROM comment_likes
     WHERE comment_id = ?`,
    [commentId]
  );
  return rows[0]?.cnt || 0;
};

// (D) 댓글 단일 조회 (수정 후 반환용)
async function getCommentById(commentId, viewerId) {
  const [rows] = await db.query(
    `SELECT c.id,
            c.post_id    AS postId,
            c.user_id    AS userId,
            c.parent_comment_id  AS parentId,
            c.content,
            c.created_at AS createdAt,
            c.updated_at AS updatedAt,
            u.username,
            u.nickname,
            u.avatar_url AS avatarUrl,
            IFNULL(cl.cnt, 0) AS likeCount,
            CASE WHEN ul.user_id IS NULL THEN 0 ELSE 1 END AS isLiked
     FROM post_comments c
     JOIN users u ON u.id = c.user_id
     LEFT JOIN (
       SELECT comment_id, COUNT(*) AS cnt
       FROM comment_likes
       GROUP BY comment_id
     ) cl ON cl.comment_id = c.id
     LEFT JOIN comment_likes ul
       ON ul.comment_id = c.id AND ul.user_id = ?
     WHERE c.id = ?
     LIMIT 1`,
    [viewerId || 0, commentId]
  );
  return rows[0] || null;
};

// (E) 댓글 목록 조회 (뷰어 기준 좋아요 여부 포함)
async function getCommentsByPostIdWithLikes(postId, viewerId) {
  const [rows] = await db.query(
    `SELECT c.id,
            c.post_id    AS postId,
            c.user_id    AS userId,
            c.parent_comment_id  AS parentId,
            c.content,
            c.created_at AS createdAt,
            c.updated_at AS updatedAt,
            u.username,
            u.nickname,
            u.avatar_url AS avatarUrl,
            IFNULL(cl.cnt, 0) AS likeCount,
            CASE WHEN ul.user_id IS NULL THEN 0 ELSE 1 END AS isLiked
     FROM post_comments c
     JOIN users u ON u.id = c.user_id
     LEFT JOIN (
       SELECT comment_id, COUNT(*) AS cnt
       FROM comment_likes
       GROUP BY comment_id
     ) cl ON cl.comment_id = c.id
     LEFT JOIN comment_likes ul
       ON ul.comment_id = c.id AND ul.user_id = ?
     WHERE c.post_id = ?
     ORDER BY c.created_at ASC`,
    [viewerId || 0, postId]
  );
  return rows;
};

// (F) 댓글 수정
async function updateComment(commentId, userId, content) {
  const [result] = await db.query(
    `UPDATE post_comments
       SET content = ?, updated_at = NOW()
     WHERE id = ? AND user_id = ?`,
    [content, commentId, userId]
  );
  return result.affectedRows > 0;
};

// (G) 댓글 삭제
async function deleteComment(commentId, userId) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1) 댓글이 어떤 글의 누구 댓글인지 확인
    const [rows] = await conn.execute(
      `SELECT post_id, user_id FROM post_comments WHERE id = ?`,
      [commentId]
    );

    if (rows.length === 0) {
      await conn.rollback();
      return false; // 컨트롤러에서 403 / not found 처리
    }

    const postId = rows[0].post_id;
    const authorId = rows[0].user_id;

    // 2) 본인 댓글인지 확인 (관리자 체크 필요하면 여기에서)
    if (authorId !== userId) {
      await conn.rollback();
      return false;
    }

    // 3) 실제 삭제
    const [delResult] = await conn.execute(
      `DELETE FROM post_comments WHERE id = ?`,
      [commentId]
    );

    if (delResult.affectedRows > 0) {
      // 4) posts.comment_count 1 감소
      await conn.execute(
        `
        UPDATE posts
        SET comment_count = GREATEST(comment_count - 1, 0)
        WHERE id = ?
        `,
        [postId]
      );
    }

    await conn.commit();
    return true;
  } catch (err) {
    console.error("deleteComment model error:", err);
    try {
      await conn.rollback();
    } catch (rollbackErr) {
      console.error("rollback error:", rollbackErr);
    }
    throw err;
  } finally {
    conn.release();
  }
};

module.exports = {
  getFeed,
  getPostById,
  getMyPosts,
  getMyBookmarkedPosts,
  listPosts,
  listUserPosts,
  updatePost,
  deletePost,
  findRandomPosts,
  insertCommentLike,
  deleteCommentLike,
  countCommentLikes,
  getCommentById,
  getCommentsByPostIdWithLikes,
  updateComment,
  deleteComment,
};