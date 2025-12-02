const express = require("express");
const router = express.Router();
const tagController = require("../controllers/tagController");

// 특정 태그의 게시글
router.get("/:tagName/posts", tagController.getPostsByTag);

// 인기 태그 목록
router.get("/popular", tagController.getPopularTags);

module.exports = router;