const gameModel = require("../models/gameModel");

exports.listGames = async (req, res) => {
  try {
    const games = await gameModel.getAllGames();
    // [{ id, name, slug }, ...]
    res.json({ games });
  } catch (err) {
    console.error("listGames error:", err);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};

exports.getGameRanking = async (req, res) => {
  try {
    const raw = req.query.rangeDays;
    let rangeDays = null;

    if (raw !== undefined) {
      const n = parseInt(raw, 10);
      if (!Number.isNaN(n) && n > 0) {
        rangeDays = n;
      }
    }

    const rows = await gameModel.getRankingGames(rangeDays);

    const games = rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      thumbnailUrl: row.thumbnailUrl,
      postCount: row.postCount,
      totalLikes: row.totalLikes,
      totalComments: row.totalComments,
      lastPostAt: row.lastPostAt,
      // 점수는 프론트에서 쓰기 좋게 대충 계산
      score: row.totalLikes * 2 + row.totalComments + row.postCount,
    }));

    res.json({ games });
  } catch (err) {
    console.error("getGameRanking error:", err);
    res
      .status(500)
      .json({ message: "인기 게임 랭킹 조회 중 오류가 발생했습니다." });
  }
};
