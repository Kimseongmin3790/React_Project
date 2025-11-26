// controllers/authController.js
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const db = require("../db");

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

exports.resetPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "이메일을 입력해주세요." });
  }

  try {
    const [rows] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ ok: false, message: "등록된 이메일이 없습니다." });
    }

    const userId = rows[0].id;

    // 임시 비밀번호 생성 (8자리 정도)
    const tempPassword = crypto.randomBytes(4).toString("hex"); // 예: "9f3a21bc"

    const hash = await bcrypt.hash(tempPassword, 10);

    await db.query(
      "UPDATE users SET password_hash = ? WHERE id = ?",
      [hash, userId]
    );

    return res.json({
      ok: true,
      message: "임시 비밀번호가 발급되었습니다.",
      tempPassword, // 프론트에서 보여주기
    });
  } catch (err) {
    console.error("resetPassword error:", err);
    return res.status(500).json({
      ok: false,
      message: "비밀번호 재설정 중 오류가 발생했습니다.",
    });
  }
};
