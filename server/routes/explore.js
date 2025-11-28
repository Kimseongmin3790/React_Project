// routes/exploreRoutes.js
const express = require("express");
const router = express.Router();
const exploreController = require("../controllers/exploreController");

// 인증은 선택사항: 로그인 안 해도 탐색 가능하게 할 거면 미들웨어 없이 사용
// GET /api/explore/summary?days=7&tagsLimit=20&gamesLimit=10&postsLimit=20
router.get("/summary", exploreController.getExploreSummary);

module.exports = router;
