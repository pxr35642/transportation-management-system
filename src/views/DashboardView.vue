<template>
  <div class="dashboard">

    <el-row :gutter="20" class="stat-row">
      <el-col :span="6" v-for="card in statCards" :key="card.label">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-number">{{ card.value }}</div>
              <div class="stat-label">{{ card.label }}</div>
            </div>
            <el-icon class="stat-icon" :style="{ color: card.color }">
              <component :is="card.icon" />
            </el-icon>
          </div>
          <div class="stat-footer" :style="{ color: card.trend > 0 ? '#67c23a' : '#f56c6c' }">
            <el-icon>
              <Top v-if="card.trend > 0" />
              <Bottom v-else />
            </el-icon>
            較上月 {{ Math.abs(card.trend) }}%
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :span="16">
        <el-card shadow="hover">
          <template #header>
            <span class="card-title">本週訂單趨勢</span>
          </template>
          <div class="chart-placeholder">
            <div class="bar-chart">
              <div v-for="(item, index) in weeklyData" :key="index" class="bar-group">
                <div class="bar" :style="{ height: (item.count / maxCount * 160) + 'px' }"></div>
                <div class="bar-label">{{ item.day }}</div>
                <div class="bar-value">{{ item.count }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>
            <span class="card-title">車輛狀態</span>
          </template>
          <div v-for="item in vehicleStatus" :key="item.label" class="status-item">
            <div class="status-label">
              <span class="status-dot" :style="{ background: item.color }"></span>
              {{ item.label }}
            </div>
            <el-progress :percentage="item.percentage" :color="item.color" :stroke-width="10" />
            <span class="status-count">{{ item.count }} 輛</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="hover">
      <template #header>
        <div class="card-header-row">
          <span class="card-title">最新訂單</span>
          <router-link to="/orders">
            <el-button type="primary" link>查看全部</el-button>
          </router-link>
        </div>
      </template>
      <el-table :data="recentOrders" stripe style="width: 100%">
        <el-table-column prop="orderNo" label="訂單編號" width="150" />
        <el-table-column prop="customerName" label="客戶" width="120" />
        <el-table-column prop="origin" label="起點" />
        <el-table-column prop="destination" label="終點" />
        <el-table-column prop="driver" label="司機" width="100" />
        <!-- 不用 slot，改用 formatter 直接回傳文字 -->
        <el-table-column prop="status" label="狀態" width="100" :formatter="formatStatus" />
        <el-table-column prop="createdAt" label="建立時間" width="160" />
      </el-table>
    </el-card>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const statCards = ref([
  { label: '今日訂單', value: 0, icon: 'Document', color: '#409eff', trend: 12 },
  { label: '運送中', value: 0, icon: 'Van', color: '#e6a23c', trend: 5 },
  { label: '今日完成', value: 0, icon: 'CircleCheck', color: '#67c23a', trend: 8 },
  { label: '可用車輛', value: 0, icon: 'Odometer', color: '#9c59d1', trend: -3 },
])

const weeklyData = ref([
  { day: '週一', count: 42 },
  { day: '週二', count: 58 },
  { day: '週三', count: 35 },
  { day: '週四', count: 71 },
  { day: '週五', count: 63 },
  { day: '週六', count: 28 },
  { day: '週日', count: 19 },
])

// 從 weeklyData 自動計算最大值，長條圖比例用
const maxCount = computed(() => Math.max(...weeklyData.value.map(d => d.count)))

const vehicleStatus = ref([
  { label: '可用', count: 18, percentage: 60, color: '#67c23a' },
  { label: '運送中', count: 8, percentage: 27, color: '#e6a23c' },
  { label: '維修中', count: 4, percentage: 13, color: '#f56c6c' },
])

const recentOrders = ref([
  { orderNo: 'ORD-20240301', customerName: '台積電', origin: '新竹', destination: '台北', driver: '王大明', status: 1, createdAt: '2024-03-01 09:00' },
  { orderNo: 'ORD-20240302', customerName: '聯發科', origin: '台中', destination: '高雄', driver: '李小華', status: 2, createdAt: '2024-03-01 10:30' },
  { orderNo: 'ORD-20240303', customerName: '鴻海精密', origin: '台南', destination: '桃園', driver: '張阿成', status: 0, createdAt: '2024-03-01 11:00' },
  { orderNo: 'ORD-20240304', customerName: '日月光', origin: '高雄', destination: '台中', driver: '陳志明', status: 1, createdAt: '2024-03-01 13:15' },
  { orderNo: 'ORD-20240305', customerName: '友達光電', origin: '龍潭', destination: '新竹', driver: '林建宏', status: 3, createdAt: '2024-03-01 14:00' },
])

// formatter 接收 (row, column, cellValue)，直接回傳要顯示的文字
const formatStatus = (row, column, cellValue) => {
  const map = { 0: '待派車', 1: '運送中', 2: '已完成', 3: '已取消' }
  return map[cellValue] ?? '未知'
}

// 元件掛載後模擬 API 取得數字，實際串接時改成 await api 呼叫
onMounted(() => {
  setTimeout(() => {
    statCards.value[0].value = 47
    statCards.value[1].value = 8
    statCards.value[2].value = 31
    statCards.value[3].value = 18
  }, 500)
})
</script>

<style scoped>
.dashboard {
  padding: 4px;
}

.stat-row {
  margin-bottom: 20px;
}

.chart-row {
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 8px;
}

.stat-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-number {
  font-size: 32px;
  font-weight: 700;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.stat-icon {
  font-size: 48px;
  opacity: 0.8;
}

.stat-footer {
  margin-top: 12px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.bar-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 180px;
  padding-bottom: 30px;
}

.bar-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.bar {
  width: 36px;
  background: linear-gradient(180deg, #409eff, #79bbff);
  border-radius: 4px 4px 0 0;
  transition: height 0.6s ease;
}

.bar-label {
  font-size: 12px;
  color: #909399;
}

.bar-value {
  font-size: 12px;
  color: #606266;
  font-weight: 600;
}

.status-item {
  margin-bottom: 20px;
}

.status-label {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 6px;
}

.status-count {
  font-size: 12px;
  color: #909399;
  float: right;
  margin-top: 4px;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
