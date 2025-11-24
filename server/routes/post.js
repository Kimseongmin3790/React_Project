// server/src/routes/postRoutes.js
const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload'); // multer 설정

// 피드 목록 (비로그인도 볼 수 있게 할지, 로그인만 볼 수 있게 할지 결정)
router.get('/', postController.getFeed);

// 단일 게시글 조회
router.get('/:id', postController.getPost);

// 특정 유저 게시글 목록 (필요 시)
router.get('/user/:userId', postController.getUserPosts);

// 게시글 생성 (로그인 + 이미지 업로드 필요)
router.post(
  '/',
  authMiddleware,          // JWT 검사해서 req.user 세팅
  upload.single('image'),  // form-data의 image 필드
  postController.createPost
);

// 게시글 삭제 (로그인 필요)
router.delete('/:id', authMiddleware, postController.deletePost);

module.exports = router;
