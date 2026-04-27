<template>
  <section class="toolbar">
    <div class="toolbar-title-row">
      <h2>资料列表</h2>
      <el-button type="primary" :icon="Plus" @click="openCreate">新增资料</el-button>
    </div>
    <el-form :model="filters" class="filter-form compact-filter-form" label-position="top" @submit.prevent>
      <el-form-item label="资料名称">
        <el-input
          v-model.trim="filters.objectNameKeyword"
          clearable
          placeholder="输入资料名称"
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
      empty-text="暂无资料数据"
    >
      <el-table-column prop="objectNo" label="对象编号" min-width="140" show-overflow-tooltip />
      <el-table-column prop="objectName" label="资料名称" min-width="180" show-overflow-tooltip />
      <el-table-column prop="objectDesc" label="资料描述" min-width="180" show-overflow-tooltip />
      <el-table-column label="资源图片" min-width="200">
        <template #default="{ row }">
          <div class="image-list">
            <el-image
              v-for="(item, index) in getImageUrls(row.resources)"
              :key="index"
              :src="item"
              :preview-src-list="getImageUrls(row.resources)"
              fit="cover"
              class="table-image"
            />
          </div>
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

  <el-dialog v-model="editDialog.visible" :title="editDialog.isEdit ? '编辑资料' : '新增资料'" width="720px">
    <el-form class="dialog-form material-dialog-form" :model="editDialog.form" label-position="top">
      <el-form-item label="对象编号" v-if="editDialog.isEdit">
        <el-input v-model.trim="editDialog.form.objectNo" disabled />
      </el-form-item>
      <el-form-item label="资料名称" required>
        <el-input v-model.trim="editDialog.form.objectName" placeholder="请输入资料名称" />
      </el-form-item>
      <el-form-item label="资料描述">
        <el-input v-model.trim="editDialog.form.objectDesc" placeholder="请输入资料描述" />
      </el-form-item>
      <el-form-item label="状态" required>
        <el-select v-model="editDialog.form.status" placeholder="请选择状态">
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item class="full-line" label="资源图片">
        <div class="upload-section">
          <el-upload
            class="upload-area"
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            :show-file-list="false"
            :multiple="true"
            accept="image/*"
          >
            <el-button type="primary" :icon="Upload" :loading="uploading">选择图片上传</el-button>
          </el-upload>
          <div class="upload-hint">支持选择多个图片文件上传</div>
          <div v-if="editDialog.form.resources.length > 0" class="uploaded-images">
            <div v-for="(item, index) in editDialog.form.resources" :key="index" class="image-item">
              <el-image :src="item.fileUrl" fit="cover" class="uploaded-image" />
              <div class="image-actions">
                <el-button type="danger" size="small" circle :icon="Delete" @click="removeImage(index)" />
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
import { Delete, Edit, Plus, Refresh, Search, Upload } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { materialApi } from '../api/wms'
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
    const data = await materialApi.page({
      pageNum: page.pageNum,
      pageSize: page.pageSize,
      ...filters
    })
    rows.value = Array.isArray(data?.list) ? data.list : []
    total.value = Number(data?.total || 0)
  } catch (error) {
    rows.value = []
    total.value = 0
    ElMessage.error(error.message || '资料加载失败')
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

function getImageUrls(resources) {
  if (!resources || !Array.isArray(resources)) return []
  return resources.filter(item => item.fileType === 1).map(item => item.fileUrl)
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
    const detail = await materialApi.detail(row.id)
    editDialog.form = {
      id: detail?.id,
      objectName: detail?.objectName || '',
      objectNo: detail?.objectNo || '',
      objectDesc: detail?.objectDesc || '',
      status: Number(detail?.status ?? 1),
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
      resources: row.resources || [],
      ext: row.ext || ''
    }
  }
  editDialog.visible = true
}

async function handleFileChange(file) {
  if (!file || !file.raw) return

  uploading.value = true
  try {
    const result = await materialApi.upload(file.raw)
    if (result && (result.url || result.fileUrl)) {
      editDialog.form.resources.push({
        fileType: 1,
        fileUrl: result.url || result.fileUrl,
        refSubType: 0,
        sort: editDialog.form.resources.length
      })
      ElMessage.success('图片上传成功')
    } else {
      ElMessage.error('上传失败')
    }
  } catch (error) {
    ElMessage.error(error.message || '上传失败')
  } finally {
    uploading.value = false
  }
}

function removeImage(index) {
  editDialog.form.resources.splice(index, 1)
}

async function submitForm() {
  if (!editDialog.form.objectName) {
    ElMessage.warning('请填写资料名称')
    return
  }

  editDialog.saving = true
  try {
    await materialApi.save(editDialog.form)
    ElMessage.success('保存成功')
    editDialog.visible = false
    fetchList()
  } catch (error) {
    ElMessage.error(error.message || '保存失败')
  } finally {
    editDialog.saving = false
  }
}
</script>

<style scoped>
.image-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.table-image {
  width: 60px;
  height: 60px;
  border-radius: 4px;
  border: 1px solid #dce2ea;
  cursor: pointer;
}

.material-dialog-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 18px;
}

.material-dialog-form .full-line {
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

.uploaded-images {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  padding: 12px;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e8ecf1;
}

.image-item {
  position: relative;
  width: 100px;
  height: 100px;
}

.uploaded-image {
  width: 100%;
  height: 100%;
  border-radius: 4px;
  border: 1px solid #dce2ea;
}

.image-actions {
  position: absolute;
  top: -8px;
  right: -8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.image-item:hover .image-actions {
  opacity: 1;
}
</style>
