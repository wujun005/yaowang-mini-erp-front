<template>
  <section class="toolbar">
    <div class="toolbar-title-row">
      <h2>货架列表</h2>
      <el-button type="primary" :icon="Plus" :disabled="!warehouses.length" @click="openCreate">
        新增货架
      </el-button>
    </div>
    <el-form :model="filters" class="filter-form" label-position="top" @submit.prevent>
      <el-form-item label="所属仓库">
        <el-select v-model="filters.warehouseId" filterable placeholder="选择仓库" @change="handleSearch">
          <el-option
            v-for="warehouse in warehouses"
            :key="warehouse.id"
            :label="`${warehouse.name}（${warehouse.code}）`"
            :value="warehouse.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="货架编号">
        <el-input
          v-model.trim="filters.codeKeyword"
          clearable
          placeholder="输入货架编号"
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
      empty-text="暂无货架数据"
    >
      <el-table-column prop="shelfCode" label="货架编号" min-width="140" fixed show-overflow-tooltip />
      <el-table-column prop="warehouseName" label="所属仓库" min-width="180" show-overflow-tooltip />
      <el-table-column prop="totalLayers" label="层数" width="90" align="right" />
      <el-table-column label="状态" width="110">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)" effect="light">{{ statusLabel(row) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" fixed="right" width="96" align="center">
        <template #default="{ row }">
          <el-button type="primary" link :icon="Edit" @click="openEdit(row)">编辑</el-button>
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

  <el-dialog v-model="editDialog.visible" :title="editDialog.isEdit ? '编辑货架' : '新增货架'" width="680px">
    <el-form class="dialog-form" :model="editDialog.form" label-position="top">
      <el-form-item label="所属仓库" required>
        <el-select v-model="editDialog.form.warehouseId" filterable placeholder="选择仓库" :disabled="editDialog.isEdit">
          <el-option
            v-for="warehouse in warehouses"
            :key="warehouse.id"
            :label="`${warehouse.name}（${warehouse.code}）`"
            :value="warehouse.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="货架编号" required>
        <el-input v-model.trim="editDialog.form.shelfCode" placeholder="请输入货架编号" />
      </el-form-item>
      <el-form-item label="状态" required>
        <el-select v-model="editDialog.form.status" placeholder="请选择状态">
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="editDialog.visible = false">取消</el-button>
      <el-button type="primary" :loading="editDialog.saving" @click="submitForm">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { Edit, Plus, Refresh, Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { shelfApi, warehouseApi } from '../api/wms'
import { statusLabel, statusTagType } from '../utils/display'

const loading = ref(false)
const warehouses = ref([])
const rows = ref([])
const total = ref(0)
const filters = reactive({
  warehouseId: undefined,
  codeKeyword: '',
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
  form: createEmptyForm()
})

onMounted(async () => {
  await fetchWarehouses()
  fetchList()
})

async function fetchWarehouses() {
  try {
    const data = await warehouseApi.page({ pageNum: 1, pageSize: 50 })
    warehouses.value = Array.isArray(data?.list) ? data.list : []
    filters.warehouseId = warehouses.value[0]?.id
  } catch (error) {
    warehouses.value = []
    ElMessage.error(error.message || '仓库下拉加载失败')
  }
}

async function fetchList() {
  if (!filters.warehouseId) {
    rows.value = []
    total.value = 0
    return
  }

  loading.value = true
  try {
    const data = await shelfApi.page({
      pageNum: page.pageNum,
      pageSize: page.pageSize,
      ...filters
    })
    rows.value = Array.isArray(data?.list) ? data.list : []
    total.value = Number(data?.total || 0)
  } catch (error) {
    rows.value = []
    total.value = 0
    ElMessage.error(error.message || '货架列表加载失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  page.pageNum = 1
  fetchList()
}

function handleReset() {
  filters.codeKeyword = ''
  filters.status = undefined
  page.pageNum = 1
  fetchList()
}

function createEmptyForm() {
  return {
    id: undefined,
    warehouseId: undefined,
    shelfCode: '',
    status: 1
  }
}

function openCreate() {
  editDialog.isEdit = false
  editDialog.form = {
    ...createEmptyForm(),
    warehouseId: filters.warehouseId || warehouses.value[0]?.id
  }
  editDialog.visible = true
}

function openEdit(row) {
  editDialog.isEdit = true
  editDialog.form = {
    id: row.id,
    warehouseId: row.warehouseId,
    shelfCode: row.shelfCode || '',
    status: Number(row.status ?? 1)
  }
  editDialog.visible = true
}

async function submitForm() {
  if (!editDialog.form.warehouseId || !editDialog.form.shelfCode) {
    ElMessage.warning('请选择仓库并填写货架编号')
    return
  }

  editDialog.saving = true
  try {
    await shelfApi.save(editDialog.form)
    ElMessage.success('保存成功')
    editDialog.visible = false
    filters.warehouseId = editDialog.form.warehouseId
    fetchList()
  } catch (error) {
    ElMessage.error(error.message || '保存失败')
  } finally {
    editDialog.saving = false
  }
}
</script>
