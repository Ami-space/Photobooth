import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ordersApi } from '../api/index.js'

export const useOrdersStore = defineStore('orders', () => {
  const orders = ref([])
  const calendarData = ref({})
  const maxPerDay = ref(1)
  const loading = ref(false)

  async function fetchOrders(params = {}) {
    loading.value = true
    try {
      const res = await ordersApi.list(params)
      const list = Array.isArray(res?.data) ? res.data : []
      const parsed = []
      for (const item of list) {
        if (item && typeof item === 'object') {
          parsed.push(parseOrder(item))
        }
      }
      orders.value = parsed
    } catch {
      orders.value = []
    } finally {
      loading.value = false
    }
  }

  async function fetchCalendar(year, month) {
    const res = await ordersApi.calendar(year, month)
    calendarData.value = res?.data && typeof res.data === 'object' ? res.data : {}
    maxPerDay.value = Number(res?.maxPerDay || 1)
  }

  async function createOrder(data) {
    return await ordersApi.create(data)
  }

  async function updateOrder(id, data) {
    return await ordersApi.update(id, data)
  }

  async function deleteOrder(id) {
    return await ordersApi.delete(id)
  }

  function parseOrder(o) {
    return {
      ...o,
      staff_ids: tryParse(o?.staff_ids, []),
      device_ids: tryParse(o?.device_ids, []),
    }
  }

  function tryParse(val, fallback) {
    try { return typeof val === 'string' ? JSON.parse(val) : (val || fallback) }
    catch { return fallback }
  }

  return { orders, calendarData, maxPerDay, loading, fetchOrders, fetchCalendar, createOrder, updateOrder, deleteOrder }
})
