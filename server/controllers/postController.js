// server/src/controllers/postController.js
const postModel = require('../models/postModel');

// 게시글 생성 (이미지는 multer로 미리 저장되어 있다고 가정)
exports.createPost = async (req, res) => {
  try {
    const userId = req.user.id; // auth 미들웨어에서 넣어준 값
    const { gameName, caption } = req.body;

    // multer 사용 시, 업로드된 파일 정보는 req.file 또는 req.files에 있음
    // 여기서는 단일 이미지만 받는다고 가정
    if (!req.file) {
      return res.status(400).json({ message: '이미지 파일이 필요합니다.' });
    }

    const imageUrl = `/uploads/${req.file.filename}`; // 정적 경로 규칙에 맞게 설정

    if (!gameName) {
      return res.status(400).json({ message: '게임 이름은 필수입니다.' });
    }

    const postId = await postModel.createPost({
      userId,
      gameName,
      caption: caption || '',
      imageUrl,
    });

    const post = await postModel.getPostById(postId);

    res.status(201).json({
      message: '게시글이 등록되었습니다.',
      post,
    });
  } catch (err) {
    console.error('createPost error:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

// 게시글 단건 조회
exports.getPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await postModel.getPostById(postId);

    if (!post) {
      return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    }

    res.json(post);
  } catch (err) {
    console.error('getPost error:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

// 피드 목록 조회 (최신순)
exports.getFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const offset = (page - 1) * limit;

    const posts = await postModel.getPostFeed({ limit, offset });

    res.json({
      page,
      limit,
      posts,
    });
  } catch (err) {
    console.error('getFeed error:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

// 특정 유저의 게시글 목록
exports.getUserPosts = async (req, res) => {
  try {
    const userId = req.params.userId;
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '12', 10);
    const offset = (page - 1) * limit;

    const posts = await postModel.getPostsByUserId(userId, { limit, offset });

    res.json({
      page,
      limit,
      posts,
    });
  } catch (err) {
    console.error('getUserPosts error:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

// 게시글 삭제 (작성자 본인만)
exports.deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    // 먼저 게시글 조회
    const post = await postModel.getPostById(postId);
    if (!post) {
      return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    }

    // 권한 체크: 내 글인지 확인
    if (post.userId !== userId) {
      return res.status(403).json({ message: '삭제 권한이 없습니다.' });
    }

    const deleted = await postModel.deletePost(postId);
    if (!deleted) {
      return res.status(500).json({ message: '삭제에 실패했습니다.' });
    }

    res.json({ message: '게시글이 삭제되었습니다.' });
  } catch (err) {
    console.error('deletePost error:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};
