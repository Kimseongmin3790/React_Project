const userStatsModel = require("../models/userStatsModel");
const achievementModel = require("../models/achievementModel");

/**
 * achievements.code 기준으로 어떤 조건일 때 언락되는지 정의
 * - achievements 테이블에 code 컬럼이 있어야 함 (예: 'FIRST_POST', 'POST_10' ...)
 */
const CONDITIONS = {
  FIRST_POST: (s) => s.post_count >= 1,
  POST_10: (s) => s.post_count >= 10,
  POST_50: (s) => s.post_count >= 50,

  LIKE_50: (s) => s.received_likes >= 50,
  LIKE_200: (s) => s.received_likes >= 200,

  COMMENT_20: (s) => s.received_comments >= 20,

  FIRST_MENTIONED: (s) => s.mentioned_count >= 1,

  LEVEL_5: (s) => s.level >= 5,
  LEVEL_10: (s) => s.level >= 10,
};

const EXP_REWARD = {
  FIRST_POST: 50,
  POST_10: 100,
  POST_50: 300,

  LIKE_50: 80,
  LIKE_200: 200,

  COMMENT_20: 150,

  FIRST_MENTION: 30,
  FIRST_MENTIONED: 30,

  LEVEL_5: 0,
  LEVEL_10: 0,
};

/**
 * stats 기준으로 잠금 해제 가능한 업적을 모두 검사하고
 * 새로 언락된 업적 리스트를 반환
 */
exports.checkAndUnlockAll = async (userId) => {
  const stats = await userStatsModel.getMyStats(userId);
  const allAchievements = await achievementModel.getAllAchievements();
  const ownedIds = new Set(
    await achievementModel.getUserAchievementIds(userId)
  );

  const newlyUnlocked = [];
  let bonusExp = 0;

  for (const ach of allAchievements) {
    if (ownedIds.has(ach.id)) continue; // 이미 가진 업적이면 패스

    const fn = CONDITIONS[ach.code];
    if (!fn) continue; // 코드에 해당하는 조건이 정의 안 돼 있으면 패스

    if (fn(stats)) {
      await achievementModel.insertUserAchievement(userId, ach.id);
      newlyUnlocked.push(ach);
      bonusExp += EXP_REWARD[ach.code] || 0;
    }
  }

  let updatedStats = stats;
  if (bonusExp > 0) {
    updatedStats = await userStatsModel.addExpFromAchievement(userId, bonusExp);
  }

  return {
    newlyUnlocked, // 프론트에서 토스트에 사용할 업적 리스트
    bonusExp, // 이번 이벤트로 업적 보너스로 얻은 EXP 총합
    updatedStats, // 보너스 EXP 및 레벨 반영된 최신 stats
  }
};

exports.unlockByCode= async (userId, code) => {
  const ach = await achievementModel.getAchievementByCode(code);
  if (!ach) return null;
  await achievementModel.insertUserAchievement(userId, ach.id);
  return ach;
};