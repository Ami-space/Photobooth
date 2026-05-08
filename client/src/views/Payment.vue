<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title"><div class="icon">💳</div>收款管理</div>
      <div class="header-actions">
        <el-select v-model="filterStatus" placeholder="收款状态" clearable @change="load" style="width:140px">
          <el-option label="未付款" value="unpaid" />
          <el-option label="已收定金" value="deposit" />
          <el-option label="已结清" value="paid" />
        </el-select>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="summary-row">
      <div class="summary-card glass-card">
        <div class="summary-label">总应收</div>
        <div class="summary-value">¥{{ summary.total.toLocaleString() }}</div>
      </div>
      <div class="summary-card glass-card">
        <div class="summary-label">已收定金</div>
        <div class="summary-value" style="color:var(--color-warning)">¥{{ summary.deposits.toLocaleString() }}</div>
      </div>
      <div class="summary-card glass-card">
        <div class="summary-label">已结清</div>
        <div class="summary-value" style="color:var(--color-success)">¥{{ summary.paid.toLocaleString() }}</div>
      </div>
      <div class="summary-card glass-card">
        <div class="summary-label">未付款</div>
        <div class="summary-value" style="color:var(--color-danger)">¥{{ summary.unpaid.toLocaleString() }}</div>
      </div>
    </div>

    <!-- Payment Table -->
    <div class="glass-card" style="padding:0;overflow:hidden">
      <el-table :data="orders" v-loading="loading" style="width:100%">
        <el-table-column label="客户" min-width="120">
          <template #default="{ row }">
            <div class="customer-cell">
              <div class="c-avatar">{{ row.customer_name.charAt(0) }}</div>
              <div>
                <div class="c-name">{{ row.customer_name }}</div>
                <div class="c-phone">{{ row.wedding_date }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="酒店" prop="hotel_name" min-width="120" />
        <el-table-column label="总金额" width="100">
          <template #default="{ row }">¥{{ row.total_amount }}</template>
        </el-table-column>
        <el-table-column label="定金" width="160">
          <template #default="{ row }">
            <span v-if="row.deposit_amount > 0" style="color:var(--color-warning)">¥{{ row.deposit_amount }}</span>
            <span v-if="row.deposit_amount > 0" class="pay-method-inline">（{{ methodMap[row.deposit_payment_method || row.payment_method] || '未填' }}）</span>
            <span v-else class="none">-</span>
          </template>
        </el-table-column>
        <el-table-column label="尾款" width="170">
          <template #default="{ row }">
            <span v-if="row.payment_status === 'paid'" style="color:var(--color-success)">
              ¥{{ row.total_amount - row.deposit_amount }}
            </span>
            <span v-if="row.payment_status === 'paid'" class="pay-method-inline">（{{ methodMap[row.final_payment_method || row.payment_method] || '未填' }}）</span>
            <span v-else class="none">待收</span>
          </template>
        </el-table-column>
        <el-table-column label="收款状态" width="120">
          <template #default="{ row }">
            <span class="status-badge" :class="'pay-' + row.payment_status">{{ payMap[row.payment_status] }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.payment_status === 'unpaid'" size="small" type="warning" plain @click="openDepositDialog(row)">收定金</el-button>
            <el-button v-if="row.payment_status === 'deposit'" size="small" type="success" plain @click="updatePay(row, 'paid')">已结清</el-button>
            <el-button size="small" link type="primary" @click="$router.push(`/orders/${row.id}/edit`)"><el-icon><Edit /></el-icon></el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="depositDialogVisible" title="收定金" width="420px">
      <el-form label-width="100px">
        <el-form-item label="客户">
          <el-input :model-value="depositTarget?.customer_name || ''" disabled />
        </el-form-item>
        <el-form-item label="定金金额" required>
          <el-input-number v-model="depositForm.amount" :min="1" :max="depositTarget?.total_amount || 999999" controls-position="right" style="width:100%" />
        </el-form-item>
        <el-form-item label="付款方式" required>
          <el-radio-group v-model="depositForm.method">
            <el-radio value="wechat">微信</el-radio>
            <el-radio value="alipay">支付宝</el-radio>
            <el-radio value="cash">现金</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="depositDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmDeposit">确认收定金</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { ordersApi } from '../api/index.js'
import { ElMessage } from 'element-plus'

const orders = ref([])
const loading = ref(false)
const filterStatus = ref('')
const depositDialogVisible = ref(false)
const depositTarget = ref(null)
const depositForm = reactive({
  amount: 0,
  method: 'wechat',
})

const payMap    = { unpaid: '未付款', deposit: '已收定金', paid: '已结清' }
const methodMap = { wechat: '微信', alipay: '支付宝', cash: '现金' }

async function load() {
  loading.value = true
  try {
    const params = {}
    if (filterStatus.value) params.payment_status = filterStatus.value
    const res = await ordersApi.list(params)
    const list = Array.isArray(res?.data) ? res.data : []
    orders.value = list.filter(o => o.order_status !== 'cancelled')
  } catch {
    orders.value = []
  } finally {
    loading.value = false
  }
}

const summary = computed(() => {
  const all = orders.value
  return {
    total:    all.reduce((s, o) => s + (o.total_amount || 0), 0),
    deposits: all.filter(o => o.payment_status === 'deposit').reduce((s, o) => s + (o.deposit_amount || 0), 0),
    paid:     all.filter(o => o.payment_status === 'paid').reduce((s, o) => s + (o.total_amount || 0), 0),
    unpaid:   all.filter(o => o.payment_status === 'unpaid').reduce((s, o) => s + (o.total_amount || 0), 0),
  }
})

async function updatePay(row, status) {
  const data = { payment_status: status }
  if (status === 'paid') {
    data.final_payment_method = row.final_payment_method || row.deposit_payment_method || row.payment_method || 'wechat'
    data.payment_method = data.final_payment_method
  }
  await ordersApi.update(row.id, data)
  ElMessage.success('收款状态已更新')
  load()
}

function openDepositDialog(row) {
  depositTarget.value = row
  depositForm.amount = Number(row.deposit_amount || 0) > 0 ? Number(row.deposit_amount) : Math.min(Number(row.total_amount || 0), 500)
  depositForm.method = row.deposit_payment_method || row.payment_method || 'wechat'
  depositDialogVisible.value = true
}

async function confirmDeposit() {
  if (!depositTarget.value) return
  if (!depositForm.amount) return ElMessage.warning('请填写定金金额')
  if (!depositForm.method) return ElMessage.warning('请选择付款方式')
  await ordersApi.update(depositTarget.value.id, {
    payment_status: 'deposit',
    order_status: ['pending', 'confirmed', 'cancelled'].includes(depositTarget.value.order_status) ? depositTarget.value.order_status : 'pending',
    deposit_amount: Number(depositForm.amount),
    deposit_payment_method: depositForm.method,
    payment_method: depositForm.method,
  })
  depositDialogVisible.value = false
  ElMessage.success('定金已登记')
  load()
}

onMounted(load)
</script>

<style scoped>
.header-actions { display: flex; gap: 10px; }
.summary-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
.summary-card { padding: 20px; text-align: center; transition: var(--transition); }
.summary-card:hover { transform: translateY(-2px); }
.summary-label { font-size: 13px; color: var(--color-text-3); margin-bottom: 8px; }
.summary-value { font-size: 24px; font-weight: 700; color: var(--color-text); }
.customer-cell { display: flex; align-items: center; gap: 10px; }
.c-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700; color: #fff;
}
.c-name { font-size: 14px; font-weight: 600; color: var(--color-text); }
.c-phone { font-size: 12px; color: var(--color-text-3); }
.none { color: var(--color-text-3); }
.pay-method-inline { color: var(--color-text-3); font-size: 12px; margin-left: 2px; }
@media (max-width: 768px) { .summary-row { grid-template-columns: repeat(2, 1fr); } }
</style>
