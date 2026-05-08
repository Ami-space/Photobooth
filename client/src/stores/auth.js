import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '../api/index.js'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('pb_token') || '')
  const user = ref(JSON.parse(localStorage.getItem('pb_user') || 'null'))

  const isLoggedIn = computed(() => !!token.value)

  async function login(username, password) {
    const res = await authApi.login({ username, password })
    token.value = res.token
    user.value = res.user
    localStorage.setItem('pb_token', res.token)
    localStorage.setItem('pb_user', JSON.stringify(res.user))
    return res
  }

  async function logout() {
    try { await authApi.logout() } catch (_) {}
    token.value = ''
    user.value = null
    localStorage.removeItem('pb_token')
    localStorage.removeItem('pb_user')
  }

  return { token, user, isLoggedIn, login, logout }
})
