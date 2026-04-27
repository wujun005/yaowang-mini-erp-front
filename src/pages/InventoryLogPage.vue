<template>
  <section class="toolbar">
    <el-form :model="filters" class="filter-form compact-filter-form" label-position="top" @submit.prevent>
      <el-form-item label="库存编号">
        <el-input
          v-model.trim="filters.inventoryNo"
          clearable
          placeholder="输入库存编号"
          @keyup.enter="fetchList"
        />
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
      empty-text="请输入库存编号查询日志"
    >
      <el-table-column prop="inventoryNo" label="库存编号" min-width="160" fixed show-overflow-tooltip />
      <el-table-column prop="skuCode" label="唯一编码" min-width="190" show-overflow-tooltip />
      <el-table-column prop="shortName" label="商品简称" min-width="150" show-overflow-tooltip />
      <el-table-column prop="warehouseName" label="仓库" min-width="150" show-overflow-tooltip />
      <el-table-column prop="shelfCode" label="货架编号" min-width="120" show-overflow-tooltip />
      <el-table-column prop="beforeOnhandQty" label="变更前" width="100" align="right" />
      <el-table-column prop="qty" label="变化数量" width="110" align="right" />
      <el-table-column prop="changeDisplayQty" label="变化盒数" min-width="120" show-overflow-tooltip />
      <el-table-column prop="afterOnhandQty" label="变更后" width="100" align="right" />
      <el-table-column prop="referenceType" label="业务类型" min-width="150" show-overflow-tooltip />
      <el-table-column prop="referenceNo" label="业务单号" min-width="160" show-overflow-tooltip />
      <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
      <el-table-column prop="operatorName" label="操作人" min-width="120" show-overflow-tooltip />
      <el-table-column prop="createTime" label="创建时间" min-width="180" show-overflow-tooltip />
    </el-table>
  </section>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import { Refresh, Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { inventoryLogApi } from '../api/wms'

const props = defineProps({
  initialInventoryNo: {
    type: String,
    default: ''
  }
})

const loading = ref(false)
const rows = ref([])
const filters = reactive({
  inventoryNo: ''
})

watch(
  () => props.initialInventoryNo,
  (inventoryNo) => {
    filters.inventoryNo = inventoryNo || ''
    if (filters.inventoryNo) {
      fetchList({ showEmptyWarning: false })
    } else {
      rows.value = []
    }
  },
  { immediate: true }
)

async function fetchList(options = {}) {
  const { showEmptyWarning = true } = options
  if (!filters.inventoryNo) {
    rows.value = []
    if (showEmptyWarning) {
      ElMessage.warning('请先输入库存编号')
    }
    return
  }

  loading.value = true
  try {
    const data = await inventoryLogApi.list(filters.inventoryNo)
    rows.value = Array.isArray(data) ? data : []
  } catch (error) {
    rows.value = []
    ElMessage.error(error.message || '库存日志加载失败')
  } finally {
    loading.value = false
  }
}

function handleReset() {
  filters.inventoryNo = ''
  rows.value = []
}
</script>
