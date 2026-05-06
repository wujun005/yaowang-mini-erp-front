<template>
  <section class="toolbar">
    <div class="toolbar-title-row">
      <h2>劳务班次计费结果</h2>
      <div class="toolbar-actions">
        <el-date-picker
          v-model="settleForm.day"
          class="settle-picker"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="结算日期"
        />
        <el-button :icon="Calendar" :loading="settleForm.dayLoading" @click="settleByDay">按日结算</el-button>
        <el-date-picker
          v-model="settleForm.month"
          class="settle-picker"
          type="month"
          value-format="YYYY-MM"
          placeholder="结算月份"
        />
        <el-button :icon="Calendar" :loading="settleForm.monthLoading" @click="settleByMonth">按月结算</el-button>
        <el-button type="primary" :icon="Plus" @click="openCreate">新增结果</el-button>
      </div>
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
      empty-text="暂无班次计费结果"
    >
      <el-table-column prop="shiftWorkLogId" label="流水 ID" min-width="110" fixed show-overflow-tooltip />
      <el-table-column prop="workerId" label="工人 ID" min-width="120" show-overflow-tooltip />
      <el-table-column prop="workerName" label="工人名称" min-width="140" show-overflow-tooltip />
      <el-table-column label="作业日期" min-width="130">
        <template #default="{ row }">{{ formatDate(row.workDate) }}</template>
      </el-table-column>
      <el-table-column prop="shiftCode" label="班次编码" min-width="130" show-overflow-tooltip />
      <el-table-column prop="shiftName" label="班次名称" min-width="140" show-overflow-tooltip />
      <el-table-column prop="totalQty" label="总数量" min-width="120" align="right" />
      <el-table-column prop="totalAmount" label="总金额" min-width="120" align="right" />
      <el-table-column label="价格文件" min-width="120" align="center">
        <template #default="{ row }">
          <el-button
            v-if="row.pricingTemplateUrl"
            type="primary"
            link
            :icon="View"
            @click="openFile(row.pricingTemplateUrl)"
          >
            预览
          </el-button>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)" effect="light">{{ statusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
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

  <el-dialog v-model="editDialog.visible" :title="editDialog.isEdit ? '编辑计费结果' : '新增计费结果'" width="1080px">
    <el-form class="dialog-form labor-dialog-form" :model="editDialog.form" label-position="top">
      <el-form-item label="流水 ID">
        <el-input-number v-model="editDialog.form.shiftWorkLogId" :min="0" :precision="0" controls-position="right" />
      </el-form-item>
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
      <el-form-item label="总数量" required>
        <el-input-number v-model="editDialog.form.totalQty" :min="0" :precision="2" controls-position="right" />
      </el-form-item>
      <el-form-item label="总金额" required>
        <el-input-number v-model="editDialog.form.totalAmount" :min="0" :precision="2" controls-position="right" />
      </el-form-item>
      <el-form-item label="状态" required>
        <el-select v-model="editDialog.form.status" placeholder="请选择状态">
          <el-option label="有效" :value="1" />
          <el-option label="失效" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item class="full-line" label="价格文件 URL">
        <el-input v-model.trim="editDialog.form.pricingTemplateUrl" placeholder="请输入价格文件 URL" />
      </el-form-item>
      <el-form-item class="full-line" label="备注">
        <el-input v-model.trim="editDialog.form.remark" type="textarea" :rows="2" placeholder="请输入备注" />
      </el-form-item>
      <el-form-item class="full-line" label="计费明细">
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
            <el-table-column label="单价" min-width="128">
              <template #default="{ row }">
                <el-input-number v-model="row.unitPrice" :min="0" :precision="2" controls-position="right" />
              </template>
            </el-table-column>
            <el-table-column label="金额" min-width="128">
              <template #default="{ row }">
                <el-input-number v-model="row.amount" :min="0" :precision="2" controls-position="right" />
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
import { Calendar, CircleClose, Delete, Edit, Plus, Refresh, Search, View } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { laborShiftFeeResultApi } from '../api/wms'
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
const settleForm = reactive({
  day: '',
  month: '',
  dayLoading: false,
  monthLoading: false
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
    const data = await laborShiftFeeResultApi.page({
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
    ElMessage.error(error.message || '计费结果加载失败')
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
    shiftWorkLogId: undefined,
    workerId: '',
    workerName: '',
    workDate: '',
    shiftCode: '',
    shiftName: '',
    totalQty: 0,
    totalAmount: 0,
    pricingTemplateUrl: '',
    status: 1,
    remark: '',
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
    unitPrice: 0,
    amount: 0,
    remark: ''
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
    const detail = await laborShiftFeeResultApi.detail(row.id)
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
    unitPrice: Number(item.unitPrice || 0),
    amount: Number(item.amount || 0),
    remark: item.remark || ''
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
  if (Number(form.totalQty) < 0 || Number(form.totalAmount) < 0) {
    ElMessage.warning('总数量和总金额不能小于 0')
    return
  }
  if (form.items.some((item) => Number(item.workQty) <= 0 || Number(item.unitPrice) < 0 || Number(item.amount) < 0)) {
    ElMessage.warning('计费明细的数量必须大于 0，单价和金额不能小于 0')
    return
  }

  editDialog.saving = true
  try {
    await laborShiftFeeResultApi.save({
      id: form.id,
      shiftWorkLogId: form.shiftWorkLogId,
      workerId: form.workerId,
      workerName: form.workerName,
      workDate: form.workDate,
      shiftCode: form.shiftCode,
      shiftName: form.shiftName,
      totalQty: form.totalQty,
      totalAmount: form.totalAmount,
      pricingTemplateUrl: form.pricingTemplateUrl,
      status: form.status,
      remark: form.remark,
      items: form.items.map((item) => ({
        productCode: item.productCode,
        productName: item.productName,
        processCode: item.processCode,
        processName: item.processName,
        workQty: item.workQty,
        unitPrice: item.unitPrice,
        amount: item.amount,
        remark: item.remark
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
    await ElMessageBox.confirm(`确认将「${row.workerName || row.workerId}」的班次计费结果设为失效吗？`, '失效确认', {
      type: 'warning',
      confirmButtonText: '确认失效',
      cancelButtonText: '取消',
      confirmButtonClass: 'el-button--danger'
    })
    await laborShiftFeeResultApi.invalidate(row.id)
    ElMessage.success('已失效')
    fetchList()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(error.message || '操作失败')
    }
  }
}

async function settleByDay() {
  if (!settleForm.day) {
    ElMessage.warning('请选择结算日期')
    return
  }

  settleForm.dayLoading = true
  try {
    const result = await laborShiftFeeResultApi.settleDay(settleForm.day)
    handleSettleResult(result)
    fetchList()
  } catch (error) {
    ElMessage.error(error.message || '按日结算失败')
  } finally {
    settleForm.dayLoading = false
  }
}

async function settleByMonth() {
  if (!settleForm.month) {
    ElMessage.warning('请选择结算月份')
    return
  }

  settleForm.monthLoading = true
  try {
    const result = await laborShiftFeeResultApi.settleMonth(settleForm.month)
    handleSettleResult(result)
    fetchList()
  } catch (error) {
    ElMessage.error(error.message || '按月结算失败')
  } finally {
    settleForm.monthLoading = false
  }
}

function handleSettleResult(result) {
  if (result && isHttpUrl(result)) {
    openFile(result)
    ElMessage.success('结算完成，已打开导出结果')
    return
  }
  ElMessage.success(result || '结算完成')
}

function openFile(fileUrl) {
  const url = normalizeFileUrl(fileUrl)
  const previewUrl = isHttpUrl(url)
    ? `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(url)}`
    : url
  const opened = window.open(previewUrl, '_blank', 'noopener,noreferrer')

  if (!opened) {
    ElMessage.warning('浏览器拦截了新窗口，请允许弹出窗口后重试')
  }
}

function normalizeFileUrl(fileUrl) {
  if (fileUrl.startsWith('//')) {
    return `${window.location.protocol}${fileUrl}`
  }
  return fileUrl
}

function isHttpUrl(fileUrl) {
  return /^https?:\/\//i.test(fileUrl)
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
.settle-picker {
  width: 150px;
}

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
