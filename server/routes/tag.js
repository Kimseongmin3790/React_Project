const express = require("express");
const router = express.Router();
const tagController = require("../controllers/tagController");

// 특정 태그의 게시글
// GET /api/tags/:tagName/posts
router.get("/:tagName/posts", tagController.getPostsByTag);

// 트렌딩 태그
// GET /api/tags/trending
router.get("/trending/list", tagController.getTrendingTags);

module.exports = router;