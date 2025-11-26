// server/controllers/notificationController.js
const notificationModel = require("../models/notificationModel");

exports.getSummary = async (req, res) => {
  const userId = req.user.id;

  try {
    const summary = await notificationModel.getSummaryByUserId(userId);
    res.json(summary);
  } catch (err) {
    console.error("GET /notifications/summary error:", err);
    res.status(500).json({ message: "알림 정보 조회 중 오류가 발생했습니다." });
  }
};

exports.markAllRead = async (req, res) => {
  const userId = req.user.id;

  try {
    await notificationModel.markAllReadByUserId(userId);
    res.json({ success: true });
  } catch (err) {
    console.error("POST /notifications/read-all error:", err);
    res.status(500).json({ message: "알림 읽음 처리 중 오류가 발생했습니다." });
  }
};
