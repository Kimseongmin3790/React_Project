const express = require("express");
const router = express.Router();
const tagController = require("../controllers/tagController");

// 특정 태그의 게시글
// GET /api/tags/:tagName/posts
router.get("/:tagName/posts", tagController.getPostsByTag);

// 인기 태그 목록
// GET /api/tags/popular?limit=20&days=7
router.get("/popular", tagController.getPopularTags);

module.exports = router;