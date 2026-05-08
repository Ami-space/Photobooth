<template>
  <div class="login-page">
    <div class="login-bg">
      <div class="bg-orb orb-1"></div>
      <div class="bg-orb orb-2"></div>
      <div class="bg-orb orb-3"></div>
    </div>

    <div class="login-card fade-in">
      <div class="login-logo">
        <div class="logo-icon">💍</div>
        <h1 class="logo-title">Wedding Photobooth</h1>
        <p class="logo-sub">排单管理系统</p>
      </div>

      <el-form :model="form" @submit.prevent>
        <el-form-item>
          <el-input
            v-model="form.username"
            placeholder="用户名"
            size="large"
            prefix-icon="User"
            autofocus
          />
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="form.password"
            placeholder="密码"
            type="password"
            size="large"
            prefix-icon="Lock"
            show-password
            @keyup.enter.prevent="handleLogin"
          />
        </el-form-item>

        <el-button
          type="primary"
          native-type="button"
          size="large"
          class="login-btn"
          :loading="loading"
          @click="handleLogin"
        >
          {{ loading ? '登录中...' : '登 录' }}
        </el-button>
      </el-form>
      <p v-if="errorText" class="login-error">{{ errorText }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { ElMessage } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()
const loading = ref(false)
const errorText = ref('')

const form = reactive({ username: '', password: '' })

async function handleLogin() {
  errorText.value = ''
  const username = form.username.trim()
  const password = String(form.password || '').trim()
  if (!username || !password) {
    errorText.value = '请先输入用户名和密码'
    return
  }
  loading.value = true
  try {
    await authStore.login(username, password)
    ElMessage.success('登录成功！')
    router.push('/calendar')
  } catch (err) {
    errorText.value = err?.message || '登录失败，请检查账号密码或网络'
    ElMessage.error(errorText.value)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg);
  position: relative;
  overflow: hidden;
}
.login-bg { position: absolute; inset: 0; pointer-events: none; }
.bg-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.12;
}
.orb-1 { width: 500px; height: 500px; background: var(--color-primary); top: -150px; left: -150px; }
.orb-2 { width: 400px; height: 400px; background: var(--color-accent); bottom: -100px; right: -100px; }
.orb-3 { width: 300px; height: 300px; background: #06b6d4; top: 50%; left: 50%; transform: translate(-50%,-50%); }

.login-card {
  width: 400px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  padding: 48px 40px;
  box-shadow: var(--shadow), 0 0 60px rgba(99,102,241,0.08);
  position: relative;
  z-index: 1;
}

.login-logo { text-align: center; margin-bottom: 36px; }
.logo-icon { font-size: 48px; margin-bottom: 12px; display: block; }
.logo-title {
  font-size: 22px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--color-primary-light), var(--color-accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 4px;
}
.logo-sub { color: var(--color-text-3); font-size: 13px; }

.login-btn {
  width: 100%;
  height: 44px;
  font-size: 15px;
  font-weight: 600;
  margin-top: 8px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark)) !important;
  border: none !important;
  border-radius: 10px !important;
  transition: all 0.3s ease !important;
}
.login-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(99,102,241,0.4) !important; }

.login-error {
  margin-top: 12px;
  font-size: 13px;
  color: #f56c6c;
  text-align: center;
}

.login-hint { text-align: center; color: var(--color-text-3); font-size: 12px; margin-top: 16px; }
</style>
