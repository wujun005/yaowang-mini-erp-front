<template>
  <el-config-provider :locale="zhCn">
    <LoginPage v-if="!loggedIn" @login-success="handleLoginSuccess" />

    <div v-else class="app-layout">
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
          :default-openeds="['product', 'wms', 'system']"
          class="side-menu"
          @select="handleMenuSelect"
        >
          <el-menu-item index="dashboard">
            <el-icon><House /></el-icon>
            <span>工作台</span>
          </el-menu-item>
          <el-sub-menu index="product">
            <template #title>
              <el-icon><Goods /></el-icon>
              <span>商品管理</span>
            </template>
            <el-menu-item index="spu">SPU 管理</el-menu-item>
            <el-menu-item index="sku">SKU 管理</el-menu-item>
            <el-menu-item index="category">商品分类</el-menu-item>
          </el-sub-menu>
          <el-sub-menu index="wms">
            <template #title>
              <el-icon><Box /></el-icon>
              <span>仓储管理</span>
            </template>
            <el-menu-item index="warehouse">仓库管理</el-menu-item>
            <el-menu-item index="shelf">货架管理</el-menu-item>
            <el-menu-item index="layer">货架层管理</el-menu-item>
            <el-menu-item index="inventory">库存大盘</el-menu-item>
            <el-menu-item index="inventoryLog">库存日志</el-menu-item>
          </el-sub-menu>
          <el-menu-item index="unit">
            <el-icon><Collection /></el-icon>
            <span>计量单位</span>
          </el-menu-item>
          <el-menu-item index="material">
            <el-icon><Document /></el-icon>
            <span>资料中心</span>
          </el-menu-item>
          <el-menu-item index="salaryCenter">
            <el-icon><Money /></el-icon>
            <span>工资中心</span>
          </el-menu-item>
          <el-sub-menu index="system">
            <template #title>
              <el-icon><Setting /></el-icon>
              <span>系统管理</span>
            </template>
            <el-menu-item index="partner">合作方管理</el-menu-item>
            <el-menu-item index="operationLog">操作记录</el-menu-item>
          </el-sub-menu>
        </el-menu>
      </aside>

      <main class="app-shell">
        <section class="page-heading">
          <div>
            <p class="eyebrow">{{ currentMenu.group }}</p>
            <h1>{{ currentMenu.title }}</h1>
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

        <InventoryPage
          v-if="activeMenu === 'inventory'"
          :key="currentPageKey"
          @open-inventory-log="openInventoryLog"
        />
        <InventoryLogPage
          v-else-if="activeMenu === 'inventoryLog'"
          :key="currentPageKey"
          :initial-inventory-no="inventoryLogInventoryNo"
        />
        <component v-else :is="currentPageComponent" :key="currentPageKey" />
      </main>
    </div>

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
  </el-config-provider>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { ArrowDown, Box, Collection, Document, Goods, House, Money, Setting, User } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { authApi, clearAuthSession, getAuthSession, getTenantId, setTenantId } from './api/wms'
import LoginPage from './pages/LoginPage.vue'
import DashboardPage from './pages/DashboardPage.vue'
import SpuPage from './pages/SpuPage.vue'
import SkuPage from './pages/SkuPage.vue'
import CategoryPage from './pages/CategoryPage.vue'
import WarehousePage from './pages/WarehousePage.vue'
import ShelfPage from './pages/ShelfPage.vue'
import LayerPage from './pages/LayerPage.vue'
import InventoryPage from './pages/InventoryPage.vue'
import InventoryLogPage from './pages/InventoryLogPage.vue'
import UnitPage from './pages/UnitPage.vue'
import OperationLogPage from './pages/OperationLogPage.vue'
import MaterialPage from './pages/MaterialPage.vue'
import PartnerPage from './pages/PartnerPage.vue'
import SalaryCenterPage from './pages/SalaryCenterPage.vue'

const menuMeta = {
  dashboard: { group: '概览', title: '工作台' },
  spu: { group: '商品管理', title: 'SPU 管理' },
  sku: { group: '商品管理', title: 'SKU 管理' },
  category: { group: '商品管理', title: '商品分类' },
  warehouse: { group: '仓储管理', title: '仓库管理' },
  shelf: { group: '仓储管理', title: '货架管理' },
  layer: { group: '仓储管理', title: '货架层管理' },
  inventory: { group: '仓储管理', title: '库存大盘' },
  inventoryLog: { group: '仓储管理', title: '库存日志' },
  unit: { group: '基础资料', title: '计量单位' },
  material: { group: '基础资料', title: '资料中心' },
  salaryCenter: { group: '基础资料', title: '工资中心' },
  partner: { group: '系统管理', title: '合作方管理' },
  operationLog: { group: '系统管理', title: '操作记录' }
}

const pageComponents = {
  dashboard: DashboardPage,
  spu: SpuPage,
  sku: SkuPage,
  category: CategoryPage,
  warehouse: WarehousePage,
  shelf: ShelfPage,
  layer: LayerPage,
  inventory: InventoryPage,
  inventoryLog: InventoryLogPage,
  unit: UnitPage,
  material: MaterialPage,
  salaryCenter: SalaryCenterPage,
  partner: PartnerPage,
  operationLog: OperationLogPage
}

const loggedIn = ref(Boolean(getAuthSession()))
const currentUser = ref(getAuthSession())
const activeMenu = ref('sku')
const tenantId = ref(getTenantId())
const tenantVersion = ref(0)
const inventoryLogInventoryNo = ref('')
const passwordDialog = reactive({
  visible: false,
  saving: false,
  form: createPasswordForm()
})

const currentMenu = computed(() => menuMeta[activeMenu.value] || menuMeta.dashboard)
const currentPageComponent = computed(() => pageComponents[activeMenu.value] || DashboardPage)
const currentUserName = computed(() => (
  currentUser.value?.userName || currentUser.value?.account || '当前用户'
))
const currentPageKey = computed(() => {
  const inventoryNoKey = activeMenu.value === 'inventoryLog' ? inventoryLogInventoryNo.value : ''
  return `${activeMenu.value}-${tenantVersion.value}-${inventoryNoKey}`
})

function handleMenuSelect(index) {
  if (index === 'inventoryLog') {
    inventoryLogInventoryNo.value = ''
  }
  activeMenu.value = index
}

function openInventoryLog(inventoryNo) {
  inventoryLogInventoryNo.value = inventoryNo || ''
  activeMenu.value = 'inventoryLog'
}

function handleTenantChange() {
  setTenantId(tenantId.value)
  tenantId.value = getTenantId()
  tenantVersion.value += 1
}

function handleLoginSuccess() {
  currentUser.value = getAuthSession()
  tenantId.value = getTenantId()
  loggedIn.value = true
  tenantVersion.value += 1
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
      currentUser.value = null
      loggedIn.value = false
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
