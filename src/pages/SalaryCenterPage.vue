<template>
  <section class="toolbar">
    <div class="toolbar-title-row">
      <h2>工资中心列表</h2>
      <el-button type="primary" :icon="Plus" @click="openCreate">新增工资</el-button>
    </div>
    <el-form :model="filters" class="filter-form compact-filter-form" label-position="top" @submit.prevent>
      <el-form-item label="对象名称">
        <el-input
          v-model.trim="filters.objectNameKeyword"
          clearable
          placeholder="输入对象名称"
          @keyup.enter="handleSearch"
        />
      </el-form-item>
      <el-form-item label="对象编号">
        <el-input
          v-model.trim="filters.objectNoKeyword"
          clearable
          placeholder="输入对象编号"
          @keyup.enter="handleSearch"
        />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="filters.status" clearable placeholder="全部状态">
          <el-option label="启用" :value="1" />
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
      height="calc(100vh - 292px)"
      empty-text="暂无工资数据"
    >
      <el-table-column prop="objectNo" label="对象编号" min-width="140" show-overflow-tooltip />
      <el-table-column prop="objectName" label="对象名称" min-width="180" show-overflow-tooltip />
      <el-table-column prop="objectDesc" label="对象描述" min-width="180" show-overflow-tooltip />
      <el-table-column label="Excel文件" min-width="200">
        <template #default="{ row }">
          <div v-if="getExcelFile(row.resources)" class="excel-file">
            <el-icon class="excel-icon"><Document /></el-icon>
            <span class="excel-name">{{ getExcelFile(row.resources)?.name || '工资表.xlsx' }}</span>
            <el-button
              type="primary"
              link
              size="small"
              :icon="View"
              @click="previewExcel(row)"
            >
              预览
            </el-button>
          </div>
          <span v-else class="no-file">-</span>
        </template>
      </el-table-column>
      <el-table-column label="有效期" min-width="220">
        <template #default="{ row }">
          <div v-if="row.validStartTime || row.validEndTime">
            {{ formatDate(row.validStartTime) }} ~ {{ formatDate(row.validEndTime) }}
          </div>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="110">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)" effect="light">
            {{ Number(row.status) === 1 ? '启用' : '失效' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" min-width="180" show-overflow-tooltip />
      <el-table-column prop="modifyTime" label="修改时间" min-width="180" show-overflow-tooltip />
      <el-table-column label="操作" fixed="right" width="150" align="center">
        <template #default="{ row }">
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

  <el-dialog v-model="editDialog.visible" :title="editDialog.isEdit ? '编辑工资' : '新增工资'" width="720px">
    <el-form class="dialog-form salary-dialog-form" :model="editDialog.form" label-position="top">
      <el-form-item label="对象编号" v-if="editDialog.isEdit">
        <el-input v-model.trim="editDialog.form.objectNo" disabled />
      </el-form-item>
      <el-form-item label="对象名称" required>
        <el-input v-model.trim="editDialog.form.objectName" placeholder="请输入对象名称" />
      </el-form-item>
      <el-form-item label="对象描述">
        <el-input v-model.trim="editDialog.form.objectDesc" placeholder="请输入对象描述" />
      </el-form-item>
      <el-form-item label="有效期">
        <el-date-picker
          v-model="editDialog.form.validRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="状态" required>
        <el-select v-model="editDialog.form.status" placeholder="请选择状态">
          <el-option label="启用" :value="1" />
          <el-option label="失效" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item class="full-line" label="Excel工资表">
        <div class="upload-section">
          <el-upload
            class="upload-area"
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            :show-file-list="false"
            :multiple="false"
            accept=".xlsx,.xls"
            :disabled="editDialog.form.resources.length > 0"
          >
            <el-button
              type="primary"
              :icon="Upload"
              :loading="uploading"
              :disabled="editDialog.form.resources.length > 0"
            >
              {{ editDialog.form.resources.length > 0 ? '已上传' : '选择Excel上传' }}
            </el-button>
          </el-upload>
          <div class="upload-hint">仅支持上传一个Excel文件(.xlsx, .xls)</div>
          <div v-if="editDialog.form.resources.length > 0" class="uploaded-file">
            <div class="file-item">
              <el-icon class="file-icon"><Document /></el-icon>
              <span class="file-name">{{ editDialog.form.resources[0].name || '工资表.xlsx' }}</span>
              <el-button type="danger" size="small" circle :icon="Delete" @click="removeFile" />
            </div>
          </div>
        </div>
      </el-form-item>
      <el-form-item class="full-line" label="扩展字段">
        <el-input v-model.trim="editDialog.form.ext" type="textarea" :rows="3" placeholder="请输入扩展字段" />
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
import { CircleClose, Delete, Document, Edit, Plus, Refresh, Search, Upload, View } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { salaryCenterApi } from '../api/wms'
import { statusTagType } from '../utils/display'

const loading = ref(false)
const uploading = ref(false)
const rows = ref([])
const total = ref(0)
const filters = reactive({
  objectNameKeyword: '',
  objectNoKeyword: '',
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
    const data = await salaryCenterApi.page({
      pageNum: page.pageNum,
      pageSize: page.pageSize,
      ...filters
    })
    rows.value = Array.isArray(data?.list) ? data.list : []
    total.value = Number(data?.total || 0)
  } catch (error) {
    rows.value = []
    total.value = 0
    ElMessage.error(error.message || '工资数据加载失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  page.pageNum = 1
  fetchList()
}

function handleReset() {
  filters.objectNameKeyword = ''
  filters.objectNoKeyword = ''
  filters.status = undefined
  page.pageNum = 1
  fetchList()
}

function formatDate(date) {
  if (!date) return '-'
  return date.split(' ')[0]
}

function getExcelFile(resources) {
  if (!resources || !Array.isArray(resources) || resources.length === 0) return null
  return resources.find(item => item.fileType === 3) || resources[0]
}

function createEmptyForm() {
  return {
    id: undefined,
    objectName: '',
    objectNo: '',
    objectDesc: '',
    status: 1,
    validRange: [],
    resources: [],
    ext: ''
  }
}

function openCreate() {
  editDialog.isEdit = false
  editDialog.form = createEmptyForm()
  editDialog.visible = true
}

async function openEdit(row) {
  editDialog.isEdit = true
  try {
    const detail = await salaryCenterApi.detail(row.id)
    editDialog.form = {
      id: detail?.id,
      objectName: detail?.objectName || '',
      objectNo: detail?.objectNo || '',
      objectDesc: detail?.objectDesc || '',
      status: Number(detail?.status ?? 1),
      validRange: detail?.validStartTime && detail?.validEndTime
        ? [detail.validStartTime.split(' ')[0], detail.validEndTime.split(' ')[0]]
        : [],
      resources: detail?.resources || [],
      ext: detail?.ext || ''
    }
  } catch (error) {
    editDialog.form = {
      id: row.id,
      objectName: row.objectName || '',
      objectNo: row.objectNo || '',
      objectDesc: row.objectDesc || '',
      status: Number(row.status ?? 1),
      validRange: row.validStartTime && row.validEndTime
        ? [row.validStartTime.split(' ')[0], row.validEndTime.split(' ')[0]]
        : [],
      resources: row.resources || [],
      ext: row.ext || ''
    }
  }
  editDialog.visible = true
}

async function handleFileChange(file) {
  if (!file || !file.raw) return

  const validTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  ]
  if (!validTypes.includes(file.raw.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
    ElMessage.error('请上传Excel文件(.xlsx, .xls)')
    return
  }

  uploading.value = true
  try {
    const result = await salaryCenterApi.upload(file.raw)
    if (result && (result.url || result.fileUrl)) {
      editDialog.form.resources = [{
        fileType: 3,
        fileUrl: result.url || result.fileUrl,
        name: file.name,
        refSubType: 0,
        sort: 0
      }]
      ElMessage.success('文件上传成功')
    } else {
      ElMessage.error('上传失败')
    }
  } catch (error) {
    ElMessage.error(error.message || '上传失败')
  } finally {
    uploading.value = false
  }
}

function removeFile() {
  editDialog.form.resources = []
}

async function submitForm() {
  if (!editDialog.form.objectName) {
    ElMessage.warning('请填写对象名称')
    return
  }

  const payload = {
    ...editDialog.form,
    validStartTime: editDialog.form.validRange?.[0] || undefined,
    validEndTime: editDialog.form.validRange?.[1] || undefined
  }
  delete payload.validRange

  editDialog.saving = true
  try {
    await salaryCenterApi.save(payload)
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
    await ElMessageBox.confirm(`确认将「${row.objectName || row.objectNo}」设为失效吗？`, '失效确认', {
      type: 'warning',
      confirmButtonText: '确认失效',
      cancelButtonText: '取消',
      confirmButtonClass: 'el-button--danger'
    })
    await salaryCenterApi.invalidate(row.id)
    ElMessage.success('已失效')
    fetchList()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(error.message || '操作失败')
    }
  }
}

async function previewExcel(row) {
  const file = getExcelFile(row.resources)
  if (!file || !file.fileUrl) {
    ElMessage.warning('没有可预览的文件')
    return
  }
  window.open(file.fileUrl, '_blank')
}
</script>

<style scoped>
.excel-file {
  display: flex;
  align-items: center;
  gap: 8px;
}

.excel-icon {
  font-size: 20px;
  color: #67c23a;
}

.excel-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 120px;
}

.no-file {
  color: #909399;
}

.salary-dialog-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 18px;
}

.salary-dialog-form .full-line {
  grid-column: 1 / -1;
}

.upload-section {
  width: 100%;
}

.upload-area {
  margin-bottom: 8px;
}

.upload-hint {
  color: #7b8797;
  font-size: 12px;
  margin-bottom: 12px;
}

.uploaded-file {
  padding: 12px;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e8ecf1;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.file-icon {
  font-size: 24px;
  color: #67c23a;
}

.file-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
