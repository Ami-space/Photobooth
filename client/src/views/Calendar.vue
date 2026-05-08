<template>
  <div class="page-container">
    <!-- Header -->
    <div class="page-header">
      <div class="page-title">
        <div class="icon">📅</div>
        排期日历
      </div>
      <div class="header-actions">
        <el-button @click="prevMonth"><el-icon><ArrowLeft /></el-icon></el-button>
        <span class="month-label">{{ currentYear }}年 {{ currentMonth }}月</span>
        <el-button @click="nextMonth"><el-icon><ArrowRight /></el-icon></el-button>
        <el-button type="primary" @click="goToday">今天</el-button>
        <el-button type="primary" plain @click="$router.push('/orders/new')">
          <el-icon><Plus /></el-icon> 新增订单
        </el-button>
      </div>
    </div>

    <!-- Legend -->
    <div class="legend">
      <span class="legend-item"><span class="dot dot-free"></span>空闲</span>
      <span class="legend-item"><span class="dot dot-booked"></span>已预定</span>
      <span class="legend-item"><span class="dot dot-full"></span>已满</span>
    </div>

    <!-- Calendar Grid -->
    <div class="calendar-card glass-card" v-loading="loading">
      <div class="weekdays">
        <div v-for="d in weekdays" :key="d" class="weekday">{{ d }}</div>
      </div>
      <div class="days-grid">
        <div
          v-for="(cell, idx) in calendarCells"
          :key="idx"
          class="day-cell"
          :class="[
            cell.type,
            getDayStatus(cell.date),
            { 'is-today': cell.isToday, 'is-weekend': cell.isWeekend }
          ]"
          @click="cell.date && selectDay(cell.date)"
        >
          <template v-if="cell.date">
            <div class="day-num">{{ cell.day }}</div>
            <div class="day-orders" v-if="getOrders(cell.date).length">
              <div
                v-for="order in getOrders(cell.date).slice(0, 2)"
                :key="order.id"
                class="order-chip"
                :class="'chip-' + order.order_status"
              >
                {{ order.customer_name }}
              </div>
              <div v-if="getOrders(cell.date).length > 2" class="order-more">
                +{{ getOrders(cell.date).length - 2 }}
              </div>
            </div>
            <div v-else class="day-free">空闲</div>
          </template>
        </div>
      </div>
    </div>

    <!-- Day Detail Drawer -->
    <el-drawer
      v-model="drawerVisible"
      :title="selectedDate + ' 订单详情00'"
      direction="rtl"
      size="420px"
    >
      <div v-if="selectedOrders.length === 0" class="empty-day">
        <div class="empty-icon">🌿</div>
        <p>当日暂无订单</p>
        <el-button type="primary" @click="addOrderForDate">＋ 新增该日订单</el-button>
      </div>
      <div v-else class="order-list-drawer">
        <div v-for="order in selectedOrders" :key="order.id" class="order-detail-card">
          <div class="order-detail-header">
            <div class="customer-name">{{ order.customer_name }}</div>
            <div class="order-badges">
              <span class="status-badge" :class="'status-' + order.order_status">
                {{ statusMap[order.order_status] }}
              </span>
              <span class="status-badge" :class="'pay-' + order.payment_status">
                {{ payMap[order.payment_status] }}
              </span>
            </div>
          </div>
          <div class="order-detail-body">aaaaa{{ order }}bbbbb
            <div class="detail-row"><el-icon><Clock /></el-icon> {{ order.start_time }} - {{ order.end_time }}</div>
            <div class="detail-row" v-if="order.hotel_name"><el-icon><Location /></el-icon> {{ order.hotel_name }} {{ order.hall_name }}</div>
            <div class="detail-row"><el-icon><Phone /></el-icon> {{ order.customer_phone || '暂无' }}</div>
            <div class="detail-row"><el-icon><Money /></el-icon> ¥{{ order.total_amount }}</div>
          </div>
          <div class="order-detail-actions">
            <el-button size="small" @click="$router.push(`/orders/${order.id}/edit`); drawerVisible=false">
              <el-icon><Edit /></el-icon> 编辑
            </el-button>
          </div>
        </div>
        <el-button type="primary" plain style="width:100%;margin-top:12px" @click="addOrderForDate">
          <el-icon><Plus /></el-icon> 新增该日订单
        </el-button>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { useOrdersStore } from '../stores/orders.js'

const router = useRouter()
const store = useOrdersStore()
const loading = ref(false)

const today = dayjs()
const currentYear = ref(today.year())
const currentMonth = ref(today.month() + 1)
const drawerVisible = ref(false)
const selectedDate = ref('')

const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

const statusMap = { pending: '待确认', confirmed: '已确认', completed: '已完成', cancelled: '已取消' }
const payMap    = { unpaid: '未付款', deposit: '已收定金', paid: '已结清' }

async function loadCalendar() {
  loading.value = true
  try {
    await store.fetchCalendar(currentYear.value, currentMonth.value)
  } finally {
    loading.value = false
  }
}

function prevMonth() {
  const d = dayjs(`${currentYear.value}-${currentMonth.value}-01`).subtract(1, 'month')
  currentYear.value = d.year(); currentMonth.value = d.month() + 1; loadCalendar()
}
function nextMonth() {
  const d = dayjs(`${currentYear.value}-${currentMonth.value}-01`).add(1, 'month')
  currentYear.value = d.year(); currentMonth.value = d.month() + 1; loadCalendar()
}
function goToday() {
  currentYear.value = today.year(); currentMonth.value = today.month() + 1; loadCalendar()
}

const calendarCells = computed(() => {
  const first = dayjs(`${currentYear.value}-${String(currentMonth.value).padStart(2,'0')}-01`)
  const daysInMonth = first.daysInMonth()
  const startDow = first.day()
  const cells = []
  for (let i = 0; i < startDow; i++) cells.push({ type: 'empty' })
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${currentYear.value}-${String(currentMonth.value).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    const dow = (startDow + d - 1) % 7
    cells.push({
      type: 'day', day: d, date,
      isToday: date === today.format('YYYY-MM-DD'),
      isWeekend: dow === 0 || dow === 6,
    })
  }
  return cells
})

function getOrders(date) {
  const map = store.calendarData || {}
  return map?.[date] || []
}

function getDayStatus(date) {
  if (!date) return ''
  const orders = getOrders(date)
  if (orders.length === 0) return 'status-free'
  if (orders.length >= store.maxPerDay) return 'status-full'
  return 'status-booked'
}

const selectedOrders = computed(() => getOrders(selectedDate.value))

function selectDay(date) {
  selectedDate.value = date
  drawerVisible.value = true
}

function addOrderForDate() {
  router.push({ path: '/orders/new', query: { date: selectedDate.value } })
  drawerVisible.value = false
}

onMounted(loadCalendar)
</script>

<style scoped>
.page-container { display: flex; flex-direction: column; height: 100%; }
.header-actions { display: flex; align-items: center; gap: 8px; }
.month-label { font-size: 16px; font-weight: 600; color: var(--color-text); min-width: 120px; text-align: center; }

.legend { display: flex; gap: 16px; margin-bottom: 16px; }
.legend-item { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--color-text-2); }
.dot { width: 10px; height: 10px; border-radius: 50%; }
.dot-free   { background: var(--color-success); }
.dot-booked { background: var(--color-warning); }
.dot-full   { background: var(--color-danger); }

.calendar-card { flex: 1; overflow: auto; }

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  margin-bottom: 4px;
}
.weekday {
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-3);
  padding: 8px 0;
  text-transform: uppercase;
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.day-cell {
  min-height: 110px;
  border-radius: 10px;
  padding: 8px;
  background: var(--color-surface-2);
  border: 1px solid transparent;
  cursor: pointer;
  transition: var(--transition);
  position: relative;
  overflow: hidden;
}
.day-cell.empty { background: transparent; cursor: default; border: none; }
.day-cell:not(.empty):hover { border-color: var(--color-primary); transform: translateY(-1px); }

.day-cell.is-today { border-color: var(--color-primary) !important; box-shadow: 0 0 0 2px rgba(99,102,241,0.2); }
.day-cell.is-weekend .day-num { color: var(--color-primary-light); }

.day-cell.status-free::after {
  content: '';
  position: absolute; top: 4px; right: 4px;
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--color-success);
}
.day-cell.status-booked::after {
  content: '';
  position: absolute; top: 4px; right: 4px;
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--color-warning);
}
.day-cell.status-full { background: rgba(239,68,68,0.08); border-color: rgba(239,68,68,0.3) !important; }
.day-cell.status-full::after {
  content: '';
  position: absolute; top: 4px; right: 4px;
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--color-danger);
}

.day-num {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 6px;
}
.is-today .day-num {
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.day-orders { display: flex; flex-direction: column; gap: 3px; }
.order-chip {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
}
.chip-pending   { background: rgba(245,158,11,0.2); color: var(--color-warning); }
.chip-confirmed { background: rgba(99,102,241,0.2); color: var(--color-primary-light); }
.chip-completed { background: rgba(16,185,129,0.2); color: var(--color-success); }
.chip-cancelled { background: rgba(239,68,68,0.2); color: var(--color-danger); }
.order-more { font-size: 10px; color: var(--color-text-3); padding-left: 6px; }

.day-free { font-size: 11px; color: var(--color-text-3); margin-top: 4px; }

/* Drawer */
.empty-day { text-align: center; padding: 40px 0; color: var(--color-text-2); }
.empty-icon { font-size: 48px; margin-bottom: 12px; }

.order-detail-card {
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}
.order-detail-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
.customer-name { font-size: 16px; font-weight: 700; color: var(--color-text); }
.order-badges { display: flex; flex-direction: column; gap: 4px; align-items: flex-end; }
.order-detail-body { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
.detail-row { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--color-text-2); }
.order-detail-actions { display: flex; gap: 8px; }
</style>
