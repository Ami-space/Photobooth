<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title"><div class="icon">⚙️</div>套餐配置</div>
      <el-button type="primary" :loading="saving" @click="save">保存配置</el-button>
    </div>

    <div class="glass-card section">
      <div class="section-title">标准套餐（价格可配置）</div>
      <div class="pkg-grid">
        <div v-for="pkg in packageConfigs" :key="pkg.key" class="pkg-row">
          <el-input v-model="pkg.label" placeholder="套餐名称" style="width: 140px" />
          <el-input-number v-model="pkg.hours" :min="1" :step="1" controls-position="right" style="width: 140px" />
          <el-input-number v-model="pkg.price" :min="0" :step="100" controls-position="right" style="width: 160px" />
        </div>
      </div>
      <div class="hint">订单中标准套餐价格将按此处自动带出，且不可手动改价。</div>
    </div>

    <div class="glass-card section">
      <div class="section-title">相册耗材费用</div>
      <el-form label-position="top">
        <el-form-item label="每本相册耗材单价（元）">
          <el-input-number v-model="albumUnitPrice" :min="0" :step="5" controls-position="right" />
        </el-form-item>
      </el-form>
      <div class="hint">每个标准套餐默认赠送 1 本相册，额外本数会按该单价计算耗材费用。</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { statsApi } from '../api/index.js'
import { ElMessage } from 'element-plus'

const saving = ref(false)
const albumUnitPrice = ref(35)
const packageConfigs = ref([
  { key: 'pkg_2h', label: '2小时', hours: 2, price: 1388 },
  { key: 'pkg_3h', label: '3小时', hours: 3, price: 1688 },
  { key: 'pkg_4h', label: '4小时', hours: 4, price: 1988 },
])

function normalizePackages(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return packageConfigs.value
  return raw.map((pkg, idx) => ({
    key: pkg.key || `pkg_${idx + 1}`,
    label: pkg.label || `${pkg.hours || idx + 2}小时`,
    hours: Number(pkg.hours || 2),
    price: Number(pkg.price || 0),
  }))
}

async function load() {
  try {
    const res = await statsApi.getSettings()
    const settings = res?.data || {}
    albumUnitPrice.value = Number(settings.album_unit_price || 35)
    packageConfigs.value = normalizePackages(JSON.parse(settings.package_configs || '[]'))
  } catch {
    albumUnitPrice.value = 35
    packageConfigs.value = normalizePackages([])
  }
}

async function save() {
  saving.value = true
  try {
    await statsApi.saveSettings({
      album_unit_price: Number(albumUnitPrice.value || 0),
      package_configs: JSON.stringify(packageConfigs.value),
    })
    ElMessage.success('套餐配置已保存')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.section { margin-bottom: 16px; }
.section-title { font-size: 15px; font-weight: 700; margin-bottom: 12px; }
.pkg-grid { display: flex; flex-direction: column; gap: 10px; }
.pkg-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.hint { margin-top: 8px; color: var(--color-text-3); font-size: 12px; }
</style>
