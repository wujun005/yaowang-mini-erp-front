<template>
  <section class="toolbar">
    <div class="toolbar-title-row">
      <h2>劳务班次作业流水</h2>
      <el-button type="primary" :icon="Plus" @click="openCreate">新增流水</el-button>
    </div>
    <el-form :model="filters" class="filter-form" label-position="top" @submit.prevent>
      <el-form-item label="工人 ID">
        <el-input v-model.trim="filters.workerId" clearable placeholder="输入工人 ID" @keyup.enter="handleSearch" />
      </el-form-item>
      <el-form-item label="工人名称">
        <el-input
          v-model.trim="filters.workerNameKeyword"
          clearable
          placeholder="输入工人名称"
          @keyup.enter="handleSearch"
        />
      </el-form-item>
      <el-form-item label="班次编码">
        <el-input v-model.trim="filters.shiftCode" clearable placeholder="输入班次编码" @keyup.enter="handleSearch" />
      </el-form-item>
      <el-form-item label="作业日期">
        <el-date-picker
          v-model="filters.workDateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="filters.status" clearable placeholder="全部状态">
          <el-option label="有效" :value="1" />
          <el-option label="失效" :value="0" />
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
      height="calc(100vh - 334px)"
      empty-text="暂无班次作业流水"
    >
      <el-table-column prop="workerId" label="工人 ID" min-width="120" fixed show-overflow-tooltip />
      <el-table-column prop="workerName" label="工人名称" min-width="140" show-overflow-tooltip />
      <el-table-column label="作业日期" min-width="130">
        <template #default="{ row }">{{ formatDate(row.workDate) }}</template>
      </el-table-column>
      <el-table-column prop="shiftCode" label="班次编码" min-width="130" show-overflow-tooltip />
      <el-table-column prop="shiftName" label="班次名称" min-width="140" show-overflow-tooltip />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)" effect="light">{{ statusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
      <el-table-column prop="createTime" label="创建时间" min-width="180" show-overflow-tooltip />
      <el-table-column prop="modifyTime" label="修改时间" min-width="180" show-overflow-tooltip />
      <el-table-column label="操作" fixed="right" width="152" align="center">
        <template #default="{ row }">
          <div class="row-actions">
            <el-button type="primary" link :icon="Edit" @click="openEdit(row)">编辑</el-button>
            <el-button
              v-if="Number(row.status) === 1"
              type="danger"
              link
              :icon="CircleClose"
              @click="invalidate(row)"
            >
              失效
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

  <el-dialog v-model="editDialog.visible" :title="editDialog.isEdit ? '编辑作业流水' : '新增作业流水'" width="1080px">
    <el-form class="dialog-form labor-dialog-form" :model="editDialog.form" label-position="top">
      <el-form-item label="工人 ID" required>
        <el-input v-model.trim="editDialog.form.workerId" placeholder="请输入工人 ID" />
      </el-form-item>
      <el-form-item label="工人名称">
        <el-input v-model.trim="editDialog.form.workerName" placeholder="请输入工人名称" />
      </el-form-item>
      <el-form-item label="作业日期" required>
        <el-date-picker
          v-model="editDialog.form.workDate"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="请选择作业日期"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="班次编码" required>
        <el-input v-model.trim="editDialog.form.shiftCode" placeholder="请输入班次编码" />
      </el-form-item>
      <el-form-item label="班次名称">
        <el-input v-model.trim="editDialog.form.shiftName" placeholder="请输入班次名称" />
      </el-form-item>
      <el-form-item label="状态" required>
        <el-select v-model="editDialog.form.status" placeholder="请选择状态">
          <el-option label="有效" :value="1" />
          <el-option label="失效" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item class="full-line" label="备注">
        <el-input v-model.trim="editDialog.form.remark" type="textarea" :rows="2" placeholder="请输入备注" />
      </el-form-item>
      <el-form-item class="full-line" label="扩展信息">
        <el-input v-model.trim="editDialog.form.extInfo" type="textarea" :rows="2" placeholder="请输入扩展信息 JSON" />
      </el-form-item>
      <el-form-item class="full-line" label="作业明细">
        <div class="labor-lines">
          <div class="line-toolbar">
            <el-button type="primary" :icon="Plus" @click="addItem">新增明细</el-button>
          </div>
          <el-table :data="editDialog.form.items" row-key="__lineKey" border stripe max-height="320" empty-text="暂无明细">
            <el-table-column label="产品编码" min-width="130">
              <template #default="{ row }">
                <el-input v-model.trim="row.productCode" placeholder="产品编码" />
              </template>
            </el-table-column>
            <el-table-column label="产品名称" min-width="150">
              <template #default="{ row }">
                <el-input v-model.trim="row.productName" placeholder="产品名称" />
              </template>
            </el-table-column>
            <el-table-column label="工序编码" min-width="130">
              <template #default="{ row }">
                <el-input v-model.trim="row.processCode" placeholder="工序编码" />
              </template>
            </el-table-column>
            <el-table-column label="工序名称" min-width="150">
              <template #default="{ row }">
                <el-input v-model.trim="row.processName" placeholder="工序名称" />
              </template>
            </el-table-column>
            <el-table-column label="作业数量" min-width="128">
              <template #default="{ row }">
                <el-input-number v-model="row.workQty" :min="0" :precision="2" controls-position="right" />
              </template>
            </el-table-column>
            <el-table-column label="单位" min-width="90">
              <template #default="{ row }">
                <el-input v-model.trim="row.unit" placeholder="件" />
              </template>
            </el-table-column>
            <el-table-column label="合格数量" min-width="128">
              <template #default="{ row }">
                <el-input-number v-model="row.qualifiedQty" :min="0" :precision="2" controls-position="right" />
              </template>
            </el-table-column>
            <el-table-column label="不良数量" min-width="128">
              <template #default="{ row }">
                <el-input-number v-model="row.defectQty" :min="0" :precision="2" controls-position="right" />
              </template>
            </el-table-column>
            <el-table-column label="备注" min-width="150">
              <template #default="{ row }">
                <el-input v-model.trim="row.remark" placeholder="备注" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="78" fixed="right" align="center">
              <template #default="{ $index }">
                <el-button type="danger" link :icon="Delete" @click="removeItem($index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
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
import { CircleClose, Delete, Edit, Plus, Refresh, Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { laborShiftWorkApi } from '../api/wms'
import { statusTagType } from '../utils/display'

const loading = ref(false)
const rows = ref([])
const total = ref(0)
const filters = reactive({
  workerId: '',
  workerNameKeyword: '',
  shiftCode: '',
  workDateRange: [],
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

onMounted(() => {
  fetchList()
})

async function fetchList() {
  loading.value = true
  try {
    const data = await laborShiftWorkApi.page({
      pageNum: page.pageNum,
      pageSize: page.pageSize,
      workerId: filters.workerId,
      workerNameKeyword: filters.workerNameKeyword,
      shiftCode: filters.shiftCode,
      status: filters.status,
      workDateFrom: filters.workDateRange?.[0] || undefined,
      workDateTo: filters.workDateRange?.[1] || undefined
    })
    rows.value = Array.isArray(data?.list) ? data.list : []
    total.value = Number(data?.total || 0)
  } catch (error) {
    rows.value = []
    total.value = 0
    ElMessage.error(error.message || '作业流水加载失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  page.pageNum = 1
  fetchList()
}

function handleReset() {
  filters.workerId = ''
  filters.workerNameKeyword = ''
  filters.shiftCode = ''
  filters.workDateRange = []
  filters.status = undefined
  page.pageNum = 1
  fetchList()
}

function createEmptyForm() {
  return {
    id: undefined,
    workerId: '',
    workerName: '',
    workDate: '',
    shiftCode: '',
    shiftName: '',
    status: 1,
    remark: '',
    extInfo: '',
    items: []
  }
}

function createEmptyItem() {
  return {
    __lineKey: `${Date.now()}-${Math.random()}`,
    productCode: '',
    productName: '',
    processCode: '',
    processName: '',
    workQty: 0,
    unit: '件',
    qualifiedQty: 0,
    defectQty: 0,
    remark: '',
    extInfo: ''
  }
}

function openCreate() {
  editDialog.isEdit = false
  editDialog.form = createEmptyForm()
  editDialog.visible = true
}

async function openEdit(row) {
  editDialog.isEdit = true
  editDialog.form = {
    ...createEmptyForm(),
    ...row,
    workDate: formatDate(row.workDate),
    status: Number(row.status ?? 1),
    items: []
  }
  editDialog.visible = true

  try {
    const detail = await laborShiftWorkApi.detail(row.id)
    editDialog.form = {
      ...createEmptyForm(),
      ...detail,
      workDate: formatDate(detail?.workDate),
      status: Number(detail?.status ?? 1),
      items: normalizeItems(detail?.items)
    }
  } catch (error) {
    ElMessage.warning(error.message || '详情加载失败，已使用列表数据')
  }
}

function normalizeItems(items = []) {
  return (Array.isArray(items) ? items : []).map((item) => ({
    __lineKey: item.id || `${Date.now()}-${Math.random()}`,
    productCode: item.productCode || '',
    productName: item.productName || '',
    processCode: item.processCode || '',
    processName: item.processName || '',
    workQty: Number(item.workQty || 0),
    unit: item.unit || '件',
    qualifiedQty: Number(item.qualifiedQty || 0),
    defectQty: Number(item.defectQty || 0),
    remark: item.remark || '',
    extInfo: item.extInfo || ''
  }))
}

function addItem() {
  editDialog.form.items.push(createEmptyItem())
}

function removeItem(index) {
  editDialog.form.items.splice(index, 1)
}

async function submitForm() {
  const form = editDialog.form
  if (!form.workerId || !form.workDate || !form.shiftCode) {
    ElMessage.warning('请填写工人 ID、作业日期和班次编码')
    return
  }
  if (form.items.some((item) => Number(item.workQty) <= 0)) {
    ElMessage.warning('作业明细的作业数量必须大于 0')
    return
  }

  editDialog.saving = true
  try {
    await laborShiftWorkApi.save({
      id: form.id,
      workerId: form.workerId,
      workerName: form.workerName,
      workDate: form.workDate,
      shiftCode: form.shiftCode,
      shiftName: form.shiftName,
      status: form.status,
      remark: form.remark,
      extInfo: form.extInfo,
      items: form.items.map((item) => ({
        productCode: item.productCode,
        productName: item.productName,
        processCode: item.processCode,
        processName: item.processName,
        workQty: item.workQty,
        unit: item.unit,
        qualifiedQty: item.qualifiedQty,
        defectQty: item.defectQty,
        remark: item.remark,
        extInfo: item.extInfo
      }))
    })
    ElMessage.success('保存成功')
    editDialog.visible = false
    fetchList()
  } catch (error) {
    ElMessage.error(error.message || '保存失败')
  } finally {
    editDialog.saving = false
  }
}

async function invalidate(row) {
  try {
    await ElMessageBox.confirm(`确认将「${row.workerName || row.workerId}」的班次作业流水设为失效吗？`, '失效确认', {
      type: 'warning',
      confirmButtonText: '确认失效',
      cancelButtonText: '取消',
      confirmButtonClass: 'el-button--danger'
    })
    await laborShiftWorkApi.invalidate(row.id)
    ElMessage.success('已失效')
    fetchList()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(error.message || '操作失败')
    }
  }
}

function formatDate(date) {
  if (!date) return ''
  return String(date).split(/[T ]/)[0]
}

function statusText(status) {
  return Number(status) === 1 ? '有效' : '失效'
}
</script>

<style scoped>
.labor-dialog-form {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0 18px;
}

.labor-dialog-form .full-line {
  grid-column: 1 / -1;
}

.labor-lines {
  width: 100%;
}

.line-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
}

.labor-lines :deep(.el-input-number) {
  width: 100%;
}
</style>
