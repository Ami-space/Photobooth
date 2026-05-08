const express = require('express');
const cors = require('cors');
const path = require('path');
const { router: authRouter, tokens } = require('./routes/auth');
const ordersRouter = require('./routes/orders');
const devicesRouter = require('./routes/devices');
const staffRouter = require('./routes/staff');
const statsRouter = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS：生产环境通过 CORS_ORIGIN 环境变量指定允许的域名（逗号分隔）
// 例如: CORS_ORIGIN=https://photobooth.vercel.app,https://my-domain.com
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : null;

app.use(cors({
  origin: allowedOrigins || true,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 认证中间件
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !tokens.has(token)) {
    return res.status(401).json({ success: false, message: '请先登录' });
  }
  req.currentUser = tokens.get(token);
  next();
}

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Photobooth Server Running', time: new Date().toISOString() });
});

// 注册路由
app.use('/api/auth', authRouter);
app.use('/api/orders', requireAuth, ordersRouter);
app.use('/api/devices', requireAuth, devicesRouter);
app.use('/api/staff', requireAuth, staffRouter);
app.use('/api/stats', requireAuth, statsRouter);

// 生产环境：仅在 client/dist 存在时才托管静态文件
// （Railway 上只跑后端，静态文件由 Vercel 托管，此块不会执行）
if (process.env.NODE_ENV === 'production' && process.env.SERVE_STATIC === 'true') {
  const clientDist = path.join(__dirname, '../client/dist');
  const fs = require('fs');
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get('/*path', (req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }
}

// 全局错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: '服务器内部错误', error: err.message });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🎉 Photobooth 服务器启动成功`);
  console.log(`📡 本地访问: http://localhost:${PORT}`);
  console.log(`🌐 局域网访问: http://<本机IP>:${PORT}`);
  console.log(`\n默认账号:`);
  console.log(`  admin / admin123`);
  console.log(`  manaiji / manaiji123`);
  console.log(`  liulala / liulala123\n`);
});

module.exports = app;
