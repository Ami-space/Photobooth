<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title"><div class="icon">👤</div>人员管理</div>
      <el-button type="primary" @click="openDialog()"><el-icon><Plus /></el-icon> 添加人员</el-button>
    </div>

    <div class="staff-grid">
      <div v-for="s in staffList" :key="s.id" class="staff-card glass-card">
        <div class="staff-avatar">{{ s.name.charAt(0) }}</div>
        <div class="staff-info">
          <div class="staff-name">{{ s.name }}</div>
          <div class="staff-role">{{ s.role === 'photographer' ? '摄影师' : s.role }}</div>
          <div class="staff-phone">{{ s.phone || '暂无电话' }}</div>
        </div>
        <div class="staff-actions">
          <el-button size="small" link @click="openDialog(s)"><el-icon><Edit /></el-icon></el-button>
          <el-button size="small" link type="danger" @click="deleteMember(s)"><el-icon><Delete /></el-icon></el-button>
        </div>
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="editItem ? '编辑人员' : '添加人员'" width="400px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="姓名"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="电话"><el-input v-model="form.phone" /></el-form-item>
        <el-form-item label="角色">
          <el-select v-model="form.role" style="width:100%">
            <el-option label="摄影师" value="photographer" />
            <el-option label="助理" value="assistant" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveMember" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { staffApi } from '../api/index.js'
import { ElMessage, ElMessageBox } from 'element-plus'

const staffList = ref([])
const dialogVisible = ref(false)
const editItem = ref(null)
const saving = ref(false)
const form = reactive({ name: '', phone: '', role: 'photographer' })

async function load() {
  try {
    const res = await staffApi.list()
    staffList.value = Array.isArray(res?.data) ? res.data : []
  } catch {
    staffList.value = []
  }
}

function openDialog(item = null) {
  editItem.value = item
  form.name = item?.name || ''
  form.phone = item?.phone || ''
  form.role = item?.role || 'photographer'
  dialogVisible.value = true
}

async function saveMember() {
  if (!form.name) return ElMessage.warning('请填写姓名')
  saving.value = true
  try {
    if (editItem.value) await staffApi.update(editItem.value.id, form)
    else await staffApi.create(form)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    load()
  } finally { saving.value = false }
}

async function deleteMember(item) {
  await ElMessageBox.confirm(`确认停用 "${item.name}"？`, '确认', { type: 'warning' })
  await staffApi.delete(item.id)
  ElMessage.success('已停用')
  load()
}

onMounted(load)
</script>

<style scoped>
.staff-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
.staff-card { display: flex; align-items: center; gap: 16px; padding: 20px; transition: var(--transition); }
.staff-card:hover { border-color: var(--color-primary); transform: translateY(-2px); }
.staff-avatar {
  width: 52px; height: 52px; border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  display: flex; align-items: center; justify-content: center;
  font-size: 20px; font-weight: 700; color: #fff; flex-shrink: 0;
}
.staff-info { flex: 1; }
.staff-name { font-size: 16px; font-weight: 700; color: var(--color-text); }
.staff-role { font-size: 12px; color: var(--color-primary-light); margin: 2px 0; }
.staff-phone { font-size: 12px; color: var(--color-text-3); }
.staff-actions { display: flex; gap: 4px; }
</style>
