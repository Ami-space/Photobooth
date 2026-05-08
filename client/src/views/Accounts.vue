<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <div class="page-title"><div class="icon">🔐</div>账号管理</div>
        <div class="page-subtitle">{{ pageTip }}</div>
      </div>
      <el-button type="primary" @click="openCreateDialog"><el-icon><Plus /></el-icon> 新增账号</el-button>
    </div>

    <div class="glass-card table-wrap">
      <el-table :data="list" stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="username" label="登录账号" min-width="140" />
        <el-table-column prop="display_name" label="显示名称" min-width="140">
          <template #default="{ row }">{{ row.display_name || '-' }}</template>
        </el-table-column>
        <el-table-column prop="role" label="角色" width="120">
          <template #default="{ row }">
            <el-tag :type="row.role === 'admin' ? 'danger' : row.role === 'manager' ? 'warning' : 'info'">
              {{ roleLabel[row.role] || row.role }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <el-button size="small" link :disabled="!canManage(row)" @click="openEditDialog(row)">
              <el-icon><Edit /></el-icon> 编辑
            </el-button>
            <el-button size="small" link :disabled="!canManage(row)" @click="openPasswordDialog(row)">
              <el-icon><Lock /></el-icon> 重置密码
            </el-button>
            <el-button size="small" link type="danger" :disabled="!canManage(row)" @click="removeAccount(row)">
              <el-icon><Delete /></el-icon> 删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="accountDialogVisible" :title="editing ? '编辑账号' : '新增账号'" width="460px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="登录账号" required>
          <el-input v-model.trim="form.username" :disabled="!!editing" />
        </el-form-item>
        <el-form-item label="显示名称">
          <el-input v-model.trim="form.display_name" />
        </el-form-item>
        <el-form-item label="角色" required>
          <el-select v-model="form.role" style="width:100%">
            <el-option
              v-for="option in roleOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="!editing" label="初始密码" required>
          <el-input v-model="form.password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="accountDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveAccount">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="passwordDialogVisible" title="重置密码" width="420px">
      <el-form :model="passwordForm" label-width="90px">
        <el-form-item label="账号">
          <el-input :model-value="passwordTarget?.username || ''" disabled />
        </el-form-item>
        <el-form-item label="新密码" required>
          <el-input v-model="passwordForm.password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingPassword" @click="resetPassword">确认重置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, reactive, ref, onMounted } from 'vue'
import { usersApi } from '../api/index.js'
import { useAuthStore } from '../stores/auth.js'
import { ElMessage, ElMessageBox } from 'element-plus'

const authStore = useAuthStore()
const list = ref([])
const accountDialogVisible = ref(false)
const passwordDialogVisible = ref(false)
const editing = ref(null)
const passwordTarget = ref(null)
const saving = ref(false)
const savingPassword = ref(false)

const roleLabel = {
  admin: '管理员',
  manager: '店长',
  staff: '员工',
}
const currentRole = computed(() => String(authStore.user?.role || '').trim().toLowerCase())
const roleOptions = computed(() => {
  if (currentRole.value === 'admin') {
    return [
      { label: '店长', value: 'manager' },
      { label: '员工', value: 'staff' },
    ]
  }
  return [{ label: '员工', value: 'staff' }]
})
const pageTip = computed(() => {
  if (currentRole.value === 'admin') return '管理员可创建店长和员工账号，并重置非 admin 账号密码'
  return '店长可创建、编辑和删除自己创建的员工账号'
})

const form = reactive({
  username: '',
  display_name: '',
  role: 'staff',
  password: '',
})

const passwordForm = reactive({
  password: '',
})

async function load() {
  const res = await usersApi.list()
  list.value = Array.isArray(res?.data) ? res.data : []
}

function resetForm() {
  form.username = ''
  form.display_name = ''
  form.role = 'staff'
  form.password = ''
}

function openCreateDialog() {
  editing.value = null
  resetForm()
  form.role = roleOptions.value[0]?.value || 'staff'
  accountDialogVisible.value = true
}

function openEditDialog(row) {
  editing.value = row
  form.username = row.username
  form.display_name = row.display_name || ''
  form.role = row.role || 'staff'
  form.password = ''
  accountDialogVisible.value = true
}

async function saveAccount() {
  if (!form.username) return ElMessage.warning('请输入登录账号')
  if (!editing.value && !form.password) return ElMessage.warning('请输入初始密码')

  saving.value = true
  try {
    if (editing.value) {
      await usersApi.update(editing.value.id, {
        username: form.username,
        display_name: form.display_name,
        role: currentRole.value === 'manager' ? 'staff' : form.role,
      })
    } else {
      await usersApi.create({
        username: form.username,
        password: form.password,
        display_name: form.display_name,
        role: currentRole.value === 'manager' ? 'staff' : form.role,
      })
    }
    ElMessage.success('保存成功')
    accountDialogVisible.value = false
    await load()
  } catch (err) {
    ElMessage.error(err?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

function canManage(row) {
  if (currentRole.value === 'admin') return row.role !== 'admin'
  return row.role === 'staff'
}

function openPasswordDialog(row) {
  passwordTarget.value = row
  passwordForm.password = ''
  passwordDialogVisible.value = true
}

async function resetPassword() {
  if (!passwordForm.password) return ElMessage.warning('请输入新密码')
  savingPassword.value = true
  try {
    await usersApi.updatePassword(passwordTarget.value.id, passwordForm.password)
    ElMessage.success('密码已更新')
    passwordDialogVisible.value = false
  } catch (err) {
    ElMessage.error(err?.message || '重置失败')
  } finally {
    savingPassword.value = false
  }
}

async function removeAccount(row) {
  await ElMessageBox.confirm(`确认删除账号 "${row.username}"？`, '确认', { type: 'warning' })
  await usersApi.delete(row.id)
  ElMessage.success('账号已删除')
  await load()
}

onMounted(load)
</script>

<style scoped>
.table-wrap { padding: 12px; }
</style>
