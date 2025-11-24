// controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');

const SALT_ROUNDS = 10;

function signToken(user) {
  const payload = { id: user.id, username: user.username };
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// 회원가입
exports.register = async (req, res) => {
  try {
    const { email, password, username, nickname } = req.body;

    if (!email || !password || !username || !nickname) {
      return res.status(400).json({ message: '필수 항목이 누락되었습니다.' });
    }

    const existingEmail = await userModel.findByEmail(email);
    if (existingEmail) {
      return res.status(409).json({ message: '이미 사용 중인 이메일입니다.' });
    }

    const existingUsername = await userModel.findByUsername(username);
    if (existingUsername) {
      return res.status(409).json({ message: '이미 사용 중인 사용자명입니다.' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const userId = await userModel.createUser({
      email,
      passwordHash,
      username,
      nickname,
    });

    const user = await userModel.findById(userId);
    const token = signToken(user);

    res.status(201).json({
      message: '회원가입 성공',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        nickname: user.nickname,
        avatarUrl: user.avatar_url,
      },
    });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

// 로그인
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: '이메일과 비밀번호를 입력해주세요.' });
    }

    const user = await userModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    const token = signToken(user);

    res.json({
      message: '로그인 성공',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        nickname: user.nickname,
        avatarUrl: user.avatar_url,
      },
    });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

// 내 정보
exports.me = async (req, res) => {
  try {
    // auth 미들웨어가 req.user를 세팅해 줌
    res.json({ user: req.user });
  } catch (err) {
    console.error('me error:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};
