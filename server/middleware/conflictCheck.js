const db = require('../db/database');

/**
 * 检测时间冲突
 * 返回冲突的订单列表（排除当前编辑的订单）
 */
function checkConflict(wedding_date, start_time, end_time, excludeId = null) {
  let sql = `
    SELECT id, customer_name, start_time, end_time, hotel_name, order_status
    FROM orders
    WHERE wedding_date = ?
      AND order_status != 'cancelled'
      AND start_time < ?
      AND end_time > ?
  `;
  const params = [wedding_date, end_time, start_time];

  if (excludeId) {
    sql += ` AND id != ?`;
    params.push(excludeId);
  }

  return db.prepare(sql).all(...params);
}

module.exports = { checkConflict };
