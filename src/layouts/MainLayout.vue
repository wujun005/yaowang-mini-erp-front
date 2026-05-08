<template>
  <div class="app-layout">
    <aside class="sidebar">
      <div class="brand">
        <span class="brand-mark">Y</span>
        <div>
          <strong>药网 ERP</strong>
          <span>管理端</span>
        </div>
      </div>

      <el-menu
        :default-active="activeMenu"
        :default-openeds="['product', 'wms', 'salary', 'system', 'basic']"
        class="side-menu"
        router
      >
        <el-menu-item index="/dashboard">
          <el-icon><House /></el-icon>
          <span>工作台</span>
        </el-menu-item>
        <el-sub-menu index="product">
          <template #title>
            <el-icon><Goods /></el-icon>
            <span>商品管理</span>
          </template>
          <el-menu-item index="/spu">SPU 管理</el-menu-item>
          <el-menu-item index="/sku">SKU 管理</el-menu-item>
          <el-menu-item index="/category">商品分类</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="wms">
          <template #title>
            <el-icon><Box /></el-icon>
            <span>仓储管理</span>
          </template>
          <el-menu-item index="/warehouse">仓库管理</el-menu-item>
          <el-menu-item index="/shelf">货架管理</el-menu-item>
          <el-menu-item index="/layer">货架层管理</el-menu-item>
          <el-menu-item index="/inventory">库存大盘</el-menu-item>
          <el-menu-item index="/inventory-log">库存日志</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="basic">
          <template #title>
            <el-icon><Collection /></el-icon>
            <span>基础资料</span>
          </template>
          <el-menu-item index="/unit">计量单位</el-menu-item>
          <el-menu-item index="/material">资料中心</el-menu-item>
          <el-menu-item index="/file-center">文件中心</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="salary">
          <template #title>
            <el-icon><Money /></el-icon>
            <span>薪资计算</span>
          </template>
          <el-menu-item index="/salary-center">价格中心</el-menu-item>
          <el-menu-item index="/labor-shift-work">工作量记录</el-menu-item>
          <el-menu-item index="/labor-shift-fee-result">工资计算结果</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="system">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>系统管理</span>
          </template>
          <el-menu-item index="/partner">合作方管理</el-menu-item>
          <el-menu-item index="/operation-log">操作记录</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </aside>

    <main class="app-shell">
      <section class="page-heading">
        <div>
          <p class="eyebrow">{{ routeMeta.group }}</p>
          <h1>{{ routeMeta.title }}</h1>
        </div>
        <div class="heading-actions">
          <el-form class="tenant-form" label-position="top">
            <el-form-item label="租户 ID">
              <el-input v-model.trim="tenantId" class="tenant-input" @change="handleTenantChange" />
            </el-form-item>
          </el-form>
          <el-dropdown trigger="click" @command="handleUserCommand">
            <el-button class="user-button">
              <el-icon><User /></el-icon>
              <span>{{ currentUserName }}</span>
              <el-icon><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="changePassword">修改密码</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </section>

      <router-view />
    </main>

    <el-dialog v-model="passwordDialog.visible" title="修改密码" width="520px">
      <el-form class="dialog-form single-column-form" :model="passwordDialog.form" label-position="top">
        <el-form-item label="旧密码" required>
          <el-input
            v-model.trim="passwordDialog.form.oldPassword"
            autocomplete="current-password"
            placeholder="请输入旧密码"
            show-password
            type="password"
          />
        </el-form-item>
        <el-form-item label="新密码" required>
          <el-input
            v-model.trim="passwordDialog.form.newPassword"
            autocomplete="new-password"
            placeholder="请输入新密码"
            show-password
            type="password"
          />
        </el-form-item>
        <el-form-item label="确认密码" required>
          <el-input
            v-model.trim="passwordDialog.form.confirmPassword"
            autocomplete="new-password"
            placeholder="请再次输入新密码"
            show-password
            type="password"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="passwordDialog.saving" @click="submitChangePassword">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowDown, Box, Collection, Document, Folder, Goods, House, Money, Setting, User } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { authApi, clearAuthSession, getAuthSession, getTenantId, setTenantId } from '../api/wms'

const route = useRoute()
const router = useRouter()

const tenantId = ref(getTenantId())
const passwordDialog = reactive({
  visible: false,
  saving: false,
  form: createPasswordForm()
})

const currentUser = computed(() => getAuthSession())
const currentUserName = computed(() => (
  currentUser.value?.userName || currentUser.value?.account || '当前用户'
))

const activeMenu = computed(() => {
  return route.path
})

const routeMeta = computed(() => {
  const metaMap = {
    '/dashboard': { group: '概览', title: '工作台' },
    '/spu': { group: '商品管理', title: 'SPU 管理' },
    '/sku': { group: '商品管理', title: 'SKU 管理' },
    '/category': { group: '商品管理', title: '商品分类' },
    '/warehouse': { group: '仓储管理', title: '仓库管理' },
    '/shelf': { group: '仓储管理', title: '货架管理' },
    '/layer': { group: '仓储管理', title: '货架层管理' },
    '/inventory': { group: '仓储管理', title: '库存大盘' },
    '/inventory-log': { group: '仓储管理', title: '库存日志' },
    '/unit': { group: '基础资料', title: '计量单位' },
    '/material': { group: '基础资料', title: '资料中心' },
    '/file-center': { group: '基础资料', title: '文件中心' },
    '/salary-center': { group: '薪资计算', title: '价格中心' },
    '/labor-shift-work': { group: '薪资计算', title: '工作量记录' },
    '/labor-shift-fee-result': { group: '薪资计算', title: '工资计算结果' },
    '/partner': { group: '系统管理', title: '合作方管理' },
    '/operation-log': { group: '系统管理', title: '操作记录' }
  }
  return metaMap[route.path] || { group: '', title: '' }
})

function handleTenantChange() {
  setTenantId(tenantId.value)
  tenantId.value = getTenantId()
}

async function handleUserCommand(command) {
  if (command === 'changePassword') {
    passwordDialog.form = createPasswordForm()
    passwordDialog.visible = true
    return
  }

  if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确认退出当前账号吗？', '退出登录', {
        type: 'warning',
        confirmButtonText: '退出',
        cancelButtonText: '取消'
      })
      clearAuthSession()
      router.push('/login')
      ElMessage.success('已退出登录')
    } catch (error) {
      if (error !== 'cancel' && error !== 'close') {
        ElMessage.error(error.message || '退出失败')
      }
    }
  }
}

function createPasswordForm() {
  return {
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  }
}

async function submitChangePassword() {
  const form = passwordDialog.form
  if (!form.oldPassword || !form.newPassword) {
    ElMessage.warning('请填写旧密码和新密码')
    return
  }
  if (form.newPassword !== form.confirmPassword) {
    ElMessage.warning('两次输入的密码不一致')
    return
  }

  passwordDialog.saving = true
  try {
    await authApi.changePassword({
      oldPassword: form.oldPassword,
      newPassword: form.newPassword
    })
    ElMessage.success('密码修改成功')
    passwordDialog.visible = false
  } catch (error) {
    ElMessage.error(error.message || '修改密码失败')
  } finally {
    passwordDialog.saving = false
  }
}
</script>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  width: 220px;
  background: #1a1a2e;
  color: #fff;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}

.brand {
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.brand-mark {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: bold;
}

.brand strong {
  display: block;
  font-size: 16px;
}

.brand span {
  font-size: 12px;
  opacity: 0.7;
}

.side-menu {
  border-right: none;
  background: transparent;
  flex: 1;
  padding: 12px 0;
}

.side-menu :deep(.el-menu-item),
.side-menu :deep(.el-sub-menu__title) {
  color: rgba(255,255,255,0.8);
}

.side-menu :deep(.el-menu-item:hover),
.side-menu :deep(.el-sub-menu__title:hover) {
  background: rgba(255,255,255,0.1);
}

.side-menu :deep(.el-menu-item.is-active) {
  background: rgba(102, 126, 234, 0.3);
  color: #fff;
}

.side-menu :deep(.el-sub-menu .el-menu-item) {
  padding-left: 50px !important;
}

.app-shell {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f5f7fa;
}

.page-heading {
  padding: 20px 24px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.page-heading .eyebrow {
  font-size: 12px;
  color: #909399;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.page-heading h1 {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.heading-actions {
  display: flex;
  align-items: flex-end;
  gap: 16px;
}

.tenant-form {
  margin: 0;
}

.tenant-form :deep(.el-form-item) {
  margin-bottom: 0;
}

.tenant-form :deep(.el-form-item__label) {
  padding-bottom: 4px;
  line-height: 1;
  font-size: 12px;
}

.tenant-input {
  width: 100px;
}

.user-button {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
