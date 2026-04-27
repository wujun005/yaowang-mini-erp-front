<template>
  <section class="toolbar">
    <div class="toolbar-title-row">
      <h2>库存列表</h2>
      <div class="toolbar-actions">
        <el-button :icon="Download" :loading="templateLoading" @click="downloadTemplate">
          下载模板
        </el-button>
        <el-button type="primary" :icon="Upload" :loading="importLoading" @click="triggerImport">
          导入库存
        </el-button>
      </div>
      <input
        ref="importInputRef"
        class="hidden-file-input"
        type="file"
        accept=".xls,.xlsx"
        @change="handleImportChange"
      />
    </div>

    <el-form :model="filters" class="filter-form" label-position="top" @submit.prevent>
      <el-form-item label="仓库编码">
        <el-input
          v-model.trim="filters.warehouseCode"
          clearable
          placeholder="输入仓库编码"
          @keyup.enter="handleSearch"
        />
      </el-form-item>
      <el-form-item label="货架编码">
        <el-input
          v-model.trim="filters.shelfCode"
          clearable
          placeholder="输入货架编码"
          @keyup.enter="handleSearch"
        />
      </el-form-item>
      <el-form-item label="唯一编码">
        <el-input
          v-model.trim="filters.skuCode"
          clearable
          placeholder="输入商品唯一编码"
          @keyup.enter="handleSearch"
        />
      </el-form-item>
      <el-form-item label="商品名称">
        <el-input
          v-model.trim="filters.spuName"
          clearable
          placeholder="输入商品名称"
          @keyup.enter="handleSearch"
        />
      </el-form-item>
      <el-form-item label="商品简称">
        <el-input
          v-model.trim="filters.shortName"
          clearable
          placeholder="输入商品简称"
          @keyup.enter="handleSearch"
        />
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
      row-key="__rowKey"
      border
      stripe
      height="calc(100vh - 334px)"
      empty-text="暂无库存数据"
    >
      <el-table-column prop="skuCode" label="唯一编码" min-width="190" fixed show-overflow-tooltip />
      <el-table-column prop="inventoryNo" label="库存编号" min-width="160" show-overflow-tooltip />
      <el-table-column prop="shortName" label="商品简称" min-width="150" show-overflow-tooltip />
      <el-table-column prop="warehouseName" label="仓库名称" min-width="170" show-overflow-tooltip />
      <el-table-column prop="warehouseCode" label="仓库编码" min-width="130" show-overflow-tooltip />
      <el-table-column prop="shelfName" label="货架名称" min-width="130" show-overflow-tooltip />
      <el-table-column prop="shelfCode" label="货架编码" min-width="120" show-overflow-tooltip />
      <el-table-column prop="onhandQty" label="库存数量" width="120" align="right" />
      <el-table-column prop="displayInventory" label="库存盒数" min-width="120" show-overflow-tooltip />
      <el-table-column label="操作" fixed="right" width="178" align="center">
        <template #default="{ row }">
          <div class="row-actions">
            <el-button type="primary" link :icon="Edit" :disabled="!row.inventoryNo" @click="openEdit(row)">
              编辑
            </el-button>
            <el-button type="primary" link :icon="View" :disabled="!row.inventoryNo" @click="openInventoryLog(row)">
              查看日志
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

  <el-dialog v-model="editDialog.visible" title="编辑库存" width="720px">
    <el-form class="dialog-form" :model="editDialog.form" label-position="top">
      <el-form-item label="库存编号" required>
        <el-input v-model="editDialog.form.inventoryNo" disabled />
      </el-form-item>
      <el-form-item label="当前库存">
        <el-input v-model="editDialog.currentDisplay" disabled />
      </el-form-item>
      <el-form-item label="唯一编码">
        <el-input v-model="editDialog.currentSkuCode" disabled />
      </el-form-item>
      <el-form-item label="仓库 / 货架">
        <el-input v-model="editDialog.currentLocation" disabled />
      </el-form-item>
      <el-form-item label="操作类型" required>
        <el-select v-model="editDialog.form.changeType" filterable placeholder="请选择操作类型">
          <el-option
            v-for="item in changeTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          >
            <span>{{ item.label }}</span>
            <span class="option-assist">{{ item.direction > 0 ? '入库' : '出库' }}</span>
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="库存变化" required>
        <el-input-number
          v-model="editDialog.form.changeQty"
          :min="1"
          :precision="0"
          controls-position="right"
        />
      </el-form-item>
      <el-form-item class="full-line" label="备注">
        <el-input
          v-model.trim="editDialog.form.remark"
          type="textarea"
          :rows="3"
          placeholder="请输入备注"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="editDialog.visible = false">取消</el-button>
      <el-button type="primary" :loading="editDialog.saving" @click="submitEdit">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { Download, Edit, Refresh, Search, Upload, View } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { inventoryApi } from '../api/wms'

const emit = defineEmits(['open-inventory-log'])

const loading = ref(false)
const templateLoading = ref(false)
const importLoading = ref(false)
const importInputRef = ref()
const rows = ref([])
const total = ref(0)

const changeTypeOptions = [
  { label: '成品入库', value: 'FINISHED_INBOUND', direction: 1 },
  { label: '退货入库', value: 'RETURN_INBOUND', direction: 1 },
  { label: '调拨入库', value: 'TRANSFER_INBOUND', direction: 1 },
  { label: '手动调整入库', value: 'ADJUST_OUTBOUND', direction: 1 },
  { label: '调拨出库', value: 'TRANSFER_OUTBOUND', direction: -1 },
  { label: '订单出库', value: 'ORDER_OUTBOUND', direction: -1 },
  { label: '报废出库', value: 'SCRAP_OUTBOUND', direction: -1 },
  { label: '其他出库', value: 'OTHER_OUTBOUND', direction: -1 },
  { label: '手动调整出库', value: 'HAND_ADJUST_OUTBOUND', direction: -1 }
]

const filters = reactive({
  warehouseCode: '',
  shelfCode: '',
  skuCode: '',
  shortName: '',
  spuName: ''
})

const page = reactive({
  pageNum: 1,
  pageSize: 20
})

const editDialog = reactive({
  visible: false,
  saving: false,
  currentDisplay: '',
  currentSkuCode: '',
  currentLocation: '',
  form: createEditForm()
})

onMounted(() => {
  fetchList()
})

async function fetchList() {
  loading.value = true
  try {
    const data = await inventoryApi.page({
      pageNum: page.pageNum,
      pageSize: page.pageSize,
      ...filters
    })
    rows.value = normalizeRows(data?.list)
    total.value = Number(data?.total || 0)
  } catch (error) {
    rows.value = []
    total.value = 0
    ElMessage.error(error.message || '库存列表加载失败')
  } finally {
    loading.value = false
  }
}

function normalizeRows(list = []) {
  return (Array.isArray(list) ? list : []).map((row, index) => ({
    ...row,
    __rowKey: [
      row.inventoryNo,
      row.warehouseCode,
      row.shelfCode,
      row.skuCode,
      index
    ].filter(Boolean).join('-') || index
  }))
}

function handleSearch() {
  page.pageNum = 1
  fetchList()
}

function handleReset() {
  filters.warehouseCode = ''
  filters.shelfCode = ''
  filters.skuCode = ''
  filters.shortName = ''
  filters.spuName = ''
  page.pageNum = 1
  fetchList()
}

function openInventoryLog(row) {
  if (!row.inventoryNo) {
    ElMessage.warning('当前库存缺少库存编号，无法查看日志')
    return
  }
  emit('open-inventory-log', row.inventoryNo)
}

function createEditForm() {
  return {
    inventoryNo: '',
    changeType: '',
    changeQty: 1,
    remark: ''
  }
}

function openEdit(row) {
  if (!row.inventoryNo) {
    ElMessage.warning('当前库存缺少库存编号，无法编辑')
    return
  }

  editDialog.form = {
    ...createEditForm(),
    inventoryNo: row.inventoryNo
  }
  editDialog.currentDisplay = row.displayInventory || `${row.onhandQty || 0}个`
  editDialog.currentSkuCode = row.skuCode || ''
  editDialog.currentLocation = `${row.warehouseName || row.warehouseCode || '-'} / ${row.shelfName || row.shelfCode || '-'}`
  editDialog.visible = true
}

async function submitEdit() {
  if (!editDialog.form.inventoryNo) {
    ElMessage.warning('缺少库存编号')
    return
  }
  if (!editDialog.form.changeType) {
    ElMessage.warning('请选择操作类型')
    return
  }
  if (!Number(editDialog.form.changeQty)) {
    ElMessage.warning('请填写库存变化数量')
    return
  }

  editDialog.saving = true
  try {
    await inventoryApi.edit({
      inventoryNo: editDialog.form.inventoryNo,
      changeType: editDialog.form.changeType,
      changeQty: editDialog.form.changeQty,
      remark: editDialog.form.remark
    })
    ElMessage.success('保存成功')
    editDialog.visible = false
    fetchList()
  } catch (error) {
    ElMessage.error(error.message || '库存编辑失败')
  } finally {
    editDialog.saving = false
  }
}

async function downloadTemplate() {
  templateLoading.value = true
  try {
    const file = await inventoryApi.downloadImportTemplate()
    saveBlobFile(file, '库存导入模板.xlsx')
  } catch (error) {
    ElMessage.error(error.message || '模板下载失败')
  } finally {
    templateLoading.value = false
  }
}

function triggerImport() {
  importInputRef.value?.click()
}

async function handleImportChange(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) {
    return
  }

  importLoading.value = true
  try {
    const resultFile = await inventoryApi.importExcel(file)
    saveBlobFile(resultFile, '库存导入结果.xlsx')
    ElMessage.success('导入完成，结果文件已生成')
    fetchList()
  } catch (error) {
    ElMessage.error(error.message || '库存导入失败')
  } finally {
    importLoading.value = false
  }
}

function saveBlobFile(file, fallbackName) {
  const url = URL.createObjectURL(file.blob)
  const link = document.createElement('a')
  link.href = url
  link.download = file.fileName || fallbackName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
</script>
