const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { checkConflict } = require('../middleware/conflictCheck');

function normalizeOrderStatus(paymentStatus, orderStatus) {
  if (paymentStatus === 'unpaid' && !['pending', 'cancelled'].includes(orderStatus)) {
    return 'pending';
  }
  if (paymentStatus === 'deposit' && !['pending', 'confirmed', 'cancelled'].includes(orderStatus)) {
    return 'pending';
  }
  if (paymentStatus === 'paid' && !['completed', 'cancelled'].includes(orderStatus)) {
    return 'completed';
  }
  return orderStatus;
}

function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  try {
    return JSON.parse(value || '[]');
  } catch {
    return [];
  }
}

// GET /api/orders - 获取订单列表（支持筛选）
router.get('/', (req, res) => {
  const { date, status, payment_status, keyword, month, year } = req.query;
  let sql = 'SELECT * FROM orders WHERE 1=1';
  const params = [];

  if (date) { sql += ' AND wedding_date = ?'; params.push(date); }
  if (status) { sql += ' AND order_status = ?'; params.push(status); }
  if (payment_status) { sql += ' AND payment_status = ?'; params.push(payment_status); }
  if (year && month) {
    const m = String(month).padStart(2, '0');
    sql += ` AND wedding_date LIKE ?`; params.push(`${year}-${m}-%`);
  }
  if (keyword) {
    sql += ' AND (customer_name LIKE ? OR customer_phone LIKE ? OR hotel_name LIKE ?)';
    const k = `%${keyword}%`;
    params.push(k, k, k);
  }

  sql += ' ORDER BY wedding_date DESC, start_time DESC';
  const orders = db.prepare(sql).all(...params);
  res.json({ success: true, data: orders });
});

// GET /api/orders/calendar/:year/:month - 日历视图数据
router.get('/calendar/:year/:month', (req, res) => {
  const { year, month } = req.params;
  const m = String(month).padStart(2, '0');
  const orders = db.prepare(
    `SELECT id, customer_name, customer_phone, wedding_date, hall_name, package_type, price,
    staff_ids, device_ids, start_time, end_time, deposit_amount, total_amount, payment_method, payment_date, notes,
    extra_albums, album_unit_price, material_fee,order_status, payment_status, hotel_name
     FROM orders WHERE wedding_date LIKE ? AND order_status != 'cancelled'
     ORDER BY start_time ASC`
  ).all(`${year}-${m}-%`);

  // 按日期分组
  const byDate = {};
  for (const o of orders) {
    if (!byDate[o.wedding_date]) byDate[o.wedding_date] = [];
    byDate[o.wedding_date].push(o);
  }

  // 获取每日最大场数配置
  const setting = db.prepare(`SELECT value FROM settings WHERE key = 'max_orders_per_day'`).get();
  const maxPerDay = parseInt(setting?.value || '1', 10);

  res.json({ success: true, data: byDate, maxPerDay });
});

// GET /api/orders/:id - 获取单个订单
router.get('/:id', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: '订单不存在' });
  res.json({ success: true, data: order });
});

// POST /api/orders - 新增订单
router.post('/', (req, res) => {
  let {
    customer_name, customer_phone, wedding_date, start_time, end_time,
    hotel_name, hall_name, package_type, price,
    staff_ids, device_ids, order_status, payment_status,
    deposit_amount, total_amount, payment_method, deposit_payment_method, final_payment_method, payment_date, notes,
    extra_albums, album_unit_price, material_fee,
    force = false  // 强制忽略冲突
  } = req.body;
  payment_status = payment_status || 'unpaid';
  order_status = normalizeOrderStatus(payment_status, order_status || 'pending');

  if (!customer_name || !wedding_date || !start_time || !end_time) {
    return res.status(400).json({ success: false, message: '客户姓名、日期、时间为必填项' });
  }

  // 冲突检测
  if (!force) {
    const conflicts = checkConflict(wedding_date, start_time, end_time);
    if (conflicts.length > 0) {
      return res.status(409).json({
        success: false,
        conflict: true,
        message: '该时间段已有订单',
        conflicts,
      });
    }
  }

  const stmt = db.prepare(`
    INSERT INTO orders (
      customer_name, customer_phone, wedding_date, start_time, end_time,
      hotel_name, hall_name, package_type, price,
      staff_ids, device_ids, order_status, payment_status,
      deposit_amount, total_amount, payment_method, deposit_payment_method, final_payment_method, payment_date, notes,
      extra_albums, album_unit_price, material_fee
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    customer_name, customer_phone || '', wedding_date, start_time, end_time,
    hotel_name || '', hall_name || '', package_type || 'standard', price || 1288,
    JSON.stringify(staff_ids || []), JSON.stringify(device_ids || []),
    order_status, payment_status,
    deposit_amount || 0, total_amount || price || 1288,
    payment_method || '',
    req.body.deposit_payment_method || '',
    req.body.final_payment_method || '',
    payment_date || '', notes || '',
    Number(extra_albums || 0), Number(album_unit_price || 35), Number(material_fee || 0)
  );

  const newOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ success: true, data: newOrder });
});

// PUT /api/orders/:id - 修改订单
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ success: false, message: '订单不存在' });

  let {
    customer_name, customer_phone, wedding_date, start_time, end_time,
    hotel_name, hall_name, package_type, price,
    staff_ids, device_ids, order_status, payment_status,
    deposit_amount, total_amount, payment_method, deposit_payment_method, final_payment_method, payment_date, notes,
    extra_albums, album_unit_price, material_fee,
    force = false
  } = req.body;

  const existingStatus = existing.order_status;
  const isFinalOrder = ['completed', 'cancelled'].includes(existingStatus);
  const isConfirmedOrder = existingStatus === 'confirmed';
  const nextPaymentStatus = isFinalOrder ? existing.payment_status : (payment_status ?? existing.payment_status);
  const nextOrderStatus = normalizeOrderStatus(nextPaymentStatus, order_status ?? existing.order_status);
  const newDate = (isFinalOrder || isConfirmedOrder) ? existing.wedding_date : (wedding_date || existing.wedding_date);
  const newStart = (isFinalOrder || isConfirmedOrder) ? existing.start_time : (start_time || existing.start_time);
  const newEnd = (isFinalOrder || isConfirmedOrder) ? existing.end_time : (end_time || existing.end_time);

  // 冲突检测（排除自身）
  if (!force && !isFinalOrder && !isConfirmedOrder && (wedding_date || start_time || end_time)) {
    const conflicts = checkConflict(newDate, newStart, newEnd, id);
    if (conflicts.length > 0) {
      return res.status(409).json({
        success: false,
        conflict: true,
        message: '该时间段已有订单',
        conflicts,
      });
    }
  }

  db.prepare(`
    UPDATE orders SET
      customer_name = ?, customer_phone = ?, wedding_date = ?, start_time = ?, end_time = ?,
      hotel_name = ?, hall_name = ?, package_type = ?, price = ?,
      staff_ids = ?, device_ids = ?, order_status = ?, payment_status = ?,
      deposit_amount = ?, total_amount = ?, payment_method = ?, deposit_payment_method = ?, final_payment_method = ?, payment_date = ?,
      notes = ?, extra_albums = ?, album_unit_price = ?, material_fee = ?,
      updated_at = datetime('now','localtime')
    WHERE id = ?
  `).run(
    (isFinalOrder || isConfirmedOrder) ? existing.customer_name : (customer_name ?? existing.customer_name),
    (isFinalOrder || isConfirmedOrder) ? existing.customer_phone : (customer_phone ?? existing.customer_phone),
    newDate, newStart, newEnd,
    (isFinalOrder || isConfirmedOrder) ? existing.hotel_name : (hotel_name ?? existing.hotel_name),
    (isFinalOrder || isConfirmedOrder) ? existing.hall_name : (hall_name ?? existing.hall_name),
    isFinalOrder ? existing.package_type : (package_type ?? existing.package_type),
    isFinalOrder ? existing.price : (price ?? existing.price),
    JSON.stringify(isFinalOrder ? parseJsonArray(existing.staff_ids) : (staff_ids ?? parseJsonArray(existing.staff_ids))),
    JSON.stringify(isFinalOrder ? parseJsonArray(existing.device_ids) : (device_ids ?? parseJsonArray(existing.device_ids))),
    nextOrderStatus,
    nextPaymentStatus,
    isFinalOrder ? existing.deposit_amount : (deposit_amount ?? existing.deposit_amount),
    isFinalOrder ? existing.total_amount : (total_amount ?? existing.total_amount),
    isFinalOrder ? existing.payment_method : (payment_method ?? existing.payment_method),
    isFinalOrder ? existing.deposit_payment_method : (deposit_payment_method ?? existing.deposit_payment_method),
    isFinalOrder ? existing.final_payment_method : (final_payment_method ?? existing.final_payment_method),
    isFinalOrder ? existing.payment_date : (payment_date ?? existing.payment_date),
    notes ?? existing.notes,
    isFinalOrder ? existing.extra_albums : (extra_albums ?? existing.extra_albums),
    isFinalOrder ? existing.album_unit_price : (album_unit_price ?? existing.album_unit_price),
    isFinalOrder ? existing.material_fee : (material_fee ?? existing.material_fee),
    id
  );

  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  res.json({ success: true, data: updated });
});

// DELETE /api/orders/:id - 删除订单
router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: '订单不存在' });
  db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: '删除成功' });
});

module.exports = router;
