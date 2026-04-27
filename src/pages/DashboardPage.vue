<template>
  <section class="dashboard-grid">
    <div v-for="item in metrics" :key="item.label" class="metric-card">
      <span>{{ item.label }}</span>
      <strong v-loading="loading">{{ item.value }}</strong>
    </div>
  </section>

  <section class="table-section">
    <div class="section-title">
      <h2>最近 SKU</h2>
      <el-button :icon="Refresh" :loading="loading" @click="fetchDashboard">刷新</el-button>
    </div>
    <el-table
      v-loading="loading"
      :data="recentSkus"
      row-key="id"
      border
      stripe
      height="calc(100vh - 320px)"
      empty-text="暂无 SKU 数据"
    >
      <el-table-column prop="skuCode" label="唯一编码" min-width="190" show-overflow-tooltip />
      <el-table-column prop="spuName" label="商品名称" min-width="160" show-overflow-tooltip />
      <el-table-column prop="shortName" label="商品简称" min-width="150" show-overflow-tooltip />
      <el-table-column label="状态" width="110">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)" effect="light">
            {{ productStatusLabel(row) }}
          </el-tag>
        </template>
      </el-table-column>
    </el-table>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { productSkuApi, productSpuApi, unitApi, warehouseApi } from '../api/wms'
import { productStatusLabel, statusTagType } from '../utils/display'

const loading = ref(false)
const recentSkus = ref([])
const metrics = reactive([
  { label: 'SKU 总数', value: '-' },
  { label: 'SPU 总数', value: '-' },
  { label: '仓库数量', value: '-' },
  { label: '计量单位', value: '-' }
])

onMounted(() => {
  fetchDashboard()
})

async function fetchDashboard() {
  loading.value = true
  try {
    const [skuResult, spuResult, warehouseResult, unitResult] = await Promise.allSettled([
      productSkuApi.page({ pageNum: 1, pageSize: 10 }),
      productSpuApi.page({ pageNum: 1, pageSize: 10 }),
      warehouseApi.page({ pageNum: 1, pageSize: 10 }),
      unitApi.page({ pageNum: 1, pageSize: 10 })
    ])

    const skuData = skuResult.status === 'fulfilled' ? skuResult.value : {}
    metrics[0].value = Number(skuData?.total || 0)
    metrics[1].value = Number(spuResult.status === 'fulfilled' ? spuResult.value?.total || 0 : 0)
    metrics[2].value = Number(warehouseResult.status === 'fulfilled' ? warehouseResult.value?.total || 0 : 0)
    metrics[3].value = Number(unitResult.status === 'fulfilled' ? unitResult.value?.total || 0 : 0)
    recentSkus.value = Array.isArray(skuData?.list) ? skuData.list : []
  } catch (error) {
    ElMessage.error(error.message || '工作台数据加载失败')
  } finally {
    loading.value = false
  }
}
</script>
