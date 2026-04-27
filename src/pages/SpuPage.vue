<template>
  <section class="toolbar">
    <div class="toolbar-title-row">
      <h2>SPU 列表</h2>
      <el-button type="primary" :icon="Plus" @click="openCreate">新增 SPU</el-button>
    </div>
    <el-form :model="filters" class="filter-form" label-position="top" @submit.prevent>
      <el-form-item label="款号">
        <el-input
          v-model.trim="filters.spuCodeKeyword"
          clearable
          placeholder="输入款号"
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
      <el-form-item label="分类编号">
        <el-input
          v-model.trim="filters.categoryId"
          clearable
          placeholder="输入分类编号"
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
      empty-text="暂无 SPU 数据"
    >
      <el-table-column prop="spuCode" label="款号" min-width="160" fixed show-overflow-tooltip />
      <el-table-column prop="spuName" label="商品名称" min-width="180" show-overflow-tooltip />
      <el-table-column prop="shortName" label="商品简称" min-width="160" show-overflow-tooltip />
      <el-table-column prop="categoryId" label="分类编号" min-width="130" show-overflow-tooltip />
      <el-table-column label="状态" width="110">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)" effect="light">
            {{ productStatusLabel(row) }}
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

  <el-dialog v-model="editDialog.visible" :title="editDialog.isEdit ? '编辑 SPU' : '新增 SPU'" width="720px">
    <el-form class="dialog-form" :model="editDialog.form" label-position="top">
      <el-form-item label="款号" required>
        <el-input v-model.trim="editDialog.form.spuCode" placeholder="请输入款号" />
      </el-form-item>
      <el-form-item label="状态" required>
        <el-select v-model="editDialog.form.status" placeholder="请选择状态">
          <el-option label="已上架" :value="1" />
          <el-option label="未上架" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item label="商品名称">
        <el-input v-model.trim="editDialog.form.spuName" placeholder="请输入商品名称" />
      </el-form-item>
      <el-form-item label="商品简称">
        <el-input v-model.trim="editDialog.form.shortName" placeholder="请输入商品简称" />
      </el-form-item>
      <el-form-item label="分类编号">
        <el-input v-model.trim="editDialog.form.categoryId" placeholder="请输入分类编号" />
      </el-form-item>
      <el-form-item class="full-line" label="商品描述">
        <el-input
          v-model.trim="editDialog.form.description"
          type="textarea"
          :rows="3"
          placeholder="请输入商品描述"
        />
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
import { productSpuApi } from '../api/wms'
import { productStatusLabel, statusTagType } from '../utils/display'

const loading = ref(false)
const rows = ref([])
const total = ref(0)
const filters = reactive({
  spuCodeKeyword: '',
  spuNameKeyword: '',
  categoryId: '',
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
    const data = await productSpuApi.page({
      pageNum: page.pageNum,
      pageSize: page.pageSize,
      ...filters
    })
    rows.value = Array.isArray(data?.list) ? data.list : []
    total.value = Number(data?.total || 0)
  } catch (error) {
    rows.value = []
    total.value = 0
    ElMessage.error(error.message || 'SPU 列表加载失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  page.pageNum = 1
  fetchList()
}

function handleReset() {
  filters.spuCodeKeyword = ''
  filters.spuNameKeyword = ''
  filters.categoryId = ''
  filters.status = undefined
  page.pageNum = 1
  fetchList()
}

function createEmptyForm() {
  return {
    id: undefined,
    spuCode: '',
    categoryId: '',
    spuName: '',
    shortName: '',
    description: '',
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
    spuCode: row.spuCode || '',
    categoryId: row.categoryId || '',
    spuName: row.spuName || '',
    shortName: row.shortName || '',
    description: row.description || '',
    status: Number(row.status ?? 1)
  }
  editDialog.visible = true
}

async function submitForm() {
  if (!editDialog.form.spuCode) {
    ElMessage.warning('请填写款号')
    return
  }

  editDialog.saving = true
  try {
    await productSpuApi.save(editDialog.form)
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
