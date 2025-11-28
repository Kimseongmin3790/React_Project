const db = require("../db");
const tagModel = require("../models/tagModel");

exports.getPostsByTag = async (req, res) => {
  const rawTag = req.params.tagName || "";
  const tagName = rawTag.toLowerCase();

  const {
    sort = "latest",   // latest | popular
    period = "all",    // all | 7d | 30d
    limit = 20,
    offset = 0,
  } = req.query;

  // 기간 필터
  let dateCondition = "";
  if (period === "7d") {
    dateCondition = "AND p.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
  } else if (period === "30d") {
    dateCondition = "AND p.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
  }

  // 정렬 기준
  let orderBy = "p.created_at DESC";
  if (sort === "popular") {
    orderBy = "p.like_count DESC, p.created_at DESC";
  }

  try {
    const [rows] = await db.query(
      `
      SELECT
        p.id,
        p.caption,
        p.user_id        AS userId,
        u.username,
        u.nickname,
        u.avatar_url     AS avatarUrl,
        g.name           AS gameName,
        pm.url           AS thumbUrl,
        pm.media_type     AS thumbType,
        p.like_count     AS likeCount,
        p.comment_count  AS commentCount,
        p.created_at     AS createdAt
      FROM tags t
      JOIN post_tags pt ON pt.tag_id = t.id
      JOIN posts p          ON p.id = pt.post_id
      JOIN post_media pm    ON pm.post_id = p.id
      JOIN users u          ON u.id = p.user_id
      LEFT JOIN games g     ON g.id = p.game_id
      WHERE t.name = ?
        ${dateCondition}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
      `,
      [tagName, Number(limit), Number(offset)]
    );

    res.json(rows);
  } catch (err) {
    console.error("getPostsByTag error:", err);
    res
      .status(500)
      .json({ message: "태그 기준 게시글 목록을 불러오는 중 오류가 발생했습니다." });
  }
};

exports.getPopularTags = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 20;
    const days = req.query.days ? Number(req.query.days) : null;

    const tags = await tagModel.findPopularTags({ limit, days });

    res.json(tags); // [{ id, name, postCount }, ...]
  } catch (err) {
    console.error("getPopularTags error:", err);
    res
      .status(500)
      .json({ message: "인기 태그 조회 중 오류가 발생했습니다." });
  }
};