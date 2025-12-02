const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const chatModel = require("../models/chatModel");
const chatController = require("../controllers/chatController");

router.get("/unread", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const rooms = await chatModel.getUnreadSummary(userId);
    res.json({ rooms });
  } catch (err) {
    console.error("GET /api/chat/unread error:", err);
    res.status(500).json({ message: "안읽은 채팅 조회 중 오류가 발생했습니다." });
  }
});

router.get("/rooms/:roomId/meta", authMiddleware, chatController.getRoomMeta);

module.exports = router;
