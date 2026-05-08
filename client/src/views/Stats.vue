<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title"><div class="icon">📊</div>数据统计</div>
      <div class="header-actions">
        <el-select v-model="year" @change="load" style="width:100px">
          <el-option v-for="y in years" :key="y" :label="`${y}年`" :value="y" />
        </el-select>
        <el-select v-model="month" @change="loadMonthly" style="width:90px">
          <el-option v-for="m in 12" :key="m" :label="`${m}月`" :value="m" />
        </el-select>
      </div>
    </div>

    <!-- Monthly Summary -->
    <div class="summary-row" v-if="monthly">
      <div class="summary-card glass-card">
        <div class="summary-icon">📦</div>
        <div class="summary-label">本月订单</div>
        <div class="summary-value">{{ monthly.totalOrders }} <span class="unit">场</span></div>
      </div>
      <div class="summary-card glass-card">
        <div class="summary-icon">💰</div>
        <div class="summary-label">本月收入</div>
        <div class="summary-value primary">¥{{ monthly.totalRevenue.toLocaleString() }}</div>
      </div>
      <div class="summary-card glass-card">
        <div class="summary-icon">📈</div>
        <div class="summary-label">平均单价</div>
        <div class="summary-value">¥{{ Math.round(monthly.avgPrice).toLocaleString() }}</div>
      </div>
      <div class="summary-card glass-card">
        <div class="summary-icon">✅</div>
        <div class="summary-label">已完成</div>
        <div class="summary-value success">{{ monthly.completedOrders }} <span class="unit">场</span></div>
      </div>
    </div>

    <!-- Yearly Chart -->
    <div class="glass-card chart-card">
      <div class="chart-title">{{ year }}年 月度收入趋势</div>
      <div class="chart-bars">
        <div v-for="item in yearlyData" :key="item.month" class="bar-item">
          <div class="bar-wrap">
            <div
              class="bar"
              :style="{ height: barHeight(item.revenue) + 'px' }"
              :class="{ 'bar-current': item.month === month }"
            >
              <div class="bar-value" v-if="item.revenue > 0">¥{{ (item.revenue/1000).toFixed(1) }}k</div>
            </div>
          </div>
          <div class="bar-label">{{ item.month }}月</div>
          <div class="bar-orders">{{ item.orders }}场</div>
        </div>
      </div>
    </div>

    <!-- Monthly Order List -->
    <div class="glass-card" style="padding:0;overflow:hidden;margin-top:20px">
      <div class="list-header">{{ year }}年{{ month }}月 订单明细</div>
      <el-table :data="monthly?.orders || []" style="width:100%">
        <el-table-column label="客户" prop="customer_name" min-width="100" />
        <el-table-column label="日期" prop="wedding_date" width="110" />
        <el-table-column label="酒店" prop="hotel_name" min-width="120" />
        <el-table-column label="金额" width="90">
          <template #default="{ row }">¥{{ row.total_amount }}</template>
        </el-table-column>
        <el-table-column label="收款状态" width="110">
          <template #default="{ row }">
            <span class="status-badge" :class="'pay-' + row.payment_status">{{ payMap[row.payment_status] }}</span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import dayjs from 'dayjs'
import { statsApi } from '../api/index.js'

const today = dayjs()
const year = ref(today.year())
const month = ref(today.month() + 1)
const monthly = ref(null)
const yearlyData = ref([])

const years = [today.year() - 1, today.year(), today.year() + 1]
const payMap = { unpaid: '未付款', deposit: '已收定金', paid: '已结清' }

const maxRevenue = () => Math.max(...yearlyData.value.map(d => d.revenue), 1)
const barHeight = (v) => Math.max((v / maxRevenue()) * 180, v > 0 ? 8 : 2)

async function loadMonthly() {
  try {
    const res = await statsApi.monthly(year.value, month.value)
    const data = res?.data || {}
    monthly.value = {
      totalOrders: Number(data.totalOrders || 0),
      totalRevenue: Number(data.totalRevenue || 0),
      avgPrice: Number(data.avgPrice || 0),
      completedOrders: Number(data.completedOrders || 0),
      orders: Array.isArray(data.orders) ? data.orders : [],
    }
  } catch {
    monthly.value = {
      totalOrders: 0,
      totalRevenue: 0,
      avgPrice: 0,
      completedOrders: 0,
      orders: [],
    }
  }
}

async function loadYearly() {
  try {
    const res = await statsApi.yearly(year.value)
    yearlyData.value = Array.isArray(res?.data) ? res.data : []
  } catch {
    yearlyData.value = []
  }
}

async function load() {
  await Promise.all([loadMonthly(), loadYearly()])
}

onMounted(load)
</script>

<style scoped>
.header-actions { display: flex; gap: 10px; }
.summary-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
.summary-card { padding: 20px; text-align: center; transition: var(--transition); }
.summary-card:hover { transform: translateY(-2px); }
.summary-icon { font-size: 28px; margin-bottom: 8px; }
.summary-label { font-size: 13px; color: var(--color-text-3); margin-bottom: 6px; }
.summary-value { font-size: 26px; font-weight: 700; color: var(--color-text); }
.summary-value.primary { color: var(--color-primary-light); }
.summary-value.success { color: var(--color-success); }
.unit { font-size: 14px; font-weight: 400; color: var(--color-text-3); }

.chart-card { padding: 24px; margin-bottom: 0; }
.chart-title { font-size: 15px; font-weight: 600; color: var(--color-text); margin-bottom: 24px; }
.chart-bars { display: flex; align-items: flex-end; gap: 8px; height: 220px; }
.bar-item { flex: 1; display: flex; flex-direction: column; align-items: center; }
.bar-wrap { flex: 1; display: flex; align-items: flex-end; width: 100%; }
.bar {
  width: 100%; border-radius: 6px 6px 0 0;
  background: linear-gradient(180deg, var(--color-primary), rgba(99,102,241,0.4));
  position: relative;
  min-height: 2px;
  transition: height 0.5s ease;
}
.bar.bar-current {
  background: linear-gradient(180deg, var(--color-accent), rgba(236,72,153,0.4));
  box-shadow: 0 0 12px rgba(236,72,153,0.3);
}
.bar-value {
  position: absolute; top: -20px; left: 50%; transform: translateX(-50%);
  font-size: 10px; color: var(--color-text-2); white-space: nowrap;
}
.bar-label { font-size: 11px; color: var(--color-text-3); margin-top: 6px; }
.bar-orders { font-size: 10px; color: var(--color-text-3); }

.list-header { padding: 16px 20px; font-size: 14px; font-weight: 600; color: var(--color-text); border-bottom: 1px solid var(--color-border); }
@media (max-width: 768px) { .summary-row { grid-template-columns: repeat(2, 1fr); } }
</style>
