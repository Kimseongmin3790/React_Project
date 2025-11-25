const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const chatModel = require("../models/chatModel");

// GET /api/chat/unread
router.get("/unread", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const rooms = await chatModel.getUnreadSummary(userId);
    // rooms: [{ roomId, unreadCount }]
    res.json({ rooms });
  } catch (err) {
    console.error("GET /api/chat/unread error:", err);
    res.status(500).json({ message: "안읽은 채팅 조회 중 오류가 발생했습니다." });
  }
});

module.exports = router;
