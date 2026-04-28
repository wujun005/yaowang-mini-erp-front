<template>
  <section class="toolbar">
    <div class="toolbar-title-row">
      <h2>合作方列表</h2>
      <el-button type="primary" :icon="Plus" @click="openCreate">新增合作方</el-button>
    </div>
    <el-form :model="filters" class="filter-form compact-filter-form" label-position="top" @submit.prevent>
      <el-form-item label="合作方编码">
        <el-input
          v-model.trim="filters.partnerCodeKeyword"
          clearable
          placeholder="输入合作方编码"
          @keyup.enter="handleSearch"
        />
      </el-form-item>
      <el-form-item label="合作方名称">
        <el-input
          v-model.trim="filters.partnerNameKeyword"
          clearable
          placeholder="输入合作方名称"
          @keyup.enter="handleSearch"
        />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="filters.status" clearable placeholder="全部状态">
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item class="filter-actions">
        <el-button type="primary" :icon="Search" :loading="loading" @click="handleSearch">查询</el-button>
        <el-button :icon="Refresh" @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>
  </section>

  <section class="table-section">
    <el-table
      v-loading="loading"
      :data="rows"
      row-key="id"
      border
      stripe
      height="calc(100vh - 292px)"
      empty-text="暂无合作方数据"
    >
      <el-table-column prop="partnerCode" label="合作方编码" min-width="150" fixed show-overflow-tooltip />
      <el-table-column prop="partnerName" label="合作方名称" min-width="180" show-overflow-tooltip />
      <el-table-column prop="tenantId" label="租户 ID" min-width="110" show-overflow-tooltip />
      <el-table-column prop="contactName" label="联系人" min-width="120" show-overflow-tooltip />
      <el-table-column prop="contactPhone" label="联系电话" min-width="140" show-overflow-tooltip />
      <el-table-column label="状态" width="110">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)" effect="light">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" min-width="180" show-overflow-tooltip />
      <el-table-column prop="modifyTime" label="修改时间" min-width="180" show-overflow-tooltip />
      <el-table-column label="操作" fixed="right" width="246" align="center">
        <template #default="{ row }">
          <div class="row-actions">
            <el-button type="primary" link :icon="User" @click="openAccountDrawer(row)">账号</el-button>
            <el-button type="primary" link :icon="Edit" @click="openEdit(row)">编辑</el-button>
            <el-button
              :type="Number(row.status) === 1 ? 'danger' : 'success'"
              link
              :icon="Number(row.status) === 1 ? Lock : Unlock"
              @click="togglePartnerStatus(row)"
            >
              {{ Number(row.status) === 1 ? '禁用' : '启用' }}
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-row">
      <span class="total-text">共 {{ total }} 条</span>
      <el-pagination
        v-model:current-page="page.pageNum"
        v-model:page-size="page.pageSize"
        :page-sizes="[10, 20, 50]"
        layout="sizes, prev, pager, next, jumper"
        :total="total"
        background
        @size-change="fetchList"
        @current-change="fetchList"
      />
    </div>
  </section>

  <el-dialog v-model="editDialog.visible" :title="editDialog.isEdit ? '编辑合作方' : '新增合作方'" width="720px">
    <el-form class="dialog-form" :model="editDialog.form" label-position="top">
      <el-form-item label="合作方编码" required>
        <el-input v-model.trim="editDialog.form.partnerCode" placeholder="请输入合作方编码" />
      </el-form-item>
      <el-form-item label="合作方名称" required>
        <el-input v-model.trim="editDialog.form.partnerName" placeholder="请输入合作方名称" />
      </el-form-item>
      <el-form-item label="联系人">
        <el-input v-model.trim="editDialog.form.contactName" placeholder="请输入联系人" />
      </el-form-item>
      <el-form-item label="联系电话">
        <el-input v-model.trim="editDialog.form.contactPhone" placeholder="请输入联系电话" />
      </el-form-item>
      <el-form-item label="状态" required>
        <el-select v-model="editDialog.form.status" placeholder="请选择状态">
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item class="full-line" label="备注">
        <el-input v-model.trim="editDialog.form.remark" type="textarea" :rows="3" placeholder="请输入备注" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="editDialog.visible = false">取消</el-button>
      <el-button type="primary" :loading="editDialog.saving" @click="submitPartner">保存</el-button>
    </template>
  </el-dialog>

  <el-drawer v-model="accountDrawer.visible" size="820px" :title="accountDrawer.title">
    <div class="drawer-toolbar">
      <div class="drawer-summary">
        <strong>{{ accountDrawer.partnerCode || '-' }}</strong>
        <span>租户 ID：{{ accountDrawer.tenantId || '-' }}</span>
      </div>
      <el-button type="primary" :icon="Plus" @click="openAssignDialog">分配账号</el-button>
    </div>

    <el-table
      v-loading="accountDrawer.loading"
      :data="accountDrawer.users"
      row-key="userId"
      border
      stripe
      height="calc(100vh - 180px)"
      empty-text="暂无账号数据"
    >
      <el-table-column prop="account" label="账号" min-width="150" fixed show-overflow-tooltip />
      <el-table-column prop="userName" label="用户名称" min-width="140" show-overflow-tooltip />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)" effect="light">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" min-width="180" show-overflow-tooltip />
      <el-table-column prop="modifyTime" label="修改时间" min-width="180" show-overflow-tooltip />
      <el-table-column label="操作" fixed="right" width="218" align="center">
        <template #default="{ row }">
          <div class="row-actions">
            <el-button type="primary" link :icon="Key" @click="openResetUserPassword(row)">重置密码</el-button>
            <el-button
              :type="Number(row.status) === 1 ? 'danger' : 'success'"
              link
              :icon="Number(row.status) === 1 ? Lock : Unlock"
              @click="toggleUserStatus(row)"
            >
              {{ Number(row.status) === 1 ? '禁用' : '启用' }}
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </el-drawer>

  <el-dialog v-model="assignDialog.visible" title="分配账号" width="560px">
    <el-form class="dialog-form single-column-form" :model="assignDialog.form" label-position="top">
      <el-form-item label="登录账号" required>
        <el-input v-model.trim="assignDialog.form.account" placeholder="请输入登录账号" />
      </el-form-item>
      <el-form-item label="用户名称" required>
        <el-input v-model.trim="assignDialog.form.userName" placeholder="请输入用户名称" />
      </el-form-item>
      <el-form-item label="初始密码" required>
        <el-input
          v-model.trim="assignDialog.form.password"
          autocomplete="new-password"
          placeholder="请输入初始密码"
          show-password
          type="password"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="assignDialog.visible = false">取消</el-button>
      <el-button type="primary" :loading="assignDialog.saving" @click="submitAssignUser">保存</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="resetUserDialog.visible" title="重置账号密码" width="520px">
    <el-form class="dialog-form single-column-form" :model="resetUserDialog.form" label-position="top">
      <el-form-item label="账号">
        <el-input v-model="resetUserDialog.form.account" disabled />
      </el-form-item>
      <el-form-item label="新密码" required>
        <el-input
          v-model.trim="resetUserDialog.form.newPassword"
          autocomplete="new-password"
          placeholder="请输入新密码"
          show-password
          type="password"
        />
      </el-form-item>
      <el-form-item label="确认密码" required>
        <el-input
          v-model.trim="resetUserDialog.form.confirmPassword"
          autocomplete="new-password"
          placeholder="请再次输入新密码"
          show-password
          type="password"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="resetUserDialog.visible = false">取消</el-button>
      <el-button type="primary" :loading="resetUserDialog.saving" @click="submitResetUserPassword">
        保存
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { Edit, Key, Lock, Plus, Refresh, Search, Unlock, User } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { partnerApi } from '../api/wms'
import { statusLabel, statusTagType } from '../utils/display'

const loading = ref(false)
const rows = ref([])
const total = ref(0)
const filters = reactive({
  partnerCodeKeyword: '',
  partnerNameKeyword: '',
  status: undefined
})
const page = reactive({
  pageNum: 1,
  pageSize: 20
})
const editDialog = reactive({
  visible: false,
  saving: false,
  isEdit: false,
  form: createPartnerForm()
})
const accountDrawer = reactive({
  visible: false,
  loading: false,
  partnerId: undefined,
  partnerCode: '',
  partnerName: '',
  tenantId: '',
  title: '账号管理',
  users: []
})
const assignDialog = reactive({
  visible: false,
  saving: false,
  form: createAssignForm()
})
const resetUserDialog = reactive({
  visible: false,
  saving: false,
  form: createResetUserForm()
})

onMounted(() => {
  fetchList()
})

async function fetchList() {
  loading.value = true
  try {
    const data = await partnerApi.page({
      pageNum: page.pageNum,
      pageSize: page.pageSize,
      ...filters
    })
    rows.value = Array.isArray(data?.list) ? data.list : []
    total.value = Number(data?.total || 0)
  } catch (error) {
    rows.value = []
    total.value = 0
    ElMessage.error(error.message || '合作方列表加载失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  page.pageNum = 1
  fetchList()
}

function handleReset() {
  filters.partnerCodeKeyword = ''
  filters.partnerNameKeyword = ''
  filters.status = undefined
  page.pageNum = 1
  fetchList()
}

function createPartnerForm() {
  return {
    id: undefined,
    partnerCode: '',
    partnerName: '',
    status: 1,
    contactName: '',
    contactPhone: '',
    remark: ''
  }
}

function openCreate() {
  editDialog.isEdit = false
  editDialog.form = createPartnerForm()
  editDialog.visible = true
}

async function openEdit(row) {
  editDialog.isEdit = true
  editDialog.form = {
    ...createPartnerForm(),
    ...row,
    status: Number(row.status ?? 1)
  }

  try {
    const detail = await partnerApi.detail(row.id)
    editDialog.form = {
      ...createPartnerForm(),
      ...detail,
      status: Number(detail?.status ?? 1)
    }
  } catch {
    // 列表数据足够支撑编辑弹窗；详情失败时允许继续编辑当前行。
  }
  editDialog.visible = true
}

async function submitPartner() {
  if (!editDialog.form.partnerCode || !editDialog.form.partnerName) {
    ElMessage.warning('请填写合作方编码和名称')
    return
  }

  editDialog.saving = true
  try {
    await partnerApi.save(editDialog.form)
    ElMessage.success('保存成功')
    editDialog.visible = false
    fetchList()
  } catch (error) {
    ElMessage.error(error.message || '保存失败')
  } finally {
    editDialog.saving = false
  }
}

async function togglePartnerStatus(row) {
  const isEnabled = Number(row.status) === 1
  try {
    if (isEnabled) {
      await ElMessageBox.confirm(`确认禁用合作方「${row.partnerName || row.partnerCode}」吗？`, '禁用确认', {
        type: 'warning',
        confirmButtonText: '禁用',
        cancelButtonText: '取消',
        confirmButtonClass: 'el-button--danger'
      })
      await partnerApi.disable(row.id)
      ElMessage.success('已禁用')
    } else {
      await partnerApi.enable(row.id)
      ElMessage.success('已启用')
    }
    fetchList()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(error.message || '状态更新失败')
    }
  }
}

function openAccountDrawer(row) {
  accountDrawer.partnerId = row.id
  accountDrawer.partnerCode = row.partnerCode || ''
  accountDrawer.partnerName = row.partnerName || ''
  accountDrawer.tenantId = row.tenantId || ''
  accountDrawer.title = `账号管理 - ${row.partnerName || row.partnerCode || ''}`
  accountDrawer.visible = true
  fetchUsers()
}

async function fetchUsers() {
  if (!accountDrawer.partnerId) return

  accountDrawer.loading = true
  try {
    const data = await partnerApi.users(accountDrawer.partnerId)
    accountDrawer.users = Array.isArray(data) ? data : []
  } catch (error) {
    accountDrawer.users = []
    ElMessage.error(error.message || '账号列表加载失败')
  } finally {
    accountDrawer.loading = false
  }
}

function createAssignForm() {
  return {
    account: '',
    userName: '',
    password: ''
  }
}

function openAssignDialog() {
  assignDialog.form = createAssignForm()
  assignDialog.visible = true
}

async function submitAssignUser() {
  const form = assignDialog.form
  if (!form.account || !form.userName || !form.password) {
    ElMessage.warning('请填写账号、用户名称和初始密码')
    return
  }

  assignDialog.saving = true
  try {
    await partnerApi.assignUser(accountDrawer.partnerId, form)
    ElMessage.success('账号分配成功')
    assignDialog.visible = false
    fetchUsers()
  } catch (error) {
    ElMessage.error(error.message || '账号分配失败')
  } finally {
    assignDialog.saving = false
  }
}

async function toggleUserStatus(row) {
  const isEnabled = Number(row.status) === 1
  try {
    if (isEnabled) {
      await ElMessageBox.confirm(`确认禁用账号「${row.account}」吗？`, '禁用确认', {
        type: 'warning',
        confirmButtonText: '禁用',
        cancelButtonText: '取消',
        confirmButtonClass: 'el-button--danger'
      })
      await partnerApi.disableUser(accountDrawer.partnerId, row.userId)
      ElMessage.success('账号已禁用')
    } else {
      await partnerApi.enableUser(accountDrawer.partnerId, row.userId)
      ElMessage.success('账号已启用')
    }
    fetchUsers()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(error.message || '账号状态更新失败')
    }
  }
}

function createResetUserForm() {
  return {
    userId: undefined,
    account: '',
    newPassword: '',
    confirmPassword: ''
  }
}

function openResetUserPassword(row) {
  resetUserDialog.form = {
    ...createResetUserForm(),
    userId: row.userId,
    account: row.account || ''
  }
  resetUserDialog.visible = true
}

async function submitResetUserPassword() {
  const form = resetUserDialog.form
  if (!form.newPassword) {
    ElMessage.warning('请输入新密码')
    return
  }
  if (form.newPassword !== form.confirmPassword) {
    ElMessage.warning('两次输入的密码不一致')
    return
  }

  resetUserDialog.saving = true
  try {
    await partnerApi.resetUserPassword(accountDrawer.partnerId, form.userId, {
      newPassword: form.newPassword
    })
    ElMessage.success('密码已重置')
    resetUserDialog.visible = false
  } catch (error) {
    ElMessage.error(error.message || '重置密码失败')
  } finally {
    resetUserDialog.saving = false
  }
}
</script>
