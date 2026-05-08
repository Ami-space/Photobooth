# Photobooth 排单系统 — 部署指南

> 架构：**Vercel（前端）+ Railway（后端 + SQLite）**

---

## 一、准备工作

1. 注册 [GitHub](https://github.com) 并将代码 push 到仓库
2. 注册 [Vercel](https://vercel.com)（用 GitHub 账号登录）
3. 注册 [Railway](https://railway.app)（用 GitHub 账号登录）

---

## 二、部署后端到 Railway

### 2.1 新建 Railway 项目

1. 登录 Railway → **New Project → Deploy from GitHub repo**
2. 选择你的 `photobooth` 仓库
3. Railway 会自动检测 `railway.json` 并配置好构建和启动命令

### 2.2 配置环境变量

在 Railway 项目页面 → **Variables**，添加以下变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `NODE_ENV` | `production` | 必须设置 |
| `ADMIN_PASSWORD` | `admin123` | 登录密码（可自定义，**首次部署前设置**） |
| `CORS_ORIGIN` | `https://你的域名.vercel.app` | 稍后填入 Vercel 前端地址 |

> ⚠️ `PORT` 无需设置，Railway 自动注入。

### 2.3 配置持久化存储（防止重启丢数据）

1. Railway 项目页面 → **Volumes** → **Add Volume**
2. Mount Path 填写：`/data`
3. 回到 Variables，添加：`DB_PATH=/data/photobooth.db`

### 2.4 获取后端地址

部署成功后，在 **Settings → Networking → Public Networking → Generate Domain**，
得到类似 `https://photobooth-production.up.railway.app` 的地址，**记录下来**。

---

## 三、部署前端到 Vercel

### 3.1 导入项目

1. 登录 Vercel → **Add New Project → Import Git Repository**
2. 选择 `photobooth` 仓库
3. **Framework Preset** 选 **Vite**
4. **Root Directory** 保持为 `/`（根目录，使用 `vercel.json` 配置）

### 3.2 配置环境变量

在 Vercel 的 **Environment Variables** 中添加：

| 变量名 | 值 |
|--------|-----|
| `VITE_API_BASE_URL` | `https://photobooth-production.up.railway.app`（填你的 Railway 地址） |

### 3.3 完成部署

点击 **Deploy**，等待构建完成，获得类似 `https://photobooth-xxx.vercel.app` 的地址。

### 3.4 回填 CORS 配置

将 Vercel 的前端地址填回 Railway 的 `CORS_ORIGIN` 变量，然后**重启 Railway 服务**。

---

## 四、默认账号

| 用户名 | 密码 | 权限 |
|--------|------|------|
| `admin` | `admin123`（或你在 `ADMIN_PASSWORD` 中设置的值） | 管理员 |

> 首次登录后可在系统中自行添加更多用户账号。

---

## 五、更新发布流程

```bash
# 本地修改代码后
git add .
git commit -m "your commit message"
git push
```

Vercel 和 Railway 均支持 **GitHub 自动部署**，push 后会自动重新构建和发布，无需手动操作。

---

## 六、本地开发

```bash
# 安装依赖
npm --prefix client install
npm --prefix server install

# 启动后端（终端1）
npm --prefix server run dev

# 启动前端（终端2）
npm --prefix client run dev
```

访问 `http://localhost:5173`，API 请求自动代理到 `http://localhost:3001`。

---

## 七、常见问题

**Q: 重启后数据丢失？**  
A: 必须配置 Railway Volume（见步骤 2.3），否则容器重启会丢失 SQLite 文件。

**Q: 登录时提示跨域错误？**  
A: 检查 Railway 的 `CORS_ORIGIN` 是否填写了正确的 Vercel 前端地址（包含 `https://`），并重启 Railway 服务。

**Q: Vercel 刷新页面 404？**  
A: 根目录的 `vercel.json` 已配置 SPA 路由重写规则，正常情况不会出现此问题。
