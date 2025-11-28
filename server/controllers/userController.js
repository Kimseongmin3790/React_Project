const userStatsModel = require("../models/userStatsModel");
const userModel = require("../models/userModel");
const achievementModel = require("../models/achievementModel");

exports.getMyStats = async (req, res) => {
  const userId = req.user.id;
  try {
    const stats = await userStatsModel.getMyStats(userId);
    const achievements = await achievementModel.getUserAchievements(userId);

    const expForNextLevel = stats.level * 100; // 레벨 n -> n+1 기준 exp
    const expIntoLevel = stats.exp - (stats.level - 1) * 100;
    const expProgressPercent = Math.max(
      0,
      Math.min(100, Math.floor((expIntoLevel / 100) * 100))
    );

    res.json({
      stats: {
        userId: stats.user_id,
        postCount: stats.post_count,
        receivedLikes: stats.received_likes,
        receivedComments: stats.received_comments,
        exp: stats.exp,
        level: stats.level,
        expForNextLevel,
        expProgressPercent,
      },
      achievements,
    });
  } catch (err) {
    console.error("getMyStats error:", err);
    res.status(500).json({ error: "레벨 정보 조회 중 오류" });
  }
};

// GET /users/:userId/followers
exports.listFollowers = async (req, res) => {
  try {
    let { userId } = req.params;
    if (userId === "me") {
      userId = req.user.id; // authMiddleware에서 넣어주는 현재 로그인 유저
    }

    const targetId = Number(userId);
    if (!targetId) {
      return res.status(400).json({ error: "잘못된 userId 입니다." });
    }

    const followers = await userModel.getFollowers(targetId);
    res.json(followers);
  } catch (err) {
    console.error("listFollowers error:", err);
    res.status(500).json({ error: "팔로워 목록 조회 중 오류가 발생했습니다." });
  }
};

// GET /users/:userId/following
exports.listFollowing = async (req, res) => {
  try {
    let { userId } = req.params;
    if (userId === "me") {
      userId = req.user.id;
    }

    const targetId = Number(userId);
    if (!targetId) {
      return res.status(400).json({ error: "잘못된 userId 입니다." });
    }

    const following = await userModel.getFollowing(targetId);
    res.json(following);
  } catch (err) {
    console.error("listFollowing error:", err);
    res.status(500).json({ error: "팔로우 목록 조회 중 오류가 발생했습니다." });
  }
};

// GET /users/:userId
exports.getUserProfile = async (req, res) => {
  try {
    let { userId } = req.params;

    // /users/me 로도 접근 가능하게 하고 싶으면
    if (userId === "me") {
      userId = req.user.id; // authMiddleware에서 세팅해준 로그인 유저 id
    }

    const idNum = Number(userId);
    if (!idNum) {
      return res.status(400).json({ error: "잘못된 userId입니다." });
    }

    const user = await userModel.getUserById(idNum);
    if (!user) {
      return res.status(404).json({ error: "유저를 찾을 수 없습니다." });
    }

    res.json(user);
  } catch (err) {
    console.error("getUserProfile error:", err);
    res
      .status(500)
      .json({ error: "유저 정보 조회 중 오류가 발생했습니다." });
  }
};

// POST /api/users/:targetUserId/block
exports.blockUser = async (req, res) => {
  try {
    const blockerId = req.user.id;
    const targetId = Number(req.params.targetUserId);

    if (blockerId === targetId) {
      return res
        .status(400)
        .json({ message: "자기 자신은 차단할 수 없습니다." });
    }

    await userModel.blockUser(blockerId, targetId);
    res.json({ ok: true });
  } catch (err) {
    console.error("blockUser error:", err);
    res.status(500).json({ message: "차단 처리 중 오류가 발생했습니다." });
  }
};

// DELETE /api/users/:targetUserId/block
exports.unblockUser = async (req, res) => {
  try {
    const blockerId = req.user.id;
    const targetId = Number(req.params.targetUserId);

    await userModel.unblockUser(blockerId, targetId);
    res.json({ ok: true });
  } catch (err) {
    console.error("unblockUser error:", err);
    res.status(500).json({ message: "차단 해제 중 오류가 발생했습니다." });
  }
};

exports.createReport = async (req, res) => {
  try {
    const reporterId = req.user.id;
    const { targetUserId, targetPostId, reason } = req.body;

    if (!reason || (!targetUserId && !targetPostId)) {
      return res
        .status(400)
        .json({ message: "신고 대상 또는 사유가 부족합니다." });
    }

    const id = await userModel.createReport({
      reporterId,
      targetUserId,
      targetPostId,
      reason,
    });

    res.json({ ok: true, id });
  } catch (err) {
    console.error("createReport error:", err);
    res.status(500).json({ message: "신고 접수 중 오류가 발생했습니다." });
  }
};
