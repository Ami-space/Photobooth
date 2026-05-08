const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET /api/stats/monthly?year=2026&month=5
router.get('/monthly', (req, res) => {
  const { year, month } = req.query;
  if (!year || !month) return res.status(400).json({ success: false, message: '请提供年份和月份' });

  const m = String(month).padStart(2, '0');
  const prefix = `${year}-${m}-%`;

  const orders = db.prepare(
    `SELECT * FROM orders WHERE wedding_date LIKE ? AND order_status != 'cancelled'`
  ).all(prefix);

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((s, o) => s + (o.total_amount || 0), 0);
  const totalCollected = orders.reduce((s, o) => s + (o.deposit_amount || 0) + (o.total_amount && o.payment_status === 'paid' ? o.total_amount : 0), 0);
  const avgPrice = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const completedOrders = orders.filter(o => o.order_status === 'completed').length;
  const paidOrders = orders.filter(o => o.payment_status === 'paid').length;

  res.json({
    success: true,
    data: {
      year: parseInt(year),
      month: parseInt(month),
      totalOrders,
      totalRevenue,
      avgPrice,
      completedOrders,
      paidOrders,
      orders,
    }
  });
});

// GET /api/stats/yearly?year=2026
router.get('/yearly', (req, res) => {
  const { year } = req.query;
  if (!year) return res.status(400).json({ success: false, message: '请提供年份' });

  const monthlyData = [];
  for (let m = 1; m <= 12; m++) {
    const prefix = `${year}-${String(m).padStart(2, '0')}-%`;
    const orders = db.prepare(
      `SELECT total_amount, order_status, payment_status FROM orders WHERE wedding_date LIKE ? AND order_status != 'cancelled'`
    ).all(prefix);

    monthlyData.push({
      month: m,
      orders: orders.length,
      revenue: orders.reduce((s, o) => s + (o.total_amount || 0), 0),
    });
  }

  res.json({ success: true, data: monthlyData });
});

// GET /api/settings
router.get('/settings', (req, res) => {
  const settings = db.prepare('SELECT * FROM settings').all();
  const obj = {};
  settings.forEach(s => { obj[s.key] = s.value; });
  res.json({ success: true, data: obj });
});

// PUT /api/settings
router.put('/settings', (req, res) => {
  const updates = req.body; // { key: value, ... }
  const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  for (const [key, value] of Object.entries(updates)) {
    stmt.run(key, String(value));
  }
  res.json({ success: true, message: '设置已保存' });
});

module.exports = router;
