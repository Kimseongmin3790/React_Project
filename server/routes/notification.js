// server/routes/notification.js
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const notificationController = require("../controllers/notificationController");

router.get("/summary", authMiddleware, notificationController.getSummary);
router.post("/read-all", authMiddleware, notificationController.markAllRead);

module.exports = router;
