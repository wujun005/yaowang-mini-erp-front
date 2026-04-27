<template>
  <section class="toolbar">
    <div class="toolbar-title-row">
      <h2>计量单位列表</h2>
      <el-button type="primary" :icon="Plus" @click="openCreate">新增单位</el-button>
    </div>
    <el-form :model="filters" class="filter-form compact-filter-form" label-position="top" @submit.prevent>
      <el-form-item label="单位编码">
        <el-input
          v-model.trim="filters.codeKeyword"
          clearable
          placeholder="输入单位编码"
          @keyup.enter="handleSearch"
        />
      </el-form-item>
      <el-form-item label="单位名称">
        <el-input
          v-model.trim="filters.unitNameKeyword"
          clearable
          placeholder="输入单位名称"
          @keyup.enter="handleSearch"
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
      height="calc(100vh - 292px)"
      empty-text="暂无计量单位数据"
    >
      <el-table-column prop="code" label="单位编码" min-width="140" fixed show-overflow-tooltip />
      <el-table-column prop="unitName" label="单位名称" min-width="160" show-overflow-tooltip />
      <el-table-column prop="unitNameEn" label="英文名称" min-width="160" show-overflow-tooltip />
      <el-table-column label="状态" width="110">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)" effect="light">
            {{ Number(row.status) === 1 ? '有效' : '失效' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" min-width="180" show-overflow-tooltip />
      <el-table-column prop="modifyTime" label="修改时间" min-width="180" show-overflow-tooltip />
      <el-table-column label="操作" fixed="right" width="150" align="center">
        <template #default="{ row }">
          <el-button type="primary" link :icon="Edit" @click="openEdit(row)">编辑</el-button>
          <el-button type="danger" link :icon="Delete" @click="deleteUnit(row)">删除</el-button>
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

  <el-dialog v-model="editDialog.visible" :title="editDialog.isEdit ? '编辑计量单位' : '新增计量单位'" width="680px">
    <el-form class="dialog-form" :model="editDialog.form" label-position="top">
      <el-form-item label="单位编码" required>
        <el-input v-model.trim="editDialog.form.code" placeholder="请输入单位编码" />
      </el-form-item>
      <el-form-item label="单位名称" required>
        <el-input v-model.trim="editDialog.form.unitName" placeholder="请输入单位名称" />
      </el-form-item>
      <el-form-item label="英文名称">
        <el-input v-model.trim="editDialog.form.unitNameEn" placeholder="请输入英文名称" />
      </el-form-item>
      <el-form-item label="状态" required>
        <el-select v-model="editDialog.form.status" placeholder="请选择状态">
          <el-option label="有效" :value="1" />
          <el-option label="失效" :value="0" />
        </el-select>
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
import { Delete, Edit, Plus, Refresh, Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { unitApi } from '../api/wms'
import { statusTagType } from '../utils/display'

const loading = ref(false)
const rows = ref([])
const total = ref(0)
const filters = reactive({
  codeKeyword: '',
  unitNameKeyword: '',
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
    const data = await unitApi.page({
      pageNum: page.pageNum,
      pageSize: page.pageSize,
      ...filters
    })
    rows.value = Array.isArray(data?.list) ? data.list : []
    total.value = Number(data?.total || 0)
  } catch (error) {
    rows.value = []
    total.value = 0
    ElMessage.error(error.message || '计量单位加载失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  page.pageNum = 1
  fetchList()
}

function handleReset() {
  filters.codeKeyword = ''
  filters.unitNameKeyword = ''
  filters.status = undefined
  page.pageNum = 1
  fetchList()
}

function createEmptyForm() {
  return {
    id: undefined,
    code: '',
    unitName: '',
    unitNameEn: '',
    status: 1,
    ext: ''
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
    unitName: row.unitName || '',
    unitNameEn: row.unitNameEn || '',
    status: Number(row.status ?? 1),
    ext: row.ext || ''
  }
  editDialog.visible = true
}

async function submitForm() {
  if (!editDialog.form.code || !editDialog.form.unitName) {
    ElMessage.warning('请填写单位编码和单位名称')
    return
  }

  editDialog.saving = true
  try {
    await unitApi.save(editDialog.form)
    ElMessage.success('保存成功')
    editDialog.visible = false
    fetchList()
  } catch (error) {
    ElMessage.error(error.message || '保存失败')
  } finally {
    editDialog.saving = false
  }
}

async function deleteUnit(row) {
  try {
    await ElMessageBox.confirm(`确认删除计量单位「${row.unitName || row.code}」吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      confirmButtonClass: 'el-button--danger'
    })
    await unitApi.delete(row.id)
    ElMessage.success('删除成功')
    fetchList()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}
</script>
