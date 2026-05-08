const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET /api/devices
router.get('/', (req, res) => {
  const devices = db.prepare('SELECT * FROM devices WHERE active = 1 ORDER BY id').all();
  res.json({ success: true, data: devices });
});

// POST /api/devices
router.post('/', (req, res) => {
  const { name, type } = req.body;
  if (!name) return res.status(400).json({ success: false, message: '设备名称不能为空' });
  const result = db.prepare('INSERT INTO devices (name, type) VALUES (?, ?)').run(name, type || '');
  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ success: true, data: device });
});

// PUT /api/devices/:id
router.put('/:id', (req, res) => {
  const { name, type, active } = req.body;
  const existing = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: '设备不存在' });
  db.prepare('UPDATE devices SET name = ?, type = ?, active = ? WHERE id = ?').run(
    name ?? existing.name, type ?? existing.type, active ?? existing.active, req.params.id
  );
  const updated = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id);
  res.json({ success: true, data: updated });
});

// DELETE /api/devices/:id (软删除)
router.delete('/:id', (req, res) => {
  db.prepare('UPDATE devices SET active = 0 WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: '已停用' });
});

// GET /api/devices/busy/:date - 查询某日期已被占用的设备
router.get('/busy/:date', (req, res) => {
  const { date } = req.params;
  const orders = db.prepare(
    `SELECT device_ids FROM orders WHERE wedding_date = ? AND order_status != 'cancelled'`
  ).all(date);

  const busyIds = new Set();
  for (const o of orders) {
    const ids = JSON.parse(o.device_ids || '[]');
    ids.forEach(id => busyIds.add(id));
  }
  res.json({ success: true, data: Array.from(busyIds) });
});

module.exports = router;
