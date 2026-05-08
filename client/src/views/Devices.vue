<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title"><div class="icon">📷</div>设备管理</div>
      <el-button type="primary" @click="openDialog()"><el-icon><Plus /></el-icon> 添加设备</el-button>
    </div>

    <div class="devices-grid">
      <div v-for="device in devices" :key="device.id" class="device-card glass-card">
        <div class="device-icon">{{ typeIcon(device.type) }}</div>
        <div class="device-info">
          <div class="device-name">{{ device.name }}</div>
          <div class="device-type">{{ typeLabel(device.type) }}</div>
        </div>
        <div class="device-actions">
          <el-button size="small" link @click="openDialog(device)"><el-icon><Edit /></el-icon></el-button>
          <el-button size="small" link type="danger" @click="deleteDevice(device)"><el-icon><Delete /></el-icon></el-button>
        </div>
      </div>

      <div class="device-card device-add glass-card" @click="openDialog()">
        <el-icon class="add-icon"><Plus /></el-icon>
        <span>添加设备</span>
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="editItem ? '编辑设备' : '添加设备'" width="400px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="设备名称">
          <el-input v-model="form.name" placeholder="如：相机3" />
        </el-form-item>
        <el-form-item label="设备类型">
          <el-select v-model="form.type" style="width:100%">
            <el-option label="相机" value="camera" />
            <el-option label="平板" value="tablet" />
            <el-option label="补光灯" value="light" />
            <el-option label="打印机" value="printer" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveDevice" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { devicesApi } from '../api/index.js'
import { ElMessage, ElMessageBox } from 'element-plus'

const devices = ref([])
const dialogVisible = ref(false)
const editItem = ref(null)
const saving = ref(false)
const form = reactive({ name: '', type: 'camera' })

const typeIcon = (t) => ({ camera:'📷', tablet:'📱', light:'💡', printer:'🖨️', other:'📦' }[t] || '📦')
const typeLabel = (t) => ({ camera:'相机', tablet:'平板', light:'补光灯', printer:'打印机', other:'其他' }[t] || '其他')

async function load() {
  try {
    const res = await devicesApi.list()
    devices.value = Array.isArray(res?.data) ? res.data : []
  } catch {
    devices.value = []
  }
}

function openDialog(item = null) {
  editItem.value = item
  form.name = item?.name || ''
  form.type = item?.type || 'camera'
  dialogVisible.value = true
}

async function saveDevice() {
  if (!form.name) return ElMessage.warning('请填写设备名称')
  saving.value = true
  try {
    if (editItem.value) await devicesApi.update(editItem.value.id, form)
    else await devicesApi.create(form)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    load()
  } finally { saving.value = false }
}

async function deleteDevice(item) {
  await ElMessageBox.confirm(`确认停用设备 "${item.name}"？`, '确认', { type: 'warning' })
  await devicesApi.delete(item.id)
  ElMessage.success('已停用')
  load()
}

onMounted(load)
</script>

<style scoped>
.devices-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
.device-card {
  display: flex; align-items: center; gap: 12px; padding: 16px;
  transition: var(--transition);
}
.device-card:hover { border-color: var(--color-primary); transform: translateY(-2px); }
.device-icon { font-size: 28px; }
.device-info { flex: 1; }
.device-name { font-size: 15px; font-weight: 600; color: var(--color-text); }
.device-type { font-size: 12px; color: var(--color-text-3); margin-top: 2px; }
.device-actions { display: flex; gap: 4px; }
.device-add {
  border: 1px dashed var(--color-border) !important;
  cursor: pointer;
  justify-content: center;
  flex-direction: column;
  min-height: 80px;
  color: var(--color-text-3);
  gap: 8px;
  font-size: 13px;
}
.device-add:hover { border-color: var(--color-primary) !important; color: var(--color-primary-light); }
.add-icon { font-size: 24px; }
</style>
