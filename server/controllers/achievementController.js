const achievementModel = require("../models/achievementModel");

exports.getAllAchievementsForMe = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    const userId = user.id;

    const all = await achievementModel.getAllAchievements();
    const mine = await achievementModel.getUserAchievements(userId);

    const ownedMap = new Map(
      mine.map((r) => [r.achievement_id, r.achieved_at])
    );

    const achievements = all.map((a) => ({
      id: a.id,
      code: a.code,
      name: a.name,
      description: a.description,
      iconUrl: a.icon_url || null,
      unlocked: ownedMap.has(a.id),
      achievedAt: ownedMap.get(a.id) || null,
    }));

    res.json({ achievements });
  } catch (err) {
    console.error("getAllAchievementsForMe error:", err);
    res
      .status(500)
      .json({ message: "업적 목록을 불러오는 중 오류가 발생했습니다." });
  }
};
