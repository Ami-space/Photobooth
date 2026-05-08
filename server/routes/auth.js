const express = require('express');
const router = express.Router();
const db = require('../db/database');

// 简单 Token 认证（生产环境建议使用 JWT）
const tokens = new Map(); // token -> { username, display_name, role }

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: '请输入用户名和密码' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);
  if (!user) {
    return res.status(401).json({ success: false, message: '用户名或密码错误' });
  }

  // 生成简单 token
  const token = Buffer.from(`${username}:${Date.now()}:photobooth`).toString('base64');
  tokens.set(token, {
    id: user.id,
    username: user.username,
    display_name: user.display_name,
    role: user.role,
  });

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      role: user.role,
    },
  });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) tokens.delete(token);
  res.json({ success: true });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const user = tokens.get(token);
  if (!user) return res.status(401).json({ success: false, message: '未登录' });
  res.json({ success: true, user });
});

// 导出 tokens map 供中间件使用
module.exports = { router, tokens };
