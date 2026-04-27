<template>
  <el-config-provider :locale="zhCn">
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
          :default-openeds="['product', 'wms']"
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
          <el-menu-item index="operationLog">
            <el-icon><Tickets /></el-icon>
            <span>操作记录</span>
          </el-menu-item>
        </el-menu>
      </aside>

      <main class="app-shell">
        <section class="page-heading">
          <div>
            <p class="eyebrow">{{ currentMenu.group }}</p>
            <h1>{{ currentMenu.title }}</h1>
          </div>
          <el-form class="tenant-form" label-position="top">
            <el-form-item label="租户 ID">
              <el-input v-model.trim="tenantId" class="tenant-input" @change="handleTenantChange" />
            </el-form-item>
          </el-form>
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
  </el-config-provider>
</template>

<script setup>
import { computed, ref } from 'vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { Box, Collection, Goods, House, Tickets } from '@element-plus/icons-vue'
import { getTenantId, setTenantId } from './api/wms'
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
  operationLog: OperationLogPage
}

const activeMenu = ref('sku')
const tenantId = ref(getTenantId())
const tenantVersion = ref(0)
const inventoryLogInventoryNo = ref('')

const currentMenu = computed(() => menuMeta[activeMenu.value] || menuMeta.dashboard)
const currentPageComponent = computed(() => pageComponents[activeMenu.value] || DashboardPage)
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
</script>
