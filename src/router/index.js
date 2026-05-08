import { createRouter, createWebHashHistory } from 'vue-router'
import { getAuthSession } from './api/wms'

import LoginPage from '../pages/LoginPage.vue'
import DashboardPage from '../pages/DashboardPage.vue'
import SpuPage from '../pages/SpuPage.vue'
import SkuPage from '../pages/SkuPage.vue'
import CategoryPage from '../pages/CategoryPage.vue'
import WarehousePage from '../pages/WarehousePage.vue'
import ShelfPage from '../pages/ShelfPage.vue'
import LayerPage from '../pages/LayerPage.vue'
import InventoryPage from '../pages/InventoryPage.vue'
import InventoryLogPage from '../pages/InventoryLogPage.vue'
import UnitPage from '../pages/UnitPage.vue'
import OperationLogPage from '../pages/OperationLogPage.vue'
import MaterialPage from '../pages/MaterialPage.vue'
import FileCenterPage from '../pages/FileCenterPage.vue'
import PartnerPage from '../pages/PartnerPage.vue'
import SalaryCenterPage from '../pages/SalaryCenterPage.vue'
import LaborShiftWorkPage from '../pages/LaborShiftWorkPage.vue'
import LaborShiftFeeResultPage from '../pages/LaborShiftFeeResultPage.vue'

const routes = [
  { path: '/login', name: 'login', component: LoginPage },
  {
    path: '/',
    name: 'home',
    component: () => import('../layouts/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'dashboard', component: DashboardPage, meta: { title: '工作台' } },
      { path: 'spu', name: 'spu', component: SpuPage, meta: { title: 'SPU 管理' } },
      { path: 'sku', name: 'sku', component: SkuPage, meta: { title: 'SKU 管理' } },
      { path: 'category', name: 'category', component: CategoryPage, meta: { title: '商品分类' } },
      { path: 'warehouse', name: 'warehouse', component: WarehousePage, meta: { title: '仓库管理' } },
      { path: 'shelf', name: 'shelf', component: ShelfPage, meta: { title: '货架管理' } },
      { path: 'layer', name: 'layer', component: LayerPage, meta: { title: '货架层管理' } },
      { path: 'inventory', name: 'inventory', component: InventoryPage, meta: { title: '库存大盘' } },
      { path: 'inventory-log', name: 'inventoryLog', component: InventoryLogPage, meta: { title: '库存日志' } },
      { path: 'unit', name: 'unit', component: UnitPage, meta: { title: '计量单位' } },
      { path: 'material', name: 'material', component: MaterialPage, meta: { title: '资料中心' } },
      { path: 'file-center', name: 'fileCenter', component: FileCenterPage, meta: { title: '文件中心' } },
      { path: 'salary-center', name: 'salaryCenter', component: SalaryCenterPage, meta: { title: '价格中心' } },
      { path: 'labor-shift-work', name: 'laborShiftWork', component: LaborShiftWorkPage, meta: { title: '工作量记录' } },
      { path: 'labor-shift-fee-result', name: 'laborShiftFeeResult', component: LaborShiftFeeResultPage, meta: { title: '工资计算结果' } },
      { path: 'partner', name: 'partner', component: PartnerPage, meta: { title: '合作方管理' } },
      { path: 'operation-log', name: 'operationLog', component: OperationLogPage, meta: { title: '操作记录' } },
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const isLoggedIn = Boolean(getAuthSession())

  if (to.path === '/login') {
    if (isLoggedIn) {
      next('/')
    } else {
      next()
    }
    return
  }

  if (!isLoggedIn) {
    next('/login')
    return
  }

  next()
})

export default router
