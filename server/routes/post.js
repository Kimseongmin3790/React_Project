// server/src/routes/postRoutes.js
const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const authMiddleware = require('../middleware/auth');
const { uploadPostMedia } = require("../middleware/upload");

// 내 글 / 내 북마크
router.get("/my", authMiddleware, postController.getMyPosts);
router.get("/bookmarks", authMiddleware, postController.getMyBookmarkedPosts);

// 글 목록
router.get('/', authMiddleware, postController.getFeed);

// 글 상세
router.get("/:postId", authMiddleware, postController.getPostDetail);

// 글 작성 (로그인 필요)
router.post('/', authMiddleware, uploadPostMedia, postController.createPost);

// 댓글 조회
router.get("/:postId/comments", postController.getComments);

// 댓글 작성
router.post("/:postId/comments", authMiddleware, postController.createComment);

// 좋아요/취소
router.post('/:postId/like', authMiddleware, postController.likePost);
router.delete('/:postId/like', authMiddleware, postController.unlikePost);

// 북마크
router.post("/:postId/bookmark", authMiddleware, postController.bookmarkPost);
router.delete("/:postId/bookmark", authMiddleware, postController.unbookmarkPost);

module.exports = router;
