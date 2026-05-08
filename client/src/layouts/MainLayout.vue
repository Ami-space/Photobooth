<template>
  <div class="layout">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-brand">
        <div class="brand-icon">💍</div>
        <transition name="fade-slide">
          <span v-if="!sidebarCollapsed" class="brand-name">Photobooth</span>
        </transition>
      </div>

      <nav class="sidebar-nav">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: isActive(item.path) }"
        >
          <el-icon class="nav-icon"><component :is="item.icon" /></el-icon>
          <transition name="fade-slide">
            <span v-if="!sidebarCollapsed" class="nav-label">{{ item.label }}</span>
          </transition>
          <transition name="fade-slide">
            <span v-if="!sidebarCollapsed && item.badge" class="nav-badge">{{ item.badge }}</span>
          </transition>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <div class="user-info" v-if="!sidebarCollapsed">
          <div class="user-avatar">{{ userInitial }}</div>
          <div class="user-details">
            <div class="user-name">{{ authStore.user?.display_name }}</div>
            <div class="user-role">管理员</div>
          </div>
        </div>
        <div v-else class="user-avatar-sm">{{ userInitial }}</div>
        <el-tooltip :content="sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'" placement="right">
          <button class="collapse-btn" @click="sidebarCollapsed = !sidebarCollapsed">
            <el-icon><component :is="sidebarCollapsed ? 'ArrowRight' : 'ArrowLeft'" /></el-icon>
          </button>
        </el-tooltip>
      </div>
    </aside>

    <!-- Main -->
    <div class="main-wrapper">
      <!-- Header -->
      <header class="topbar">
        <div class="topbar-left">
          <span class="topbar-title">{{ currentTitle }}</span>
        </div>
        <div class="topbar-right">
          <el-tooltip content="新增订单" placement="bottom">
            <el-button type="primary" size="small" circle @click="$router.push('/orders/new')">
              <el-icon><Plus /></el-icon>
            </el-button>
          </el-tooltip>
          <el-dropdown @command="handleCommand">
            <div class="topbar-user">
              <div class="topbar-avatar">{{ userInitial }}</div>
              <el-icon class="dropdown-arrow"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon> 退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <!-- Page Content -->
      <main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="page" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const sidebarCollapsed = ref(false)

const navItems = [
  { path: '/calendar', label: '排期日历', icon: 'Calendar' },
  { path: '/orders',   label: '订单管理', icon: 'Tickets' },
  { path: '/payment',  label: '收款管理', icon: 'CreditCard' },
  { path: '/devices',  label: '设备管理', icon: 'Camera' },
  { path: '/staff',    label: '人员管理', icon: 'User' },
  { path: '/pricing',  label: '套餐配置', icon: 'Setting' },
  { path: '/stats',    label: '数据统计', icon: 'TrendCharts' },
]

const isActive = (path) => route.path === path || route.path.startsWith(path + '/')
const currentTitle = computed(() => route.meta.title || 'Photobooth')
const userInitial = computed(() => {
  const name = authStore.user?.display_name || 'A'
  return name.charAt(0)
})

async function handleCommand(cmd) {
  if (cmd === 'logout') {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', { type: 'warning' })
    await authStore.logout()
    router.push('/login')
  }
}
</script>

<style scoped>
.layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* ── Sidebar ── */
.sidebar {
  width: var(--sidebar-width);
  min-height: 100vh;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  flex-shrink: 0;
  position: relative;
  z-index: 100;
}
.sidebar.collapsed { width: 64px; }

.sidebar-brand {
  height: var(--header-height);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 16px;
  border-bottom: 1px solid var(--color-border);
  overflow: hidden;
}
.brand-icon {
  width: 36px; height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  display: flex; align-items: center; justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(99,102,241,0.4);
}
.brand-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text);
  white-space: nowrap;
  background: linear-gradient(135deg, var(--color-primary-light), var(--color-accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.sidebar-nav {
  flex: 1;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  text-decoration: none;
  color: var(--color-text-2);
  font-size: 14px;
  font-weight: 500;
  transition: var(--transition);
  white-space: nowrap;
  overflow: hidden;
  position: relative;
}
.nav-item:hover { background: var(--color-surface-2); color: var(--color-text); }
.nav-item.active {
  background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(236,72,153,0.1));
  color: var(--color-primary-light);
  border: 1px solid rgba(99,102,241,0.2);
}
.nav-item.active .nav-icon { color: var(--color-primary-light); }
.nav-icon { font-size: 18px; flex-shrink: 0; }
.nav-label { flex: 1; }
.nav-badge {
  background: var(--color-primary);
  color: #fff;
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 10px;
}

.sidebar-footer {
  padding: 12px;
  border-top: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  gap: 8px;
}
.user-info { display: flex; align-items: center; gap: 8px; flex: 1; overflow: hidden; }
.user-avatar {
  width: 32px; height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 700; color: #fff;
  flex-shrink: 0;
}
.user-avatar-sm {
  width: 32px; height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 700; color: #fff;
}
.user-name { font-size: 13px; font-weight: 600; color: var(--color-text); white-space: nowrap; }
.user-role { font-size: 11px; color: var(--color-text-3); }
.collapse-btn {
  width: 28px; height: 28px;
  border-radius: 8px;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  color: var(--color-text-2);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: var(--transition);
  flex-shrink: 0;
}
.collapse-btn:hover { background: var(--color-surface-3); color: var(--color-text); }

/* ── Main ── */
.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--color-bg);
}

/* ── Topbar ── */
.topbar {
  height: var(--header-height);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  flex-shrink: 0;
}
.topbar-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
}
.topbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.topbar-user {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: var(--transition);
}
.topbar-user:hover { background: var(--color-surface-2); }
.topbar-avatar {
  width: 30px; height: 30px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700; color: #fff;
}
.dropdown-arrow { color: var(--color-text-2); font-size: 12px; }

/* ── Content ── */
.main-content {
  flex: 1;
  overflow: hidden;
}

/* ── Transitions ── */
.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.2s ease; }
.fade-slide-enter-from, .fade-slide-leave-to { opacity: 0; transform: translateX(-6px); }

.page-enter-active, .page-leave-active { transition: all 0.2s ease; }
.page-enter-from { opacity: 0; transform: translateX(10px); }
.page-leave-to { opacity: 0; transform: translateX(-10px); }
</style>
