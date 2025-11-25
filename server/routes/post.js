// server/src/routes/postRoutes.js
const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const authMiddleware = require('../middleware/auth');
const { uploadPostMedia } = require("../middleware/upload");

// 피드 목록
router.get('/', authMiddleware, postController.getFeed);

// 글 작성 (로그인 필요)
router.post('/', authMiddleware, uploadPostMedia, postController.createPost);

// 좋아요/취소
router.post('/:postId/like', authMiddleware, postController.likePost);
router.delete('/:postId/like', authMiddleware, postController.unlikePost);

module.exports = router;
