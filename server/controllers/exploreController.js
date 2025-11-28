// controllers/exploreController.js
const tagModel = require("../models/tagModel");
const gameModel = require("../models/gameModel");
const postModel = require("../models/postModel");

exports.getExploreSummary = async (req, res) => {
  try {
    const days = req.query.days ? Number(req.query.days) : 7; // 최근 7일 기본
    const tagsLimit = Number(req.query.tagsLimit) || 20;
    const gamesLimit = Number(req.query.gamesLimit) || 10;
    const postsLimit = Number(req.query.postsLimit) || 20;

    const [popularTags, trendingGames, randomPosts] = await Promise.all([
      tagModel.findPopularTags({ limit: tagsLimit, days }),            // 위에서 만든 함수 재사용
      gameModel.findTrendingGames({ limit: gamesLimit, days }),        // 새로 추가
      postModel.findRandomPosts({ limit: postsLimit }),                 // 새로 추가
    ]);

    res.json({
      popularTags,
      trendingGames,
      randomPosts,
    });
  } catch (err) {
    console.error("getExploreSummary error:", err);
    res
      .status(500)
      .json({ message: "탐색 데이터 조회 중 오류가 발생했습니다." });
  }
};
