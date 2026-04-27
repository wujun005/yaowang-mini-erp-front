<template>
  <section class="toolbar">
    <el-form :model="filters" class="filter-form compact-filter-form" label-position="top" @submit.prevent>
      <el-form-item label="业务类型">
        <el-input
          v-model.trim="filters.bizType"
          clearable
          placeholder="如 WMS_WAREHOUSE"
          @keyup.enter="handleSearch"
        />
      </el-form-item>
      <el-form-item label="业务主键">
        <el-input
          v-model.trim="filters.bizKey"
          clearable
          placeholder="输入业务主键"
          @keyup.enter="handleSearch"
        />
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
      empty-text="暂无操作记录"
    >
      <el-table-column prop="bizType" label="业务类型" min-width="150" fixed show-overflow-tooltip />
      <el-table-column prop="bizKey" label="业务主键" min-width="120" show-overflow-tooltip />
      <el-table-column prop="opType" label="操作类型" min-width="110" show-overflow-tooltip />
      <el-table-column prop="userName" label="操作人" min-width="120" show-overflow-tooltip />
      <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
      <el-table-column prop="opContent" label="操作内容" min-width="260" show-overflow-tooltip />
      <el-table-column prop="createTime" label="创建时间" min-width="180" show-overflow-tooltip />
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
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { Refresh, Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { operationLogApi } from '../api/wms'

const loading = ref(false)
const rows = ref([])
const total = ref(0)
const filters = reactive({
  bizType: '',
  bizKey: ''
})
const page = reactive({
  pageNum: 1,
  pageSize: 20
})

onMounted(() => {
  fetchList()
})

async function fetchList() {
  loading.value = true
  try {
    const data = await operationLogApi.page({
      pageNum: page.pageNum,
      pageSize: page.pageSize,
      ...filters
    })
    rows.value = Array.isArray(data?.list) ? data.list : []
    total.value = Number(data?.total || 0)
  } catch (error) {
    rows.value = []
    total.value = 0
    ElMessage.error(error.message || '操作记录加载失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  page.pageNum = 1
  fetchList()
}

function handleReset() {
  filters.bizType = ''
  filters.bizKey = ''
  page.pageNum = 1
  fetchList()
}
</script>
