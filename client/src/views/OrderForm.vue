<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">
        <div class="icon">{{ isEdit ? '✏️' : '➕' }}</div>
        {{ isEdit ? '编辑订单' : '新增订单' }}
      </div>
      <div @click="$router.back()"><el-icon><ArrowLeft /></el-icon> 返回</div>
    </div>

    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      label-position="top"
      class="order-form"
      v-loading="pageLoading"
    >
      <div class="form-grid">
        <!-- 左列 -->
        <div class="form-col">
          <div class="form-section glass-card">
            <div class="section-title">👤 客户信息</div>
            <el-form-item label="客户姓名" prop="customer_name">
              <el-input v-model="form.customer_name" :disabled="customerLocked" placeholder="请输入客户姓名" />
            </el-form-item>
            <el-form-item label="客户电话">
              <el-input v-model="form.customer_phone" :disabled="customerLocked" placeholder="请输入联系电话" />
            </el-form-item>
          </div>

          <div class="form-section glass-card">
            <div class="section-title">📅 婚礼时间</div>
            <el-form-item label="婚礼日期" prop="wedding_date">
              <el-date-picker v-model="form.wedding_date" :disabled="scheduleLocked" type="date" placeholder="选择日期" format="YYYY-MM-DD" value-format="YYYY-MM-DD" style="width:100%" />
            </el-form-item>
            <div class="time-row">
              <el-form-item label="开始时间" prop="start_time" style="flex:1">
                <el-time-select v-model="form.start_time" :disabled="scheduleLocked" start="08:00" end="23:30" step="00:30" placeholder="开始" style="width:100%" />
              </el-form-item>
              <el-form-item label="结束时间" prop="end_time" style="flex:1">
                <el-time-select v-model="form.end_time" :disabled="scheduleLocked" :start="form.start_time || '08:00'" end="23:30" step="00:30" placeholder="结束" style="width:100%" />
              </el-form-item>
            </div>
          </div>

          <div class="form-section glass-card">
            <div class="section-title">📍 婚礼地点</div>
            <el-form-item label="酒店名称">
              <el-input v-model="form.hotel_name" :disabled="locationLocked" placeholder="酒店名称" />
            </el-form-item>
            <el-form-item label="宴会厅">
              <el-input v-model="form.hall_name" :disabled="locationLocked" placeholder="宴会厅名称" />
            </el-form-item>
          </div>
        </div>

        <!-- 右列 -->
        <div class="form-col">
          <div class="form-section glass-card">
            <div class="section-title">💼 套餐与价格</div>
            <el-form-item label="套餐类型">
              <el-radio-group v-model="form.package_type" :disabled="detailsLocked" @change="onPackageChange">
                <el-radio v-for="pkg in packageOptions" :key="pkg.key" :value="pkg.key">
                  {{ pkg.label }}（{{ pkg.hours }}小时）¥{{ pkg.price }}
                </el-radio>
                <el-radio value="custom">自定义套餐</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="套餐金额" prop="price">
              <el-input-number v-model="form.price" :disabled="detailsLocked || !isCustomPackage" :min="0" :step="100" controls-position="right" style="width:100%" />
            </el-form-item>
            <el-form-item label="额外相册本数">
              <el-input-number v-model="form.extra_albums" :disabled="detailsLocked" :min="0" :step="1" controls-position="right" style="width:100%" />
            </el-form-item>
            <el-form-item label="耗材费用（自动计算）">
              <el-input-number :model-value="form.material_fee" :min="0" controls-position="right" disabled style="width:100%" />
            </el-form-item>
            <el-form-item label="订单总金额" prop="total_amount">
              <el-input-number :model-value="form.total_amount" :min="0" controls-position="right" disabled style="width:100%" />
            </el-form-item>
          </div>

          <div class="form-section glass-card">
            <div class="section-title">👥 人员与设备</div>
            <el-form-item label="人员安排">
              <el-checkbox-group v-model="form.staff_ids" :disabled="detailsLocked">
                <el-checkbox v-for="s in staffList" :key="s.id" :value="s.id">{{ s.name }}</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
            <el-form-item label="设备安排">
              <el-checkbox-group v-model="form.device_ids" :disabled="detailsLocked">
                <el-checkbox v-for="d in deviceList" :key="d.id" :value="d.id">{{ d.name }}</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
          </div>

          <div class="form-section glass-card">
            <div class="section-title">💰 收款信息</div>
            <el-form-item label="收款状态">
              <el-radio-group v-model="form.payment_status" :disabled="paymentLocked">
                <el-radio value="unpaid">未付款</el-radio>
                <el-radio value="deposit">已收定金</el-radio>
                <el-radio value="paid">已结清</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="定金金额" v-if="form.payment_status === 'deposit'">
              <el-input-number v-model="form.deposit_amount" :disabled="paymentLocked" :min="0" :max="form.total_amount" controls-position="right" style="width:100%" />
            </el-form-item>
            <el-form-item label="尾款金额" v-if="form.payment_status === 'paid'">
              <el-input-number :model-value="finalPaymentAmount" :min="0" controls-position="right" disabled style="width:100%" />
            </el-form-item>
            <el-form-item label="定金支付方式" v-if="form.payment_status === 'deposit'">
              <el-radio-group v-model="form.deposit_payment_method" :disabled="paymentLocked">
                <el-radio value="wechat">微信</el-radio>
                <el-radio value="alipay">支付宝</el-radio>
                <el-radio value="cash">现金</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="尾款支付方式" v-if="form.payment_status === 'paid'">
              <el-radio-group v-model="form.final_payment_method" :disabled="paymentLocked">
                <el-radio value="wechat">微信</el-radio>
                <el-radio value="alipay">支付宝</el-radio>
                <el-radio value="cash">现金</el-radio>
              </el-radio-group>
            </el-form-item>
          </div>

          <div class="form-section glass-card">
            <div class="section-title">📋 订单状态与备注</div>
            <el-form-item label="订单状态">
              <el-select v-model="form.order_status" style="width:100%">
                <el-option v-for="option in availableOrderStatusOptions" :key="option.value" :label="option.label" :value="option.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="备注">
              <el-input v-model="form.notes" type="textarea" :rows="3" placeholder="特殊需求、备注信息..." />
            </el-form-item>
          </div>
        </div>
      </div>

      <!-- Submit -->
      <div class="form-actions glass-card">
        <el-button size="large" @click="$router.back()">取消</el-button>
        <el-button type="primary" size="large" :loading="saving" @click="handleSubmit">
          {{ saving ? '保存中...' : (isEdit ? '保存修改' : '创建订单') }}
        </el-button>
      </div>
    </el-form>

    <!-- Conflict Dialog -->
    <el-dialog v-model="conflictVisible" title="⚠️ 时间冲突提醒" width="440px">
      <p class="conflict-msg">该时间段已存在以下订单：</p>
      <div v-for="c in conflicts" :key="c.id" class="conflict-item">
        <div class="conflict-name">{{ c.customer_name }}</div>
        <div class="conflict-time">{{ c.start_time }} - {{ c.end_time }}</div>
      </div>
      <p class="conflict-ask">是否仍要继续{{ isEdit ? '保存' : '创建' }}？</p>
      <template #footer>
        <el-button @click="conflictVisible = false">取消</el-button>
        <el-button type="warning" @click="forceSubmit">仍然{{ isEdit ? '保存' : '创建' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOrdersStore } from '../stores/orders.js'
import { staffApi, devicesApi, statsApi } from '../api/index.js'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const store = useOrdersStore()

const isEdit = computed(() => !!route.params.id)
const formRef = ref()
const saving = ref(false)
const pageLoading = ref(false)
const conflictVisible = ref(false)
const conflicts = ref([])
const staffList = ref([])
const deviceList = ref([])
const originalSchedule = ref({ wedding_date: '', start_time: '', end_time: '' })
const originalOrderStatus = ref('')
const packageOptions = ref([])
const albumUnitPrice = ref(35)

const form = reactive({
  customer_name: '', customer_phone: '',
  wedding_date: route.query.date || '',
  start_time: '', end_time: '',
  hotel_name: '', hall_name: '',
  package_type: 'pkg_2h', price: 1388, total_amount: 1388,
  staff_ids: [], device_ids: [],
  order_status: 'pending', payment_status: 'unpaid',
  deposit_amount: 0, deposit_payment_method: 'wechat', final_payment_method: 'wechat', payment_method: '',
  notes: '',
  extra_albums: 0,
  album_unit_price: 35,
  material_fee: 0,
})

const rules = {
  customer_name: [{ required: true, message: '请输入客户姓名', trigger: 'blur' }],
  wedding_date:  [{ required: true, message: '请选择婚礼日期', trigger: 'change' }],
  start_time:    [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  end_time:      [{ required: true, message: '请选择结束时间', trigger: 'change' }],
  price:         [{ required: true, message: '请填写套餐金额', trigger: 'blur' }],
}

const isCustomPackage = computed(() => form.package_type === 'custom')
const finalStatuses = ['completed', 'cancelled']
const isFinalOrder = computed(() => isEdit.value && finalStatuses.includes(originalOrderStatus.value))
const isConfirmedOrder = computed(() => isEdit.value && originalOrderStatus.value === 'confirmed')
const customerLocked = computed(() => isFinalOrder.value || isConfirmedOrder.value)
const scheduleLocked = computed(() => isFinalOrder.value || isConfirmedOrder.value)
const locationLocked = computed(() => isFinalOrder.value || isConfirmedOrder.value)
const detailsLocked = computed(() => isFinalOrder.value)
const paymentLocked = computed(() => isFinalOrder.value)
const finalPaymentAmount = computed(() => Math.max(Number(form.total_amount || 0) - Number(form.deposit_amount || 0), 0))
const orderStatusOptions = [
  { label: '待确认', value: 'pending' },
  { label: '已确认', value: 'confirmed' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' },
]
const availableOrderStatusOptions = computed(() => {
  if (isFinalOrder.value) {
    return orderStatusOptions.filter((item) => ['completed', 'cancelled'].includes(item.value))
  }
  if (form.payment_status === 'deposit') {
    return orderStatusOptions.filter((item) => ['pending', 'confirmed', 'cancelled'].includes(item.value))
  }
  if (form.payment_status === 'paid') {
    return orderStatusOptions.filter((item) => ['completed', 'cancelled'].includes(item.value))
  }
  return orderStatusOptions.filter((item) => ['pending', 'cancelled'].includes(item.value))
})

function recalcAmount() {
  const extraAlbums = Number(form.extra_albums || 0)
  const unit = Number(form.album_unit_price || 0)
  form.material_fee = extraAlbums * unit
  form.total_amount = Number(form.price || 0) + Number(form.material_fee || 0)
}

function onPackageChange(val) {
  const selected = packageOptions.value.find((p) => p.key === val)
  if (selected) {
    form.price = Number(selected.price || 0)
  }
  recalcAmount()
}

function normalizePackageOptions(raw) {
  if (!Array.isArray(raw) || raw.length === 0) {
    return [
      { key: 'pkg_2h', label: '2小时', hours: 2, price: 1388 },
      { key: 'pkg_3h', label: '3小时', hours: 3, price: 1688 },
      { key: 'pkg_4h', label: '4小时', hours: 4, price: 1988 },
    ]
  }
  return raw.map((item, idx) => ({
    key: item.key || `pkg_${idx + 1}`,
    label: item.label || `${item.hours || idx + 2}小时`,
    hours: Number(item.hours || 2),
    price: Number(item.price || 0),
  }))
}

function normalizeStatusByPayment() {
  if (isFinalOrder.value) return
  const available = availableOrderStatusOptions.value.map((item) => item.value)
  if (!available.includes(form.order_status)) {
    form.order_status = available[0] || 'pending'
  }
}

function normalizePaymentFields() {
  if (form.payment_status === 'unpaid') {
    form.deposit_amount = 0
    form.deposit_payment_method = ''
    form.final_payment_method = ''
    form.payment_method = ''
    return
  }
  if (form.payment_status === 'deposit') {
    form.final_payment_method = ''
    if (!form.deposit_payment_method) form.deposit_payment_method = 'wechat'
    form.payment_method = form.deposit_payment_method
    return
  }
  if (form.payment_status === 'paid') {
    if (!form.final_payment_method) form.final_payment_method = 'wechat'
    form.payment_method = form.final_payment_method
  }
}

async function handleSubmit() {
  await formRef.value?.validate()
  saving.value = true
  try {
    if (isEdit.value) {
      await doSave(false)
    } else {
      await doSave(false)
    }
  } catch (err) {
    if (err?.conflict) {
      conflicts.value = err.conflicts
      conflictVisible.value = true
    } else {
      ElMessage.error(err?.message || '保存失败')
    }
  } finally {
    saving.value = false
  }
}

async function doSave(force) {
  const data = { ...form, force }
  if (form.payment_status === 'deposit') {
    data.payment_method = form.deposit_payment_method || 'wechat'
    data.final_payment_method = ''
  }
  if (form.payment_status === 'paid') {
    data.payment_method = form.final_payment_method || 'wechat'
  }
  if (form.payment_status === 'unpaid') {
    data.deposit_amount = 0
    data.payment_method = ''
    data.deposit_payment_method = ''
    data.final_payment_method = ''
  }
  if (isEdit.value) {
    const scheduleChanged =
      form.wedding_date !== originalSchedule.value.wedding_date ||
      form.start_time !== originalSchedule.value.start_time ||
      form.end_time !== originalSchedule.value.end_time

    // 编辑时若未修改排期时间，不触发后端冲突检测
    if (!scheduleChanged) {
      delete data.wedding_date
      delete data.start_time
      delete data.end_time
    }
  }
  try {
    if (isEdit.value) {
      await store.updateOrder(route.params.id, data)
    } else {
      await store.createOrder(data)
    }
    ElMessage.success(isEdit.value ? '修改成功！' : '订单创建成功！')
    router.push('/orders')
  } catch (err) {
    const e = err?.response?.data || err
    if (e?.conflict) throw e
    throw e
  }
}

async function forceSubmit() {
  conflictVisible.value = false
  saving.value = true
  try { await doSave(true) } catch (e) { ElMessage.error(e?.message || '保存失败') }
  finally { saving.value = false }
}

onMounted(async () => {
  pageLoading.value = true
  try {
    const [s, d, settingsRes] = await Promise.all([staffApi.list(), devicesApi.list(), statsApi.getSettings()])
    staffList.value = Array.isArray(s?.data) ? s.data : []
    deviceList.value = Array.isArray(d?.data) ? d.data : []
    const settings = settingsRes?.data || {}
    albumUnitPrice.value = Number(settings.album_unit_price || 35)
    form.album_unit_price = albumUnitPrice.value
    try {
      packageOptions.value = normalizePackageOptions(JSON.parse(settings.package_configs || '[]'))
    } catch {
      packageOptions.value = normalizePackageOptions([])
    }

    if (isEdit.value) {
      const { ordersApi } = await import('../api/index.js')
      const r = await ordersApi.get(route.params.id)
      const o = r?.data || {}
      Object.assign(form, {
        ...o,
        staff_ids: typeof o.staff_ids === 'string' ? JSON.parse(o.staff_ids) : (o.staff_ids || []),
        device_ids: typeof o.device_ids === 'string' ? JSON.parse(o.device_ids) : (o.device_ids || []),
        deposit_payment_method: o.deposit_payment_method || (o.payment_status === 'deposit' ? o.payment_method : ''),
        final_payment_method: o.final_payment_method || (o.payment_status === 'paid' ? o.payment_method : ''),
      })
      if (!form.album_unit_price) form.album_unit_price = albumUnitPrice.value
      originalSchedule.value = {
        wedding_date: o.wedding_date || '',
        start_time: o.start_time || '',
        end_time: o.end_time || '',
      }
      originalOrderStatus.value = o.order_status || ''
      recalcAmount()
      normalizePaymentFields()
    } else {
      onPackageChange(form.package_type)
      normalizePaymentFields()
    }
  } catch {
    staffList.value = []
    deviceList.value = []
    packageOptions.value = normalizePackageOptions([])
    onPackageChange(form.package_type)
    ElMessage.error('初始化数据加载失败，请刷新重试')
  } finally {
    pageLoading.value = false
  }
})

watch(() => form.extra_albums, recalcAmount)
watch(() => form.price, recalcAmount)
watch(() => form.payment_status, normalizeStatusByPayment)
watch(() => form.payment_status, normalizePaymentFields)
watch(() => form.deposit_payment_method, () => {
  if (form.payment_status === 'deposit') form.payment_method = form.deposit_payment_method
})
watch(() => form.final_payment_method, () => {
  if (form.payment_status === 'paid') form.payment_method = form.final_payment_method
})
watch(() => form.order_status, normalizeStatusByPayment)
</script>

<style scoped>
.order-form { max-width: 1100px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
.form-col { display: flex; flex-direction: column; gap: 16px; }
.form-section { padding: 20px; }
.section-title { font-size: 14px; font-weight: 700; color: var(--color-text); margin-bottom: 16px; }
.time-row { display: flex; gap: 12px; }
.form-actions { display: flex; justify-content: flex-end; gap: 12px; padding: 16px 20px; }

.conflict-msg { color: var(--color-text-2); margin-bottom: 12px; }
.conflict-item {
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.3);
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
}
.conflict-name { font-weight: 600; color: var(--color-text); }
.conflict-time { color: var(--color-danger); font-size: 13px; }
.conflict-ask { color: var(--color-warning); margin-top: 12px; font-weight: 500; }

@media (max-width: 768px) {
  .form-grid { grid-template-columns: 1fr; }
}
</style>
