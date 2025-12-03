const postModel = require('../models/postModel');
const db = require("../db");
const gameModel = require('../models/gameModel');
const notificationService = require('../services/notificationService');
const notificationModel = require('../models/notificationModel');
const userStatsModel = require('../models/userStatsModel');
const achievementService = require('../services/achievementService');
const { syncPostHashtags } = require("../services/hashtagService");

exports.createPost = async (req, res) => {
  const conn = await db.getConnection();
  let postId;
  let game;
  let caption;
  let user;
  try {
    user = req.user;
    if (!user) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    const { gameId, caption: rawCaption } = req.body;
    caption = rawCaption || "";

    const gameIdNum = Number.parseInt(gameId, 10);
    if (!gameIdNum) {
      return res.status(400).json({ message: "유효한 게임을 선택해주세요." });
    }

    game = await gameModel.findById(gameIdNum);
    if (!game) {
      return res.status(400).json({ message: "존재하지 않는 게임입니다." });
    }

    const files = req.files || {};
    const imageFiles = files.images || [];
    const videoFiles = files.videos || [];

    if (imageFiles.length === 0 && videoFiles.length === 0) {
      return res.status(400).json({ message: "이미지나 동영상을 최소 1개 이상 첨부해주세요" });
    }

    await conn.beginTransaction();

    // posts INSERT
    const [result] = await conn.execute(
      `INSERT INTO posts (user_id, game_id, caption)
       VALUES (?, ?, ?)`,
      [user.id, gameIdNum, caption]
    );
    postId = result.insertId;

    // 2) post_media INSERT (이미지 먼저, 그 다음 영상)
    let sortOrder = 0;

    for (const file of imageFiles) {
      const url = `/uploads/${file.filename}`;
      await conn.execute(
        `INSERT INTO post_media (post_id, media_type, url, sort_order)
         VALUES (?, 'IMAGE', ?, ?)`,
        [postId, url, sortOrder++]
      );
    }

    for (const file of videoFiles) {
      const url = `/uploads/${file.filename}`;
      await conn.execute(
        `INSERT INTO post_media (post_id, media_type, url, sort_order)
         VALUES (?, 'VIDEO', ?, ?)`,
        [postId, url, sortOrder++]
      );
    }

    await conn.commit();
  } catch (err) {
    console.error("createPost error:", err);
    try {
      await conn.rollback();
    } catch (rbErr) {
      console.error("createPost rollback error:", rbErr);
    }
    conn.release();
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }

  // 해시태그 동기화
  try {
    await syncPostHashtags(postId, caption);
  } catch (tagErr) {
    console.log("syncPostHashtags error (createPost):", tagErr)
  }

  // 팔로워 알림
  try {
    await notificationService.notifyFollowersNewPost({
      actor: user,
      postId,
      caption
    });
  } catch (notifyErr) {
    console.error("notifyFollowersNewPost error:", notifyErr);
  }

  // 유저 통계 업데이트
  let userStats = null;
  try {
    await userStatsModel.updateOnNewPost(user.id);
    
    const { newlyUnlocked, bonusExp, updatedStats } = 
      await achievementService.checkAndUnlockAll(user.id);

    userStats = updatedStats;

    conn.release();

    return res.status(201).json({
      message: "게시글이 등록되었습니다.",
      post: {
        id: postId,
        userId: user.id,
        username: user.username,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        gameId: game.id,
        gameName: game.name,
        gameSlug: game.slug,
        caption,
        likeCount: 0,
        commentCount: 0,
        createdAt: new Date().toISOString(),
      },
      userStats,            
      unlockedAchievements: newlyUnlocked, 
      bonusExp,           
    });
  } catch (statsErr) {
    console.error("stats/achievement error (createPost):", statsErr);
    conn.release();
    return res.status(201).json({
      message: "게시글이 등록되었습니다. (통계/업적 반영 중 일부 오류)",
      post: {
        id: postId,
        userId: user.id,
        username: user.username,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        gameId: game.id,
        gameName: game.name,
        gameSlug: game.slug,
        caption,
        likeCount: 0,
        commentCount: 0,
        createdAt: new Date().toISOString(),
      },
      userStats: null,
      unlockedAchievements: [],
      bonusExp: 0,
    });
  }

};

// 피드 조회: 로그인 여부와 상관 없이 전체 피드
exports.getFeed = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page, 10) || 1;
    const limit = Number.parseInt(req.query.limit, 10) || 10;

    const gameId = req.query.gameId ? Number.parseInt(req.query.gameId, 10) : null;

    const currentUserId = req.user?.id || null;

    const posts = await postModel.getFeed({ page, limit, gameId, currentUserId });

    res.json({
      page,
      limit,
      posts,
    });
  } catch (err) {
    console.error("getFeed error:", err);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};

// 피드 좋아요
exports.likePost = async (req, res) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "인증이 필요합니다." });
  }

  const postId = Number.parseInt(req.params.postId, 10);
  if (!postId) {
    return res.status(400).json({ message: "잘못된 게시글입니다." });
  }

  const conn = await db.getConnection();
  let postAuthorId = null;

  try {
    await conn.beginTransaction();

    const [postRows] = await conn.execute(
      `SELECT user_id FROM posts WHERE id = ?`,
      [postId]
    );
    if (postRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
    }
    postAuthorId = postRows[0].user_id;

    // 이미 좋아요 되어있는지 확인
    const [exists] = await conn.execute(
      `SELECT 1 FROM post_likes WHERE post_id = ? AND user_id = ?`,
      [postId, user.id]
    );

    let inserted = false;

    if (exists.length === 0) {

      await conn.execute(
        `INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)`,
        [postId, user.id]
      );
      await conn.execute(
        `UPDATE posts SET like_count = like_count + 1 WHERE id = ?`,
        [postId]
      );
      inserted = true;
    }

    const [rows] = await conn.execute(
      `SELECT like_count FROM posts WHERE id = ?`,
      [postId]
    );
    const likeCount = rows[0]?.like_count ?? 0;

    await conn.commit();

    let achievementResult = {
      newlyUnlocked: [],
      bonusExp: 0,
      updatedStats: null,
    };

    if (inserted && postAuthorId && postAuthorId !== user.id) {
      try {
        await userStatsModel.updateOnReceivedLike(postAuthorId);

        achievementResult = await achievementService.checkAndUnlockAll(postAuthorId);

        if (achievementResult.newlyUnlocked.length > 0) {
          console.log("like로 언락된 업적:", achievementResult.newlyUnlocked.map((a) => a.code));
        }
      } catch (achErr) {
        console.error("achievement check error (likePost):", achErr);
      }
    }
    conn.release();

    res.json({ liked: true, likeCount, achievementResult });
  } catch (err) {
    console.error("likePost error:", err);
    await conn.rollback();
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  } finally {
    conn.release();
  }
};

// 피드 좋아요 해제
exports.unlikePost = async (req, res) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "인증이 필요합니다." });
  }

  const postId = Number.parseInt(req.params.postId, 10);
  if (!postId) {
    return res.status(400).json({ message: "잘못된 게시글입니다." });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [exists] = await conn.execute(
      `SELECT 1 FROM post_likes WHERE post_id = ? AND user_id = ?`,
      [postId, user.id]
    );

    if (exists.length > 0) {
      await conn.execute(
        `DELETE FROM post_likes WHERE post_id = ? AND user_id = ?`,
        [postId, user.id]
      );
      await conn.execute(
        `UPDATE posts 
         SET like_count = GREATEST(like_count - 1, 0)
         WHERE id = ?`,
        [postId]
      );
    }

    const [rows] = await conn.execute(
      `SELECT like_count FROM posts WHERE id = ?`,
      [postId]
    );
    const likeCount = rows[0]?.like_count ?? 0;

    await conn.commit();

    res.json({ liked: false, likeCount });
  } catch (err) {
    console.error("unlikePost error:", err);
    await conn.rollback();
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  } finally {
    conn.release();
  }
};

// 피드 북마크
exports.bookmarkPost = async (req, res) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "인증이 필요합니다." });
  }

  const postId = Number.parseInt(req.params.postId, 10);
  if (!postId) {
    return res.status(400).json({ message: "잘못된 게시글입니다." });
  }

  try {
    await db.execute(
      `INSERT IGNORE INTO post_bookmarks (post_id, user_id)
       VALUES (?, ?)`,
      [postId, user.id]
    );

    res.json({ bookmarked: true });
  } catch (err) {
    console.error("bookmarkPost error:", err);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};

// 피드 북마크 해제
exports.unbookmarkPost = async (req, res) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "인증이 필요합니다." });
  }

  const postId = Number.parseInt(req.params.postId, 10);
  if (!postId) {
    return res.status(400).json({ message: "잘못된 게시글입니다." });
  }

  try {
    await db.execute(
      `DELETE FROM post_bookmarks
       WHERE post_id = ? AND user_id = ?`,
      [postId, user.id]
    );

    res.json({ bookmarked: false });
  } catch (err) {
    console.error("unbookmarkPost error:", err);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};

// 타겟 피드 댓글 조회
exports.getComments = async (req, res) => {
  try {
    const postId = Number.parseInt(req.params.postId, 10);
    if (!postId) {
      return res.status(400).json({ message: "잘못된 게시글입니다." });
    }

    const [rows] = await db.execute(
      `
      SELECT
        pc.id,
        pc.post_id AS postId,
        pc.user_id AS userId,
        pc.parent_comment_id AS parentCommentId,
        pc.content,
        pc.created_at AS createdAt,
        u.username,
        u.nickname,
        u.avatar_url AS avatarUrl,
        IFNULL(cl.cnt, 0) AS likeCount
      FROM post_comments pc
      JOIN users u ON u.id = pc.user_id
      LEFT JOIN (
        SELECT comment_id, COUNT(*) AS cnt
        FROM comment_likes
        GROUP BY comment_id
      ) cl ON cl.comment_id = pc.id
      WHERE pc.post_id = ?
      ORDER BY pc.created_at ASC
      `,
      [postId]
    );

    res.json({ comments: rows });
  } catch (err) {
    console.error("getComments error:", err);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};

// 댓글 작성
exports.createComment = async (req, res, next) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "인증이 필요합니다." });
  }

  const postId = Number.parseInt(req.params.postId, 10);
  const { content, parentCommentId } = req.body;

  if (!postId) {
    return res.status(400).json({ message: "잘못된 게시글입니다." });
  }
  if (!content || !content.trim()) {
    return res.status(400).json({ message: "댓글 내용을 입력해주세요." });
  }

  let conn;
  let postAuthorId = null;
  let commentId = null;
  let createdAt = null;

  try {
    conn = await db.getConnection();
    await conn.beginTransaction();

    // 게시글 작성자 조회
    const [postRows] = await conn.execute(
      `SELECT user_id FROM posts WHERE id = ?`,
      [postId]
    );
    if (postRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
    }
    postAuthorId = postRows[0].user_id;

    // 부모 댓글 검증 (대댓글인 경우)
    let parentIdForInsert = null;
    if (parentCommentId) {
      const pid = Number(parentCommentId);
      if (!Number.isNaN(pid)) {
        const [pcRows] = await conn.execute(
          `SELECT id FROM post_comments WHERE id = ? AND post_id = ?`,
          [pid, postId]
        );
        if (pcRows.length > 0) {
          parentIdForInsert = pid;
        }
      }
    }

    // 댓글 INSERT
    const [result] = await conn.execute(
      `
      INSERT INTO post_comments (post_id, user_id, parent_comment_id, content)
      VALUES (?, ?, ?, ?)
      `,
      [postId, user.id, parentIdForInsert, content.trim()]
    );
    commentId = result.insertId;

    // posts.comment_count 증가
    await conn.execute(
      `
      UPDATE posts
      SET comment_count = comment_count + 1
      WHERE id = ?
      `,
      [postId]
    );

    // 방금 INSERT한 created_at 조회
    const [cRows] = await conn.execute(
      `SELECT created_at FROM post_comments WHERE id = ?`,
      [commentId]
    );
    createdAt = cRows[0]?.created_at || new Date();

    await conn.commit();
  } catch (err) {
    console.error("createComment error (tx):", err);
    if (conn) {
      try {
        await conn.rollback();
      } catch (e) {
        console.error("rollback error:", e);
      }
    }
    return res.status(500).json({ message: "서버 오류가 발생했습니다." });
  } finally {
    if (conn) conn.release();
  }

  // 게시글 작성자: 댓글 을 ‘받은’ 쪽 업적
  let achievementResult = {
    newlyUnlocked: [],
    bonusExp: 0,
    updatedStats: null,
  };

  if (postAuthorId && postAuthorId !== user.id) {
    try {
      await userStatsModel.updateOnReceivedComment(postAuthorId);
      achievementResult =
        await achievementService.checkAndUnlockAll(postAuthorId);
    } catch (achErr) {
      console.error("achievement check error (postAuthor, createComment):", achErr);
    }
  }

  // 댓글 작성자: "댓글 달기" 관련 업적 (ex. 첫 댓글, 댓글 10개 등)
  let commentAuthorAchievementResult = {
    newlyUnlocked: [],
    bonusExp: 0,
    updatedStats: null,
  };

  try {
    await userStatsModel.updateOnWriteComment(user.id);
    commentAuthorAchievementResult =
      await achievementService.checkAndUnlockAll(user.id);
  } catch (err) {
    console.error("achievement check error (commentAuthor, createComment):", err);
  }

  // 멘션 처리: @username 패턴 찾기
  let mentionResults = [];
  try {
    const mentionRegex = /@([^\s@]+)/g;
    const usernames = new Set();
    let m;

    while ((m = mentionRegex.exec(content)) !== null) {      
      if (m[1]) {
        usernames.add(m[1]);
      }
    }

    if (usernames.size > 0) {
      const usernameList = Array.from(usernames);
      const placeholders = usernameList.map(() => "?").join(",");
      const [rows] = await db.query(
        `
        SELECT id, username, nickname
        FROM users
        WHERE username IN (${placeholders})
           OR nickname IN (${placeholders})
        `,
        [...usernameList, ...usernameList]
      );

      for (const row of rows) {        
        if (row.id === user.id) continue;

        // 멘션 알림 생성
        try {
          await notificationService.notifyCommentMention({
            receiverId: row.id,
            actor: user,
            postId,
            content,
          });
        } catch (notifErr) {
          console.error("createForCommentMention error:", notifErr);
        }

        // 멘션 관련 통계 / 업적 (멘션 ‘된’ 유저 기준)
        try {
          await userStatsModel.updateOnMentioned(row.id);
          const achRes = await achievementService.checkAndUnlockAll(row.id);

          mentionResults.push({
            userId: row.id,
            username: row.username,
            newlyUnlocked: achRes.newlyUnlocked || [],
          });
        } catch (mentionAchErr) {
          console.error(
            "achievement check error (mentioned user):",
            mentionAchErr
          );
        }
      }
    }

    if (hasAnyMentionTarget) {
      try {
        const firstMentionRes = 
          await achievementService.unlockByCode(user.id, "FIRST_MENTION");
        if (
          firstMentionRes &&
          firstMentionRes.newlyUnlocked &&
          firstMentionRes.newlyUnlocked.length > 0
        ) {
          console.log(
            "FIRST_MENTION 언락(댓글 작성자):",
            firstMentionRes.newlyUnlocked.map((a) => a.code)
          );
        }
      } catch (authorMentionErr) {
        console.error(
          "achievement unlock error (FIRST_MENTION, commentAuthor):",
          authorMentionErr
        );
      }
    }

  } catch (mentionErr) {
    console.error("mention 처리 중 오류:", mentionErr);
  }

  // 최종 응답
  return res.status(201).json({
    comment: {
      id: commentId,
      postId,
      userId: user.id,
      parentCommentId: parentCommentId || null,
      content,
      createdAt,
      nickname: user.nickname,
      username: user.username,
      avatarUrl: user.avatarUrl,
    },
    achievementResult,
    commentAuthorAchievementResult,
    mentionResults,
  });
};

// 피드 상세
exports.getPostDetail = async (req, res) => {
  try {
    const postId = Number.parseInt(req.params.postId, 10);
    if (!postId) {
      return res.status(400).json({ message: "잘못된 게시글입니다." });
    }

    const currentUserId = req.user?.id || null;

    const post = await postModel.getPostById({ postId, currentUserId });
    if (!post) {
      return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
    }

    res.json({ post });
  } catch (err) {
    console.error("getPostDetail error:", err);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};

// 내 피드 목록
exports.getMyPosts = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    const page = Number.parseInt(req.query.page, 10) || 1;
    const limit = Number.parseInt(req.query.limit, 10) || 10;

    const posts = await postModel.getMyPosts({
      userId: user.id,
      page,
      limit,
    });

    res.json({ page, limit, posts });
  } catch (err) {
    console.error("getMyPosts error:", err);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};

// 내가 북마크한 피드 목록
exports.getMyBookmarkedPosts = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    const page = Number.parseInt(req.query.page, 10) || 1;
    const limit = Number.parseInt(req.query.limit, 10) || 10;

    const posts = await postModel.getMyBookmarkedPosts({
      userId: user.id,
      page,
      limit,
    });

    res.json({ page, limit, posts });
  } catch (err) {
    console.error("getMyBookmarkedPosts error:", err);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};

// 피드 리스트
exports.listPosts = async (req, res) => {
  const {
    page = 1,
    limit = 10,
    gameId,
    sort = "latest",
    period = "all",
  } = req.query;

  const currentUserId = req.user ? req.user.id : null;

  try {
    const posts = await postModel.listPosts({
      page,
      limit,
      gameId,
      currentUserId,
      sort,
      period,
    });

    res.json(posts);
  } catch (err) {
    console.error("listPosts error:", err);
    res.status(500).json({ error: "피드 조회 중 오류가 발생했습니다." });
  }
};

// 타겟 유저의 피드 목록
exports.listUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const viewerId = req.user.id;

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 12;

    const posts = await postModel.listUserPosts({
      authorUserId: Number(userId),
      page,
      limit,
      currentUserId: viewerId,
    });

    res.json(posts);
  } catch (err) {
    console.error("listUserPosts error:", err);
    res.status(500).json({ error: "유저 게시글 조회 중 오류가 발생했습니다." });
  }
};

// 피드 수정
exports.updatePost = async (req, res) => {
  const postId = Number(req.params.postId);
  const userId = req.user.id;

  const { caption, gameId, replaceMedia } = req.body;

  if (!postId) {
    return res
      .status(400)
      .json({ message: "잘못된 게시글입니다." });
  }

  if (!caption || !gameId) {
    return res
      .status(400)
      .json({ message: "caption과 gameId는 필수입니다." });
  }

  const gameIdNum = Number.parseInt(gameId, 10);
  if (!gameIdNum) {
    return res
      .status(400)
      .json({ message: "유효한 게임을 선택해주세요." });
  }

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // 작성자 확인
    const [rows] = await conn.execute(
      `SELECT user_id FROM posts WHERE id = ?`,
      [postId]
    );
    if (rows.length === 0) {
      await conn.rollback();
      conn.release();
      return res
        .status(404)
        .json({ message: "게시글을 찾을 수 없습니다." });
    }
    const postAuthorId = rows[0].user_id;
    if (postAuthorId !== userId) {
      await conn.rollback();
      conn.release();
      return res
        .status(403)
        .json({ message: "수정 권한이 없습니다." });
    }

    // 기본 정보 업데이트 (캡션 / 게임)
    await conn.execute(
      `
      UPDATE posts
      SET caption = ?, game_id = ?
      WHERE id = ?
      `,
      [caption, gameIdNum, postId]
    );

    // 미디어 교체 여부 확인
    const files = req.files || {};
    const imageFiles = files.images || [];
    const videoFiles = files.videos || [];

    const hasNewMedia =
      imageFiles.length > 0 || videoFiles.length > 0;
    const shouldReplace =
      hasNewMedia &&
      (replaceMedia === "true" || replaceMedia === true);

    if (shouldReplace) {
      // 기존 미디어 삭제
      await conn.execute(
        `DELETE FROM post_media WHERE post_id = ?`,
        [postId]
      );

      // 새 미디어 저장
      let sortOrder = 0;

      for (const file of imageFiles) {
        const url = `/uploads/${file.filename}`;
        await conn.execute(
          `INSERT INTO post_media (post_id, media_type, url, sort_order)
           VALUES (?, 'IMAGE', ?, ?)`,
          [postId, url, sortOrder++]
        );
      }

      for (const file of videoFiles) {
        const url = `/uploads/${file.filename}`;
        await conn.execute(
          `INSERT INTO post_media (post_id, media_type, url, sort_order)
           VALUES (?, 'VIDEO', ?, ?)`,
          [postId, url, sortOrder++]
        );
      }
    }

    await conn.commit();
  } catch (err) {
    console.error("updatePost error:", err);
    await conn.rollback();
    conn.release();
    return res
      .status(500)
      .json({ message: "게시글 수정 중 오류가 발생했습니다." });
  } finally {
    conn.release();
  }

  // 해시태그 재동기화
  try {
    await syncPostHashtags(postId, caption);
  } catch (tagErr) {
    console.log("syncPostHashtags error (updatePost):", tagErr);
  }

  return res.json({ ok: true });
};

// 피드 삭제
exports.deletePost = async (req, res) => {
  try {
    const postId = Number(req.params.postId);
    const userId = req.user.id;

    const affected = await postModel.deletePost(postId, userId);

    if (affected === 0) {
      return res
        .status(403)
        .json({ message: "삭제 권한이 없거나 존재하지 않는 게시글입니다." });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("deletePost error:", err);
    res.status(500).json({ message: "게시글 삭제 중 오류가 발생했습니다." });
  }
};

// 댓글 좋아요
exports.likeComment = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const commentId = parseInt(req.params.commentId, 10);

    await postModel.insertCommentLike(commentId, userId);
    const likeCount = await postModel.countCommentLikes(commentId);

    res.json({ liked: true, likeCount });
  } catch (err) {
    next(err);
  }
};

// 댓글 좋아요 취소
exports.unlikeComment = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const commentId = parseInt(req.params.commentId, 10);

    await postModel.deleteCommentLike(commentId, userId);
    const likeCount = await postModel.countCommentLikes(commentId);

    res.json({ liked: false, likeCount });
  } catch (err) {
    next(err);
  }
};

// 댓글 수정
exports.updateComment = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const commentId = parseInt(req.params.commentId, 10);
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "댓글 내용을 입력해 주세요." });
    }

    const ok = await postModel.updateComment(
      commentId,
      userId,
      content.trim()
    );
    if (!ok) {
      return res
        .status(403)
        .json({ error: "수정 권한이 없거나 댓글이 존재하지 않습니다." });
    }

    const updated = await postModel.getCommentById(commentId, userId);
    res.json({ comment: updated });
  } catch (err) {
    next(err);
  }
};

// 댓글 삭제
exports.deleteComment = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const commentId = parseInt(req.params.commentId, 10);

    const ok = await postModel.deleteComment(commentId, userId);
    if (!ok) {
      return res
        .status(403)
        .json({ error: "삭제 권한이 없거나 댓글이 존재하지 않습니다." });
    }

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};