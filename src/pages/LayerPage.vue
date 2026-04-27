<template>
  <section class="toolbar">
    <div class="toolbar-title-row">
      <h2>货架层列表</h2>
      <el-button type="primary" :icon="Plus" :disabled="!shelves.length" @click="openCreate">
        新增货架层
      </el-button>
    </div>
    <el-form :model="filters" class="filter-form compact-filter-form" label-position="top" @submit.prevent>
      <el-form-item label="所属仓库">
        <el-select v-model="filters.warehouseId" filterable placeholder="选择仓库" @change="handleWarehouseChange">
          <el-option
            v-for="warehouse in warehouses"
            :key="warehouse.id"
            :label="`${warehouse.name}（${warehouse.code}）`"
            :value="warehouse.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="所属货架">
        <el-select v-model="filters.shelfId" filterable placeholder="选择货架" @change="fetchList">
          <el-option
            v-for="shelf in shelves"
            :key="shelf.id"
            :label="`${shelf.shelfCode}（${shelf.zoneName || '未分区'}）`"
            :value="shelf.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item class="filter-actions">
        <el-button type="primary" :icon="Search" :loading="loading" @click="fetchList">查询</el-button>
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
      height="calc(100vh - 246px)"
      empty-text="暂无货架层数据"
    >
      <el-table-column prop="warehouseName" label="所属仓库" min-width="170" fixed show-overflow-tooltip />
      <el-table-column prop="shelfCode" label="货架编号" min-width="140" show-overflow-tooltip />
      <el-table-column prop="layerNo" label="层号" width="100" align="right" />
      <el-table-column label="是否启用" width="120">
        <template #default="{ row }">
          <el-tag :type="Number(row.enabled) === 1 ? 'success' : 'info'" effect="light">
            {{ row.enabledLabel || (Number(row.enabled) === 1 ? '是' : '否') }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" fixed="right" width="96" align="center">
        <template #default="{ row }">
          <el-button type="primary" link :icon="Edit" @click="openEdit(row)">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>
  </section>

  <el-dialog v-model="editDialog.visible" :title="editDialog.isEdit ? '编辑货架层' : '新增货架层'" width="680px">
    <el-form class="dialog-form" :model="editDialog.form" label-position="top">
      <el-form-item label="所属仓库" required>
        <el-select v-model="editDialog.form.warehouseId" filterable placeholder="选择仓库" @change="handleDialogWarehouseChange">
          <el-option
            v-for="warehouse in warehouses"
            :key="warehouse.id"
            :label="`${warehouse.name}（${warehouse.code}）`"
            :value="warehouse.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="所属货架" required>
        <el-select v-model="editDialog.form.shelfId" filterable placeholder="选择货架">
          <el-option
            v-for="shelf in dialogShelves"
            :key="shelf.id"
            :label="`${shelf.shelfCode}（${shelf.zoneName || '未分区'}）`"
            :value="shelf.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="层号" required>
        <el-input-number v-model="editDialog.form.layerNo" :min="1" controls-position="right" />
      </el-form-item>
      <el-form-item label="是否启用" required>
        <el-select v-model="editDialog.form.enabled" placeholder="请选择">
          <el-option label="是" :value="1" />
          <el-option label="否" :value="0" />
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
import { layerApi, shelfApi, warehouseApi } from '../api/wms'

const loading = ref(false)
const warehouses = ref([])
const shelves = ref([])
const dialogShelves = ref([])
const rows = ref([])
const filters = reactive({
  warehouseId: undefined,
  shelfId: undefined
})
const editDialog = reactive({
  visible: false,
  saving: false,
  isEdit: false,
  form: createEmptyForm()
})

onMounted(async () => {
  await fetchWarehouses()
  await fetchShelves()
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

async function fetchShelves() {
  if (!filters.warehouseId) {
    shelves.value = []
    filters.shelfId = undefined
    return
  }

  try {
    const data = await shelfApi.page({
      warehouseId: filters.warehouseId,
      pageNum: 1,
      pageSize: 50
    })
    shelves.value = Array.isArray(data?.list) ? data.list : []
    filters.shelfId = shelves.value[0]?.id
  } catch (error) {
    shelves.value = []
    filters.shelfId = undefined
    ElMessage.error(error.message || '货架下拉加载失败')
  }
}

async function fetchDialogShelves() {
  if (!editDialog.form.warehouseId) {
    dialogShelves.value = []
    editDialog.form.shelfId = undefined
    return
  }

  try {
    const data = await shelfApi.page({
      warehouseId: editDialog.form.warehouseId,
      pageNum: 1,
      pageSize: 50
    })
    dialogShelves.value = Array.isArray(data?.list) ? data.list : []
    if (!dialogShelves.value.some((shelf) => shelf.id === editDialog.form.shelfId)) {
      editDialog.form.shelfId = dialogShelves.value[0]?.id
    }
  } catch (error) {
    dialogShelves.value = []
    editDialog.form.shelfId = undefined
    ElMessage.error(error.message || '货架下拉加载失败')
  }
}

async function fetchList() {
  if (!filters.shelfId) {
    rows.value = []
    return
  }

  loading.value = true
  try {
    const data = await layerApi.page({
      shelfId: filters.shelfId,
      unpaged: true,
      pageNum: 1,
      pageSize: 50
    })
    rows.value = Array.isArray(data?.list) ? data.list : []
  } catch (error) {
    rows.value = []
    ElMessage.error(error.message || '货架层列表加载失败')
  } finally {
    loading.value = false
  }
}

async function handleWarehouseChange() {
  await fetchShelves()
  fetchList()
}

async function handleReset() {
  filters.warehouseId = warehouses.value[0]?.id
  await fetchShelves()
  fetchList()
}

function createEmptyForm() {
  return {
    id: undefined,
    warehouseId: undefined,
    shelfId: undefined,
    layerNo: 1,
    enabled: 1
  }
}

async function openCreate() {
  editDialog.isEdit = false
  editDialog.form = {
    ...createEmptyForm(),
    warehouseId: filters.warehouseId || warehouses.value[0]?.id,
    shelfId: filters.shelfId
  }
  await fetchDialogShelves()
  editDialog.visible = true
}

async function openEdit(row) {
  editDialog.isEdit = true
  editDialog.form = {
    id: row.id,
    warehouseId: row.warehouseId,
    shelfId: row.shelfId,
    layerNo: Number(row.layerNo || 1),
    enabled: Number(row.enabled ?? 1)
  }
  await fetchDialogShelves()
  editDialog.form.shelfId = row.shelfId
  editDialog.visible = true
}

async function handleDialogWarehouseChange() {
  await fetchDialogShelves()
}

async function submitForm() {
  if (!editDialog.form.shelfId || !editDialog.form.layerNo) {
    ElMessage.warning('请选择货架并填写层号')
    return
  }

  editDialog.saving = true
  try {
    await layerApi.save({
      id: editDialog.form.id,
      shelfId: editDialog.form.shelfId,
      layerNo: editDialog.form.layerNo,
      enabled: editDialog.form.enabled
    })
    ElMessage.success('保存成功')
    editDialog.visible = false
    filters.warehouseId = editDialog.form.warehouseId
    await fetchShelves()
    filters.shelfId = editDialog.form.shelfId
    fetchList()
  } catch (error) {
    ElMessage.error(error.message || '保存失败')
  } finally {
    editDialog.saving = false
  }
}
</script>
