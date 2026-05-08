const express = require('express');
const router = express.Router();
const db = require('../db/database');

const USER_ROLES = ['manager', 'staff'];

function normalizeRole(role) {
  return String(role || '').trim().toLowerCase();
}

function requireAccountManager(req, res, next) {
  const role = normalizeRole(req.currentUser?.role);
  if (!['admin', 'manager'].includes(role)) {
    return res.status(403).json({ success: false, message: '仅管理员或店长可操作账号管理' });
  }
  next();
}

function sanitizeUser(user) {
  return {
    id: user.id,
    username: user.username,
    display_name: user.display_name || '',
    role: user.role,
    created_by: user.created_by,
    created_at: user.created_at,
  };
}

function canManageUser(currentUser, targetUser) {
  const currentRole = normalizeRole(currentUser?.role);
  const targetRole = normalizeRole(targetUser?.role);
  if (currentRole === 'admin') return targetRole !== 'admin';
  return targetRole === 'staff' && Number(targetUser.created_by) === Number(currentUser.id);
}

router.use(requireAccountManager);

// GET /api/users
router.get('/', (req, res) => {
  const role = normalizeRole(req.currentUser?.role);
  const users = role === 'admin'
    ? db.prepare(
      `SELECT id, username, display_name, role, created_by, created_at
       FROM users
       ORDER BY CASE WHEN role = 'admin' THEN 0 WHEN role = 'manager' THEN 1 ELSE 2 END, id`
    ).all()
    : db.prepare(
      `SELECT id, username, display_name, role, created_by, created_at
       FROM users
       WHERE role = 'staff' AND created_by = ?
       ORDER BY id`
    ).all(req.currentUser.id);
  res.json({ success: true, data: users });
});

// POST /api/users
router.post('/', (req, res) => {
  const { username, password, display_name, role } = req.body;
  const currentRole = normalizeRole(req.currentUser?.role);
  if (!username || !password) {
    return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
  }
  if (!USER_ROLES.includes(role)) {
    return res.status(400).json({ success: false, message: '仅支持创建 manager/staff 账号' });
  }
  if (currentRole === 'manager' && role !== 'staff') {
    return res.status(403).json({ success: false, message: '店长只能创建员工账号' });
  }

  const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (exists) {
    return res.status(400).json({ success: false, message: '用户名已存在' });
  }

  const result = db.prepare(
    'INSERT INTO users (username, password, display_name, role, created_by) VALUES (?, ?, ?, ?, ?)'
  ).run(username, password, display_name || '', role, req.currentUser.id);

  const created = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ success: true, data: sanitizeUser(created) });
});

// PUT /api/users/:id
router.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  const { username, display_name, role } = req.body;
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ success: false, message: '账号不存在' });
  }
  if (!canManageUser(req.currentUser, existing)) {
    return res.status(403).json({ success: false, message: '无权修改该账号' });
  }
  if (role && !USER_ROLES.includes(role)) {
    return res.status(400).json({ success: false, message: '角色仅支持 manager/staff' });
  }
  if (normalizeRole(req.currentUser?.role) === 'manager' && role && role !== 'staff') {
    return res.status(403).json({ success: false, message: '店长只能设置员工账号' });
  }
  if (username && username !== existing.username) {
    const taken = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (taken) return res.status(400).json({ success: false, message: '用户名已存在' });
  }

  db.prepare('UPDATE users SET username = ?, display_name = ?, role = ? WHERE id = ?').run(
    username || existing.username,
    display_name ?? existing.display_name,
    role || existing.role,
    id
  );

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  res.json({ success: true, data: sanitizeUser(updated) });
});

// PUT /api/users/:id/password
router.put('/:id/password', (req, res) => {
  const id = Number(req.params.id);
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ success: false, message: '新密码不能为空' });
  }

  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ success: false, message: '账号不存在' });
  }
  if (!canManageUser(req.currentUser, existing)) {
    return res.status(403).json({ success: false, message: '无权重置该账号密码' });
  }

  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(password, id);
  res.json({ success: true, message: '密码已更新' });
});

// DELETE /api/users/:id
router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ success: false, message: '账号不存在' });
  }
  if (!canManageUser(req.currentUser, existing)) {
    return res.status(403).json({ success: false, message: '无权删除该账号' });
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.json({ success: true, message: '账号已删除' });
});

module.exports = router;
