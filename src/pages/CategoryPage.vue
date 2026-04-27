<template>
  <section class="toolbar">
    <div class="toolbar-title-row">
      <h2>分类列表</h2>
      <el-button type="primary" :icon="Plus" @click="openCreate">新增分类</el-button>
    </div>
    <el-form :model="filters" class="filter-form compact-filter-form" label-position="top" @submit.prevent>
      <el-form-item label="分类名称">
        <el-input
          v-model.trim="filters.nameKeyword"
          clearable
          placeholder="输入分类名称"
          @keyup.enter="fetchList"
        />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="filters.status" clearable placeholder="全部状态">
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
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
      empty-text="暂无分类数据"
    >
      <el-table-column prop="categoryId" label="分类编号" min-width="140" fixed show-overflow-tooltip />
      <el-table-column prop="categoryName" label="分类名称" min-width="180" show-overflow-tooltip />
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
  </section>

  <el-dialog v-model="editDialog.visible" :title="editDialog.isEdit ? '编辑分类' : '新增分类'" width="760px">
    <el-form class="dialog-form" :model="editDialog.form" label-position="top">
      <el-form-item label="分类编号">
        <el-input v-model.trim="editDialog.form.categoryId" placeholder="不填由系统自动生成，如 C00001" />
        <div class="field-hint">分类编号非必填，新增时留空由系统自动生成。</div>
      </el-form-item>
      <el-form-item label="分类名称" required>
        <el-input v-model.trim="editDialog.form.categoryName" placeholder="请输入分类名称" />
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
import { categoryApi } from '../api/wms'
import { statusLabel, statusTagType } from '../utils/display'

const loading = ref(false)
const rows = ref([])
const filters = reactive({
  nameKeyword: '',
  status: undefined
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
    const data = await categoryApi.list(filters)
    rows.value = Array.isArray(data) ? data : []
  } catch (error) {
    rows.value = []
    ElMessage.error(error.message || '商品分类加载失败')
  } finally {
    loading.value = false
  }
}

function handleReset() {
  filters.nameKeyword = ''
  filters.status = undefined
  fetchList()
}

function createEmptyForm() {
  return {
    id: undefined,
    categoryId: '',
    categoryName: '',
    status: 1
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
    const detail = await categoryApi.detail(row.id)
    editDialog.form = {
      id: detail?.id,
      categoryId: detail?.categoryId || '',
      categoryName: detail?.categoryName || '',
      status: Number(detail?.status ?? row.status ?? 1)
    }
  } catch (error) {
    editDialog.form = {
      id: row.id,
      categoryId: row.categoryId || '',
      categoryName: row.categoryName || '',
      status: Number(row.status ?? 1)
    }
  }
  editDialog.visible = true
}

async function submitForm() {
  if (!editDialog.form.categoryName) {
    ElMessage.warning('请填写分类名称')
    return
  }

  editDialog.saving = true
  try {
    const payload = {
      id: editDialog.form.id,
      categoryId: editDialog.form.categoryId,
      categoryName: editDialog.form.categoryName,
      status: editDialog.form.status
    }
    if (!payload.categoryId) {
      delete payload.categoryId
    }
    await categoryApi.save(payload)
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
