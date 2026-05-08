<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title"><div class="icon">🎫</div>订单管理</div>
      <el-button type="primary" @click="$router.push('/orders/new')">
        <el-icon><Plus /></el-icon> 新增订单
      </el-button>
    </div>

    <!-- Filter Bar -->
    <div class="filter-bar glass-card">
      <el-input v-model="filters.keyword" placeholder="搜索客户/电话/酒店" clearable prefix-icon="Search" style="width:200px" @input="debouncedFetch" />
      <el-date-picker v-model="filters.date" type="date" placeholder="按日期筛选" format="YYYY-MM-DD" value-format="YYYY-MM-DD" clearable @change="fetchOrders" style="width:160px" />
      <el-select v-model="filters.status" placeholder="订单状态" clearable @change="fetchOrders" style="width:130px">
        <el-option label="待确认" value="pending" />
        <el-option label="已确认" value="confirmed" />
        <el-option label="已完成" value="completed" />
        <el-option label="已取消" value="cancelled" />
      </el-select>
      <el-select v-model="filters.payment_status" placeholder="收款状态" clearable @change="fetchOrders" style="width:130px">
        <el-option label="未付款" value="unpaid" />
        <el-option label="已收定金" value="deposit" />
        <el-option label="已结清" value="paid" />
      </el-select>
      <el-button @click="resetFilters"><el-icon><Refresh /></el-icon> 重置</el-button>
    </div>

    <!-- Stats row -->
    <div class="stats-row">
      <div class="stat-chip">共 <b>{{ store.orders.length }}</b> 条</div>
      <div class="stat-chip">
        合计 <b>¥{{ totalAmount.toLocaleString() }}</b>
      </div>
    </div>

    <!-- Table -->
    <div class="glass-card table-card">
      <el-table :data="store.orders" v-loading="store.loading" style="width:100%" row-class-name="table-row" @row-click="handleRowClick">
        <el-table-column label="客户" prop="customer_name" min-width="100">
          <template #default="{ row }">
            <div class="customer-cell">
              <div class="c-avatar">{{ row.customer_name.charAt(0) }}</div>
              <div>
                <div class="c-name">{{ row.customer_name }}</div>
                <div class="c-phone">{{ row.customer_phone }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="婚礼日期" min-width="110">
          <template #default="{ row }">
            <div class="date-cell">
              <div>{{ row.wedding_date }}</div>
              <div class="time-sub">{{ row.start_time }} - {{ row.end_time }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="地点" min-width="140">
          <template #default="{ row }">
            <div>{{ row.hotel_name }}</div>
            <div class="time-sub">{{ row.hall_name }}</div>
          </template>
        </el-table-column>
        <el-table-column label="套餐金额" width="90">
          <template #default="{ row }">¥{{ row.total_amount }}</template>
        </el-table-column>
        <el-table-column label="订单状态" width="100">
          <template #default="{ row }">
            <span class="status-badge" :class="'status-' + row.order_status">{{ statusMap[row.order_status] }}</span>
          </template>
        </el-table-column>
        <el-table-column label="收款状态" width="100">
          <template #default="{ row }">
            <span class="status-badge" :class="'pay-' + row.payment_status">{{ payMap[row.payment_status] }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button size="small" link type="primary" @click.stop="$router.push(`/orders/${row.id}/edit`)">
              <el-icon><Edit /></el-icon>编辑
            </el-button>
            <el-button size="small" link type="danger" @click.stop="deleteOrder(row)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useOrdersStore } from '../stores/orders.js'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const store = useOrdersStore()

const statusMap = { pending: '待确认', confirmed: '已确认', completed: '已完成', cancelled: '已取消' }
const payMap    = { unpaid: '未付款', deposit: '已收定金', paid: '已结清' }

const filters = reactive({ keyword: '', date: '', status: '', payment_status: '' })
let debounceTimer = null

function debouncedFetch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(fetchOrders, 400)
}

async function fetchOrders() {
  const params = {}
  if (filters.keyword) params.keyword = filters.keyword
  if (filters.date) params.date = filters.date
  if (filters.status) params.status = filters.status
  if (filters.payment_status) params.payment_status = filters.payment_status
  await store.fetchOrders(params)
}

function resetFilters() {
  Object.assign(filters, { keyword: '', date: '', status: '', payment_status: '' })
  fetchOrders()
}

const totalAmount = computed(() => store.orders.reduce((s, o) => s + (o.total_amount || 0), 0))

function handleRowClick(row) {
  router.push(`/orders/${row.id}/edit`)
}

async function deleteOrder(row) {
  await ElMessageBox.confirm(`确认删除客户 "${row.customer_name}" 的订单吗？`, '删除确认', { type: 'warning' })
  await store.deleteOrder(row.id)
  ElMessage.success('订单已删除')
  fetchOrders()
}

onMounted(fetchOrders)
</script>

<style scoped>
.filter-bar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 16px; padding: 14px 20px; }
.stats-row { display: flex; gap: 12px; margin-bottom: 16px; }
.stat-chip { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 8px; padding: 6px 14px; font-size: 13px; color: var(--color-text-2); }
.stat-chip b { color: var(--color-primary-light); }
.table-card { padding: 0; overflow: hidden; }
.table-row { cursor: pointer; }
:deep(.el-table),
:deep(.el-table__inner-wrapper),
:deep(.el-table__header-wrapper),
:deep(.el-table__body-wrapper),
:deep(.el-table__fixed),
:deep(.el-table__fixed-right),
:deep(.el-table__fixed-header-wrapper),
:deep(.el-table__fixed-body-wrapper) {
  background: var(--color-surface) !important;
}
:deep(.el-table th.el-table__cell),
:deep(.el-table td.el-table__cell) {
  background: var(--color-surface) !important;
}
:deep(.el-table__body tr:hover > td.el-table__cell),
:deep(.el-table__body tr.hover-row > td.el-table__cell) {
  background: var(--color-surface-2) !important;
}
.customer-cell { display: flex; align-items: center; gap: 10px; }
.c-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700; color: #fff; flex-shrink: 0;
}
.c-name { font-size: 14px; font-weight: 600; color: var(--color-text); }
.c-phone { font-size: 12px; color: var(--color-text-3); }
.date-cell { font-size: 14px; }
.time-sub { font-size: 11px; color: var(--color-text-3); margin-top: 2px; }
</style>
