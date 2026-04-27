<template>
  <section class="toolbar">
    <div class="toolbar-title-row">
      <h2>仓库列表</h2>
      <el-button type="primary" :icon="Plus" @click="openCreate">新增仓库</el-button>
    </div>
    <el-form :model="filters" class="filter-form compact-filter-form" label-position="top" @submit.prevent>
      <el-form-item label="仓库名称">
        <el-input
          v-model.trim="filters.nameKeyword"
          clearable
          placeholder="输入仓库名称"
          @keyup.enter="handleSearch"
        />
      </el-form-item>
      <el-form-item label="仓库编码">
        <el-input
          v-model.trim="filters.codeKeyword"
          clearable
          placeholder="输入仓库编码"
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
      empty-text="暂无仓库数据"
    >
      <el-table-column prop="code" label="仓库编码" min-width="140" fixed show-overflow-tooltip />
      <el-table-column prop="name" label="仓库名称" min-width="180" show-overflow-tooltip />
      <el-table-column prop="address" label="地址" min-width="220" show-overflow-tooltip />
      <el-table-column prop="shelfCount" label="货架数" width="100" align="right" />
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

  <el-dialog v-model="editDialog.visible" :title="editDialog.isEdit ? '编辑仓库' : '新增仓库'" width="640px">
    <el-form class="dialog-form" :model="editDialog.form" label-position="top">
      <el-form-item label="仓库编码">
        <el-input v-model.trim="editDialog.form.code" placeholder="不填由系统自动生成，如 W00001" />
        <div class="field-hint">仓库编码非必填，留空时系统会自动生成。</div>
      </el-form-item>
      <el-form-item label="仓库名称" required>
        <el-input v-model.trim="editDialog.form.name" placeholder="请输入仓库名称" />
      </el-form-item>
      <el-form-item label="状态" required>
        <el-select v-model="editDialog.form.status" placeholder="请选择状态">
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item class="full-line" label="地址">
        <el-input v-model.trim="editDialog.form.address" placeholder="请输入地址" />
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
import { warehouseApi } from '../api/wms'
import { statusLabel, statusTagType } from '../utils/display'

const loading = ref(false)
const rows = ref([])
const total = ref(0)
const filters = reactive({
  nameKeyword: '',
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

onMounted(() => {
  fetchList()
})

async function fetchList() {
  loading.value = true
  try {
    const data = await warehouseApi.page({
      pageNum: page.pageNum,
      pageSize: page.pageSize,
      ...filters
    })
    rows.value = Array.isArray(data?.list) ? data.list : []
    total.value = Number(data?.total || 0)
  } catch (error) {
    rows.value = []
    total.value = 0
    ElMessage.error(error.message || '仓库列表加载失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  page.pageNum = 1
  fetchList()
}

function handleReset() {
  filters.nameKeyword = ''
  filters.codeKeyword = ''
  filters.status = undefined
  page.pageNum = 1
  fetchList()
}

function createEmptyForm() {
  return {
    id: undefined,
    code: '',
    name: '',
    address: '',
    status: 1
  }
}

function openCreate() {
  editDialog.isEdit = false
  editDialog.form = createEmptyForm()
  editDialog.visible = true
}

function openEdit(row) {
  editDialog.isEdit = true
  editDialog.form = {
    id: row.id,
    code: row.code || '',
    name: row.name || '',
    address: row.address || '',
    status: Number(row.status ?? 1)
  }
  editDialog.visible = true
}

async function submitForm() {
  if (!editDialog.form.name) {
    ElMessage.warning('请填写仓库名称')
    return
  }

  editDialog.saving = true
  try {
    const payload = { ...editDialog.form }
    if (!payload.code) {
      delete payload.code
    }
    await warehouseApi.save(payload)
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
