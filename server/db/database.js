const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// 数据库路径：优先使用环境变量 DB_PATH（Railway 挂载持久化卷时使用）
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/photobooth.db');

// 确保 data 目录存在
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// 启用 WAL 模式，提升并发性能
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// 初始化表结构
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    display_name TEXT,
    role TEXT DEFAULT 'admin',
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS staff (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    role TEXT DEFAULT 'photographer',
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    wedding_date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    hotel_name TEXT,
    hall_name TEXT,
    package_type TEXT DEFAULT 'standard',
    price REAL DEFAULT 1288,
    staff_ids TEXT DEFAULT '[]',
    device_ids TEXT DEFAULT '[]',
    order_status TEXT DEFAULT 'pending',
    payment_status TEXT DEFAULT 'unpaid',
    deposit_amount REAL DEFAULT 0,
    total_amount REAL DEFAULT 0,
    payment_method TEXT,
    payment_date TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime'))
  );
`);

function ensureColumn(table, column, definition) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all();
  const exists = columns.some((c) => c.name === column);
  if (!exists) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

ensureColumn('orders', 'extra_albums', 'INTEGER DEFAULT 0');
ensureColumn('orders', 'album_unit_price', 'REAL DEFAULT 35');
ensureColumn('orders', 'material_fee', 'REAL DEFAULT 0');
ensureColumn('users', 'created_by', 'INTEGER');

// 插入默认数据（如果不存在）
const insertSetting = db.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`);
insertSetting.run('max_orders_per_day', '1');
insertSetting.run('company_name', 'Wedding Photobooth');
insertSetting.run('album_unit_price', '35');
insertSetting.run(
  'package_configs',
  JSON.stringify([
    { key: 'pkg_2h', label: '2小时', hours: 2, price: 1388 },
    { key: 'pkg_3h', label: '3小时', hours: 3, price: 1688 },
    { key: 'pkg_4h', label: '4小时', hours: 4, price: 1988 },
  ])
);

// 默认管理员账号
// 密码可通过 ADMIN_PASSWORD 环境变量覆盖（默认 admin123）
const insertUser = db.prepare(`INSERT OR IGNORE INTO users (username, password, display_name, role) VALUES (?, ?, ?, ?)`);
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
insertUser.run('admin', adminPassword, '管理员', 'admin');

// 默认人员
const insertStaff = db.prepare(`INSERT OR IGNORE INTO staff (id, name, role) VALUES (?, ?, ?)`);
insertStaff.run(1, '麻乃吉', 'photographer');
insertStaff.run(2, '刘拉拉', 'photographer');

// 默认设备
const insertDevice = db.prepare(`INSERT OR IGNORE INTO devices (id, name, type) VALUES (?, ?, ?)`);
insertDevice.run(1, '相机1', 'camera');
insertDevice.run(2, '相机2', 'camera');
insertDevice.run(3, 'iPad1', 'tablet');
insertDevice.run(4, '补光灯1', 'light');
insertDevice.run(5, '补光灯2', 'light');

module.exports = db;
