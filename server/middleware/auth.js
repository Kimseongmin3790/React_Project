// middleware/auth.js
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');

module.exports = async function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: '인증이 필요합니다.' });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');

    const user = await userModel.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: '유효하지 않은 사용자입니다.' });
    }

    // 컨트롤러에서 쓸 수 있도록 최소 정보만 넣어두기
    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      nickname: user.nickname,
      avatarUrl: user.avatar_url,
    };

    next();
  } catch (err) {
    console.error('auth middleware error:', err);
    return res.status(401).json({ message: '토큰이 유효하지 않습니다.' });
  }
};
