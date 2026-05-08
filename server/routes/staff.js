const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET /api/staff
router.get('/', (req, res) => {
  const staff = db.prepare('SELECT * FROM staff WHERE active = 1 ORDER BY id').all();
  res.json({ success: true, data: staff });
});

// POST /api/staff
router.post('/', (req, res) => {
  const { name, phone, role } = req.body;
  if (!name) return res.status(400).json({ success: false, message: '姓名不能为空' });
  const result = db.prepare('INSERT INTO staff (name, phone, role) VALUES (?, ?, ?)').run(
    name, phone || '', role || 'photographer'
  );
  const member = db.prepare('SELECT * FROM staff WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ success: true, data: member });
});

// PUT /api/staff/:id
router.put('/:id', (req, res) => {
  const { name, phone, role, active } = req.body;
  const existing = db.prepare('SELECT * FROM staff WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: '人员不存在' });
  db.prepare('UPDATE staff SET name=?, phone=?, role=?, active=? WHERE id=?').run(
    name ?? existing.name, phone ?? existing.phone,
    role ?? existing.role, active ?? existing.active, req.params.id
  );
  const updated = db.prepare('SELECT * FROM staff WHERE id = ?').get(req.params.id);
  res.json({ success: true, data: updated });
});

// DELETE /api/staff/:id (软删除)
router.delete('/:id', (req, res) => {
  db.prepare('UPDATE staff SET active = 0 WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: '已停用' });
});

module.exports = router;
