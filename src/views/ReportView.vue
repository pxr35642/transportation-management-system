<template>
  <div>

    <!-- 篩選列 -->
    <el-card class="search-card" shadow="never">
      <el-row :gutter="16" align="middle">
        <el-col :span="6">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="開始日期"
            end-placeholder="結束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width:100%"
          />
        </el-col>
        <el-col :span="4">
          <el-select v-model="groupBy" style="width:100%">
            <el-option label="依日統計" value="day"   />
            <el-option label="依週統計" value="week"  />
            <el-option label="依月統計" value="month" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-button type="primary" @click="loadCharts">
            <el-icon><Search /></el-icon> 查詢
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 統計卡片 -->
    <el-row :gutter="16" class="stat-row">
      <el-col :span="6" v-for="card in summaryCards" :key="card.label">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div>
              <div class="stat-number">{{ card.value }}</div>
              <div class="stat-label">{{ card.label }}</div>
            </div>
            <el-icon class="stat-icon" :style="{ color: card.color }">
              <component :is="card.icon" />
            </el-icon>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 圖表區 -->
    <el-row :gutter="16" class="chart-row">
      <!-- 訂單趨勢折線圖 -->
      <el-col :span="16">
        <el-card shadow="never">
          <template #header><span class="card-title">訂單趨勢</span></template>
          <div ref="lineChartRef" class="chart"></div>
        </el-card>
      </el-col>

      <!-- 訂單狀態圓餅圖 -->
      <el-col :span="8">
        <el-card shadow="never">
          <template #header><span class="card-title">訂單狀態分佈</span></template>
          <div ref="pieChartRef" class="chart"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="chart-row">
      <!-- 司機績效橫條圖 -->
      <el-col :span="12">
        <el-card shadow="never">
          <template #header><span class="card-title">司機完成趟次排行</span></template>
          <div ref="barChartRef" class="chart"></div>
        </el-card>
      </el-col>

      <!-- 車輛使用率 -->
      <el-col :span="12">
        <el-card shadow="never">
          <template #header><span class="card-title">車輛使用率</span></template>
          <div ref="gaugeChartRef" class="chart"></div>
        </el-card>
      </el-col>
    </el-row>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'

const dateRange     = ref([])
const groupBy       = ref('day')

// 圖表 DOM ref
const lineChartRef  = ref(null)
const pieChartRef   = ref(null)
const barChartRef   = ref(null)
const gaugeChartRef = ref(null)

// 儲存 ECharts 實例，方便後續 resize 和 dispose
let lineChart  = null
let pieChart   = null
let barChart   = null
let gaugeChart = null

// ─── 統計卡片 ────────────────────────────────────────────────
const summaryCards = ref([
  { label: '本月訂單',   value: '248',    icon: 'Document',    color: '#409eff' },
  { label: '本月完成',   value: '201',    icon: 'CircleCheck', color: '#67c23a' },
  { label: '完成率',     value: '81.0%',  icon: 'TrendCharts', color: '#e6a23c' },
  { label: '本月里程',   value: '18,432', icon: 'Odometer',    color: '#9c59d1' },
])

// ─── 初始化折線圖（訂單趨勢）────────────────────────────────
const initLineChart = () => {
  lineChart = echarts.init(lineChartRef.value)
  lineChart.setOption({
    tooltip:  { trigger: 'axis' },
    legend:   { data: ['訂單數', '完成數'] },
    grid:     { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: ['03/01','03/02','03/03','03/04','03/05','03/06','03/07',
             '03/08','03/09','03/10','03/11','03/12','03/13','03/14'],
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '訂單數',
        type: 'line',
        smooth: true,
        // areaStyle 填充折線下方區域
        areaStyle: { opacity: 0.15 },
        itemStyle: { color: '#409eff' },
        data: [42, 38, 55, 47, 63, 28, 19, 51, 44, 67, 39, 58, 71, 48],
      },
      {
        name: '完成數',
        type: 'line',
        smooth: true,
        areaStyle: { opacity: 0.15 },
        itemStyle: { color: '#67c23a' },
        data: [38, 35, 50, 41, 58, 25, 17, 46, 40, 61, 36, 52, 65, 43],
      },
    ],
  })
}

// ─── 初始化圓餅圖（訂單狀態）────────────────────────────────
const initPieChart = () => {
  pieChart = echarts.init(pieChartRef.value)
  pieChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend:  { bottom: '5%', orient: 'horizontal' },
    series: [{
      type:   'pie',
      radius: ['40%', '70%'],  // 環形圖
      center: ['50%', '45%'],
      data: [
        { value: 201, name: '已完成', itemStyle: { color: '#67c23a' } },
        { value: 28,  name: '運送中', itemStyle: { color: '#e6a23c' } },
        { value: 12,  name: '待派車', itemStyle: { color: '#909399' } },
        { value: 7,   name: '已取消', itemStyle: { color: '#f56c6c' } },
      ],
      label: { formatter: '{b}\n{d}%' },
    }],
  })
}

// ─── 初始化橫條圖（司機績效）────────────────────────────────
const initBarChart = () => {
  barChart = echarts.init(barChartRef.value)
  barChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid:    { left: '3%', right: '8%', bottom: '3%', containLabel: true },
    xAxis:   { type: 'value' },
    yAxis: {
      type: 'category',
      data: ['林建宏', '張阿成', '李小華', '陳志明', '王大明'],
    },
    series: [{
      type: 'bar',
      data: [
        { value: 38,  itemStyle: { color: '#909399' } },
        { value: 52,  itemStyle: { color: '#67c23a' } },
        { value: 61,  itemStyle: { color: '#67c23a' } },
        { value: 74,  itemStyle: { color: '#e6a23c' } },
        { value: 89,  itemStyle: { color: '#409eff' } },
      ],
      label: { show: true, position: 'right' },
      barMaxWidth: 30,
    }],
  })
}

// ─── 初始化儀表圖（車輛使用率）──────────────────────────────
const initGaugeChart = () => {
  gaugeChart = echarts.init(gaugeChartRef.value)
  gaugeChart.setOption({
    series: [{
      type:   'gauge',
      center: ['50%', '55%'],
      radius: '75%',
      startAngle: 200,
      endAngle:   -20,
      min: 0,
      max: 100,
      splitNumber: 10,
      axisLine: {
        lineStyle: {
          width: 20,
          color: [[0.3, '#f56c6c'], [0.7, '#e6a23c'], [1, '#67c23a']],
        }
      },
      pointer: { itemStyle: { color: 'auto' } },
      axisTick:  { distance: -25, splitNumber: 5, lineStyle: { width: 1, color: '#999' } },
      splitLine: { distance: -35, length: 14,     lineStyle: { width: 2, color: '#999' } },
      axisLabel: { distance: -20, color: '#999',  fontSize: 12 },
      anchor:    { show: true, showAbove: true, size: 16, itemStyle: { borderWidth: 2 } },
      title: {
        // 標題往下移，避免與數值重疊
        offsetCenter: [0, '75%'],
        fontSize:     14,
        color:        '#606266',
      },
      detail: {
        valueAnimation: true,
        fontSize:       36,
        fontWeight:     'bold',
        formatter:      '{value}%',
        color:          'inherit',
        // 數值位置往上移
        offsetCenter:   [0, '45%'],
      },
      data: [{ value: 73, name: '車輛使用率' }],
    }],
  })
}

// ─── 視窗縮放時重繪圖表 ──────────────────────────────────────
const handleResize = () => {
  lineChart?.resize()
  pieChart?.resize()
  barChart?.resize()
  gaugeChart?.resize()
}

const loadCharts = () => {
  // 實際串接時在此帶入日期參數呼叫 API，目前重新渲染即可
  lineChart?.resize()
  pieChart?.resize()
}

const handleReset = () => {
  dateRange.value = []
  groupBy.value   = 'day'
}

onMounted(() => {
  initLineChart()
  initPieChart()
  initBarChart()
  initGaugeChart()
  window.addEventListener('resize', handleResize)
})

// ─── 元件卸載時銷毀 ECharts 實例，釋放記憶體 ────────────────
onUnmounted(() => {
  lineChart?.dispose()
  pieChart?.dispose()
  barChart?.dispose()
  gaugeChart?.dispose()
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.search-card { margin-bottom: 16px; }
.stat-row    { margin-bottom: 16px; }
.chart-row   { margin-bottom: 16px; }
.card-title  { font-size: 15px; font-weight: 600; color: #303133; }

.stat-card    { border-radius: 8px; }
.stat-content { display: flex; justify-content: space-between; align-items: center; }
.stat-number  { font-size: 28px; font-weight: 700; color: #303133; }
.stat-label   { font-size: 14px; color: #909399; margin-top: 4px; }
.stat-icon    { font-size: 44px; opacity: 0.8; }

/* 圖表高度統一 */
.chart { height: 300px; }
</style>
