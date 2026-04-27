<template>
  <section class="toolbar">
    <div class="toolbar-title-row">
      <h2>SKU 列表</h2>
      <div class="toolbar-actions">
        <el-button :icon="Download" :loading="templateLoading" @click="downloadTemplate">
          下载模板
        </el-button>
        <el-button type="primary" :icon="Upload" :loading="importLoading" @click="triggerImport">
          导入 Excel
        </el-button>
        <el-button :icon="DocumentChecked" :loading="resultFileLoading" @click="triggerImportResult">
          导入并下载结果
        </el-button>
      </div>
      <input
        ref="importInputRef"
        class="hidden-file-input"
        type="file"
        accept=".xls,.xlsx"
        @change="handleImportChange"
      />
      <input
        ref="resultInputRef"
        class="hidden-file-input"
        type="file"
        accept=".xls,.xlsx"
        @change="handleImportResultChange"
      />
    </div>
    <el-form :model="filters" class="filter-form" label-position="top" @submit.prevent>
      <el-form-item label="唯一编码">
        <el-input
          v-model.trim="filters.skuCodeKeyword"
          clearable
          placeholder="输入唯一编码"
          @keyup.enter="handleSearch"
        />
      </el-form-item>
      <el-form-item label="商品名称">
        <el-input
          v-model.trim="filters.spuNameKeyword"
          clearable
          placeholder="输入商品名称"
          @keyup.enter="handleSearch"
        />
      </el-form-item>
      <el-form-item label="商品简称">
        <el-input
          v-model.trim="filters.shortNameKeyword"
          clearable
          placeholder="输入商品简称"
          @keyup.enter="handleSearch"
        />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="filters.status" clearable placeholder="全部状态">
          <el-option label="已上架" :value="1" />
          <el-option label="未上架" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item class="filter-actions">
        <el-button type="primary" :icon="Search" :loading="loading" @click="handleSearch">
          查询
        </el-button>
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
      height="calc(100vh - 292px)"
      empty-text="暂无 SKU 数据"
    >
      <el-table-column
        v-for="column in displayColumns"
        :key="column.key"
        :prop="column.key"
        :label="column.label"
        :fixed="column.fixed ? 'left' : false"
        :min-width="columnMinWidth(column)"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          <template v-if="column.key === 'status'">
            <el-tag :type="statusTagType(row.status)" effect="light">
              {{ productStatusLabel(row) }}
            </el-tag>
          </template>
          <template v-else>
            {{ formatCell(row[column.key]) }}
          </template>
        </template>
      </el-table-column>

      <el-table-column label="操作" fixed="right" width="188" align="center">
        <template #default="{ row }">
          <div class="row-actions">
            <el-button
              type="primary"
              link
              :icon="View"
              :disabled="!row.skuCode"
              @click="openInventory(row)"
            >
              查看库存
            </el-button>
            <el-button type="danger" link :icon="Delete" @click="deleteSku(row)">
              删除
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
        @size-change="fetchSkuList"
        @current-change="fetchSkuList"
      />
    </div>
  </section>

  <el-dialog
    v-model="inventoryDialog.visible"
    :title="inventoryDialog.title"
    width="920px"
    class="inventory-dialog"
  >
    <el-table
      v-loading="inventoryDialog.loading"
      :data="inventoryDialog.rows"
      row-key="inventoryId"
      border
      stripe
      max-height="430"
      empty-text="暂无库存"
    >
      <el-table-column prop="inventoryNo" label="库存编号" min-width="160" show-overflow-tooltip />
      <el-table-column prop="warehouseName" label="仓库" min-width="150" show-overflow-tooltip />
      <el-table-column prop="warehouseCode" label="仓库编码" min-width="120" show-overflow-tooltip />
      <el-table-column prop="shelfName" label="货架" min-width="120" show-overflow-tooltip />
      <el-table-column prop="shelfCode" label="货架编码" min-width="120" show-overflow-tooltip />
      <el-table-column prop="onhandQty" label="在库数量" width="120" align="right" />
    </el-table>
    <template #footer>
      <div class="dialog-footer">
        <span>合计库存：{{ inventoryTotal }}</span>
        <el-button @click="inventoryDialog.visible = false">关闭</el-button>
      </div>
    </template>
  </el-dialog>

  <el-dialog v-model="importResultDialog.visible" title="导入结果" width="920px">
    <div class="import-result-grid">
      <div v-for="item in importStats" :key="item.label" class="import-result-item">
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
      </div>
    </div>
    <el-tabs>
      <el-tab-pane label="失败明细">
        <el-table
          :data="importResultDialog.result?.failRows || []"
          row-key="rowNumber"
          border
          stripe
          max-height="300"
          empty-text="暂无失败明细"
        >
          <el-table-column prop="rowNumber" label="行号" width="90" />
          <el-table-column prop="reason" label="失败原因" min-width="220" show-overflow-tooltip />
          <el-table-column prop="spuCode" label="SPU 编码" min-width="160" show-overflow-tooltip />
          <el-table-column prop="skuCode" label="唯一编码" min-width="190" show-overflow-tooltip />
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="成功明细">
        <el-table
          :data="importResultDialog.result?.successRowDetails || []"
          row-key="rowNumber"
          border
          stripe
          max-height="300"
          empty-text="暂无成功明细"
        >
          <el-table-column prop="rowNumber" label="行号" width="90" />
          <el-table-column prop="spuCode" label="SPU 编码" min-width="160" show-overflow-tooltip />
          <el-table-column prop="skuCode" label="唯一编码" min-width="190" show-overflow-tooltip />
        </el-table>
      </el-tab-pane>
    </el-tabs>
    <template #footer>
      <el-button @click="importResultDialog.visible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import {
  Delete,
  DocumentChecked,
  Download,
  Refresh,
  Search,
  Upload,
  View
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { productSkuApi } from '../api/wms'
import { formatCell, productStatusLabel, statusTagType } from '../utils/display'

const FIXED_COLUMNS = [
  { key: 'skuCode', label: '唯一编码', fixed: true },
  { key: 'spuName', label: '商品名称', fixed: true },
  { key: 'shortName', label: '商品简称', fixed: true },
  { key: 'status', label: '状态', fixed: true }
]

// 固定列、specType_{specTypeId} 动态列、缺失规格值为空字符串，和后端动态表格结构保持一致。
const fixedColumnKeys = new Set(FIXED_COLUMNS.map((column) => column.key))

const loading = ref(false)
const templateLoading = ref(false)
const importLoading = ref(false)
const resultFileLoading = ref(false)
const importInputRef = ref()
const resultInputRef = ref()
const rows = ref([])
const dynamicColumns = ref([])
const total = ref(0)

const filters = reactive({
  skuCodeKeyword: '',
  spuNameKeyword: '',
  shortNameKeyword: '',
  status: undefined
})

const page = reactive({
  pageNum: 1,
  pageSize: 20
})

const inventoryDialog = reactive({
  visible: false,
  loading: false,
  title: '库存明细',
  rows: []
})

const importResultDialog = reactive({
  visible: false,
  result: null
})

const displayColumns = computed(() => [...FIXED_COLUMNS, ...dynamicColumns.value])

const inventoryTotal = computed(() =>
  inventoryDialog.rows.reduce((sum, item) => sum + Number(item.onhandQty || 0), 0)
)

const importStats = computed(() => {
  const result = importResultDialog.result || {}
  return [
    { label: '总行数', value: result.totalRows || 0 },
    { label: '成功行数', value: result.successRows || 0 },
    { label: '失败行数', value: result.failedRows || 0 },
    { label: '新增 SPU', value: result.createdSpuCount || 0 },
    { label: '新增规格类型', value: result.createdSpecTypeCount || 0 },
    { label: '新增规格值', value: result.createdSpecValueCount || 0 },
    { label: '新增 SKU', value: result.createdSkuCount || 0 },
    { label: '新增规格绑定', value: result.createdSkuSpecBindCount || 0 }
  ]
})

onMounted(() => {
  fetchSkuList()
})

async function fetchSkuList() {
  loading.value = true
  try {
    const data = await productSkuApi.page({
      pageNum: page.pageNum,
      pageSize: page.pageSize,
      ...filters
    })
    const normalized = normalizeSkuTable(data)
    dynamicColumns.value = normalized.dynamicColumns
    rows.value = normalized.rows
    total.value = Number(data?.total || 0)
  } catch (error) {
    rows.value = []
    dynamicColumns.value = []
    total.value = 0
    ElMessage.error(error.message || 'SKU 列表加载失败')
  } finally {
    loading.value = false
  }
}

function normalizeSkuTable(data = {}) {
  const sourceColumns = Array.isArray(data.columns) ? data.columns : []
  const sourceRows = Array.isArray(data.list) ? data.list : []
  const dynamic = sourceColumns
    .filter((column) => column?.key && !fixedColumnKeys.has(column.key))
    .filter((column) => /^specType_\d+$/.test(column.key))
    .map((column) => ({
      key: column.key,
      label: column.label || column.key,
      fixed: false
    }))

  const dynamicKeys = dynamic.map((column) => column.key)
  const normalizedRows = sourceRows.map((row, index) => {
    const normalized = {
      ...row,
      __rowKey: row.id || row.skuId || row.skuCode || index
    }

    FIXED_COLUMNS.forEach((column) => {
      if (normalized[column.key] === null || normalized[column.key] === undefined) {
        normalized[column.key] = ''
      }
    })

    dynamicKeys.forEach((key) => {
      if (normalized[key] === null || normalized[key] === undefined) {
        normalized[key] = ''
      }
    })

    return normalized
  })

  return {
    dynamicColumns: dynamic,
    rows: normalizedRows
  }
}

function handleSearch() {
  page.pageNum = 1
  fetchSkuList()
}

function handleReset() {
  filters.skuCodeKeyword = ''
  filters.spuNameKeyword = ''
  filters.shortNameKeyword = ''
  filters.status = undefined
  page.pageNum = 1
  fetchSkuList()
}

async function downloadTemplate() {
  templateLoading.value = true
  try {
    const file = await productSkuApi.downloadImportTemplate()
    saveBlobFile(file, 'SKU导入模板.xlsx')
  } catch (error) {
    ElMessage.error(error.message || '模板下载失败')
  } finally {
    templateLoading.value = false
  }
}

function triggerImport() {
  importInputRef.value?.click()
}

function triggerImportResult() {
  resultInputRef.value?.click()
}

async function handleImportChange(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) {
    return
  }

  importLoading.value = true
  try {
    const result = await productSkuApi.importExcel(file)
    importResultDialog.result = result || {}
    importResultDialog.visible = true
    ElMessage.success('导入完成')
    fetchSkuList()
  } catch (error) {
    ElMessage.error(error.message || '导入失败')
  } finally {
    importLoading.value = false
  }
}

async function handleImportResultChange(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) {
    return
  }

  resultFileLoading.value = true
  try {
    const resultFile = await productSkuApi.importExcelAndDownloadResult(file)
    saveBlobFile(resultFile, 'SKU导入结果.xlsx')
    ElMessage.success('导入完成，结果文件已生成')
    fetchSkuList()
  } catch (error) {
    ElMessage.error(error.message || '导入结果下载失败')
  } finally {
    resultFileLoading.value = false
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

async function openInventory(row) {
  inventoryDialog.visible = true
  inventoryDialog.loading = true
  inventoryDialog.title = `${row.skuCode} 库存明细`
  inventoryDialog.rows = []
  try {
    const data = await productSkuApi.inventory(row.skuCode)
    inventoryDialog.rows = Array.isArray(data) ? data : []
  } catch (error) {
    ElMessage.error(error.message || '库存明细加载失败')
  } finally {
    inventoryDialog.loading = false
  }
}

async function deleteSku(row) {
  const id = row.id || row.skuId
  if (!id) {
    ElMessage.warning('当前行缺少 SKU 主键，无法删除')
    return
  }

  try {
    await ElMessageBox.confirm(`确认删除 SKU「${row.skuCode || id}」吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      confirmButtonClass: 'el-button--danger'
    })
    await productSkuApi.delete(id)
    ElMessage.success('删除成功')
    if (rows.value.length === 1 && page.pageNum > 1) {
      page.pageNum -= 1
    }
    fetchSkuList()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

function columnMinWidth(column) {
  const widths = {
    skuCode: 180,
    spuName: 180,
    shortName: 150,
    status: 100
  }
  return widths[column.key] || 130
}
</script>
