import axios from 'axios'

// 开发环境走同源 /api（由 Vite 代理到 3001）；
// 非开发环境默认直连当前主机的 3001，避免在 5173 预览模式下 /api 命中静态页。
const runtimeBase = import.meta.env.VITE_API_BASE_URL
const hostBase =
  typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:3001`
    : 'http://localhost:3001'
const BASE_URL = runtimeBase || (import.meta.env.DEV ? '' : hostBase)

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
})

// 请求拦截：自动带上 token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pb_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// 响应拦截：统一处理 401
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const reqUrl = err.config?.url || ''
    const isLoginApi = reqUrl.includes('/api/auth/login')
    if (err.response?.status === 401 && !isLoginApi) {
      localStorage.removeItem('pb_token')
      localStorage.removeItem('pb_user')
      window.location.href = '/login'
    }
    return Promise.reject(err.response?.data || err)
  }
)

// ── Auth ──────────────────────────────────────
export const authApi = {
  login: (data) => api.post('/api/auth/login', data),
  logout: () => api.post('/api/auth/logout'),
  me: () => api.get('/api/auth/me'),
}

// ── Orders ───────────────────────────────────
export const ordersApi = {
  list: (params) => api.get('/api/orders', { params }),
  calendar: (year, month) => api.get(`/api/orders/calendar/${year}/${month}`),
  get: (id) => api.get(`/api/orders/${id}`),
  create: (data) => api.post('/api/orders', data),
  update: (id, data) => api.put(`/api/orders/${id}`, data),
  delete: (id) => api.delete(`/api/orders/${id}`),
}

// ── Devices ──────────────────────────────────
export const devicesApi = {
  list: () => api.get('/api/devices'),
  busyByDate: (date) => api.get(`/api/devices/busy/${date}`),
  create: (data) => api.post('/api/devices', data),
  update: (id, data) => api.put(`/api/devices/${id}`, data),
  delete: (id) => api.delete(`/api/devices/${id}`),
}

// ── Staff ────────────────────────────────────
export const staffApi = {
  list: () => api.get('/api/staff'),
  create: (data) => api.post('/api/staff', data),
  update: (id, data) => api.put(`/api/staff/${id}`, data),
  delete: (id) => api.delete(`/api/staff/${id}`),
}

// ── Users (Admin) ────────────────────────────
export const usersApi = {
  list: () => api.get('/api/users'),
  create: (data) => api.post('/api/users', data),
  update: (id, data) => api.put(`/api/users/${id}`, data),
  updatePassword: (id, password) => api.put(`/api/users/${id}/password`, { password }),
  delete: (id) => api.delete(`/api/users/${id}`),
}

// ── Stats ────────────────────────────────────
export const statsApi = {
  monthly: (year, month) => api.get('/api/stats/monthly', { params: { year, month } }),
  yearly: (year) => api.get('/api/stats/yearly', { params: { year } }),
  getSettings: () => api.get('/api/stats/settings'),
  saveSettings: (data) => api.put('/api/stats/settings', data),
}

export default api
