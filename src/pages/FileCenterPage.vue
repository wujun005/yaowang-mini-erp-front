<template>
  <section class="toolbar">
    <div class="toolbar-title-row">
      <h2>文件列表</h2>
      <el-button type="primary" :icon="Plus" @click="openCreate">新增文件</el-button>
    </div>
    <el-form :model="filters" class="filter-form compact-filter-form" label-position="top" @submit.prevent>
      <el-form-item label="文件名称">
        <el-input
          v-model.trim="filters.objectNameKeyword"
          clearable
          placeholder="输入文件名称"
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
      empty-text="暂无文件数据"
    >
      <el-table-column prop="objectNo" label="对象编号" min-width="140" show-overflow-tooltip />
      <el-table-column prop="objectName" label="文件名称" min-width="180" show-overflow-tooltip />
      <el-table-column prop="objectDesc" label="文件描述" min-width="180" show-overflow-tooltip />
      <el-table-column label="文件" min-width="280">
        <template #default="{ row }">
          <div v-if="getFiles(row.resources).length > 0" class="file-list">
            <div v-for="(file, index) in getFiles(row.resources)" :key="index" class="file-item-row">
              <el-icon class="file-icon"><Document /></el-icon>
              <span class="file-name" :title="file.name || file.fileName">{{ file.name || file.fileName || '未命名文件' }}</span>
              <el-button
                type="primary"
                link
                size="small"
                :icon="View"
                @click="previewFile(file)"
              >
                预览
              </el-button>
            </div>
          </div>
          <span v-else class="no-file">-</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="110">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)" effect="light">
            {{ Number(row.status) === 1 ? '启用' : '禁用' }}
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
            禁用
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

  <el-dialog v-model="editDialog.visible" :title="editDialog.isEdit ? '编辑文件' : '新增文件'" width="720px">
    <el-form class="dialog-form file-dialog-form" :model="editDialog.form" label-position="top">
      <el-form-item label="对象编号" v-if="editDialog.isEdit">
        <el-input v-model.trim="editDialog.form.objectNo" disabled />
      </el-form-item>
      <el-form-item label="文件名称" required>
        <el-input v-model.trim="editDialog.form.objectName" placeholder="请输入文件名称" />
      </el-form-item>
      <el-form-item label="文件描述">
        <el-input v-model.trim="editDialog.form.objectDesc" placeholder="请输入文件描述" />
      </el-form-item>
      <el-form-item label="状态" required>
        <el-select v-model="editDialog.form.status" placeholder="请选择状态">
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item class="full-line" label="文件上传">
        <div class="upload-section">
          <el-upload
            class="upload-area"
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            :show-file-list="false"
            :multiple="true"
            accept="*/*"
          >
            <el-button type="primary" :icon="Upload" :loading="uploading">选择文件上传</el-button>
          </el-upload>
          <div class="upload-hint">支持上传多种类型文件（文档、图片、PDF等）</div>
          <div v-if="editDialog.form.resources.length > 0" class="uploaded-files">
            <div v-for="(item, index) in editDialog.form.resources" :key="index" class="file-item">
              <el-icon class="file-icon" :size="24"><Document /></el-icon>
              <div class="file-info">
                <span class="file-name" :title="item.name || item.fileName">{{ item.name || item.fileName || '未命名文件' }}</span>
                <span class="file-type">{{ getFileTypeLabel(item.fileType) }}</span>
              </div>
              <div class="file-actions">
                <el-button type="primary" link size="small" :icon="View" @click="previewFile(item)">预览</el-button>
                <el-button type="danger" size="small" circle :icon="Delete" @click="removeFile(index)" />
              </div>
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
import { fileCenterApi } from '../api/wms'
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
    const data = await fileCenterApi.page({
      pageNum: page.pageNum,
      pageSize: page.pageSize,
      ...filters
    })
    rows.value = Array.isArray(data?.list) ? data.list : []
    total.value = Number(data?.total || 0)
  } catch (error) {
    rows.value = []
    total.value = 0
    ElMessage.error(error.message || '文件数据加载失败')
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

function getFiles(resources) {
  if (!resources || !Array.isArray(resources)) return []
  return resources.map(item => ({
    ...item,
    name: item.name || item.fileName || '未命名文件'
  }))
}

function getFileTypeLabel(fileType) {
  const typeMap = {
    1: '图片',
    2: '视频',
    3: '文档',
    4: '音频'
  }
  return typeMap[fileType] || '文档'
}

function createEmptyForm() {
  return {
    id: undefined,
    objectName: '',
    objectNo: '',
    objectDesc: '',
    status: 1,
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
    const detail = await fileCenterApi.detail(row.id)
    editDialog.form = {
      id: detail?.id,
      objectName: detail?.objectName || '',
      objectNo: detail?.objectNo || '',
      objectDesc: detail?.objectDesc || '',
      status: Number(detail?.status ?? 1),
      resources: detail?.resources?.map(r => ({
        ...r,
        name: r.name || r.fileName || '未命名文件'
      })) || [],
      ext: detail?.ext || ''
    }
  } catch (error) {
    editDialog.form = {
      id: row.id,
      objectName: row.objectName || '',
      objectNo: row.objectNo || '',
      objectDesc: row.objectDesc || '',
      status: Number(row.status ?? 1),
      resources: row.resources?.map(r => ({
        ...r,
        name: r.name || r.fileName || '未命名文件'
      })) || [],
      ext: row.ext || ''
    }
  }
  editDialog.visible = true
}

async function handleFileChange(file) {
  if (!file || !file.raw) return

  uploading.value = true
  try {
    const result = await fileCenterApi.upload(file.raw)
    if (result && (result.url || result.fileUrl)) {
      editDialog.form.resources.push({
        fileType: 3,
        fileUrl: result.url || result.fileUrl,
        name: file.name,
        fileName: file.name,
        refSubType: 0,
        sort: editDialog.form.resources.length
      })
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

function removeFile(index) {
  editDialog.form.resources.splice(index, 1)
}

async function submitForm() {
  if (!editDialog.form.objectName) {
    ElMessage.warning('请填写文件名称')
    return
  }

  editDialog.saving = true
  try {
    await fileCenterApi.save(editDialog.form)
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
    await ElMessageBox.confirm(`确认将「${row.objectName || row.objectNo}」设为禁用吗？`, '禁用确认', {
      type: 'warning',
      confirmButtonText: '确认禁用',
      cancelButtonText: '取消',
      confirmButtonClass: 'el-button--danger'
    })
    await fileCenterApi.invalidate(row.id)
    ElMessage.success('已禁用')
    fetchList()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(error.message || '操作失败')
    }
  }
}

function previewFile(file) {
  if (!file || !file.fileUrl) {
    ElMessage.warning('没有可预览的文件')
    return
  }

  const fileUrl = normalizeFileUrl(file.fileUrl)
  const previewUrl = isHttpUrl(fileUrl)
    ? `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(fileUrl)}`
    : fileUrl
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
</script>

<style scoped>
.file-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-item-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: #f8fafc;
  border-radius: 4px;
  border: 1px solid #e8ecf1;
}

.file-icon {
  font-size: 20px;
  color: #409eff;
  flex-shrink: 0;
}

.file-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  color: #303133;
}

.no-file {
  color: #909399;
}

.file-dialog-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 18px;
}

.file-dialog-form .full-line {
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

.uploaded-files {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e8ecf1;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: #ffffff;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-info .file-name {
  display: block;
  font-size: 14px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-info .file-type {
  display: block;
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.file-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
</style>
