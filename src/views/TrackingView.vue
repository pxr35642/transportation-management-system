<template>
  <div>
    <el-row :gutter="16">

      <!-- 左側：運送中訂單列表 -->
      <el-col :span="8">
        <el-card shadow="never" class="tracking-list-card">
          <template #header>
            <div class="card-header-row">
              <span class="card-title">運送中訂單</span>
              <el-tag type="warning">{{ activeOrders.length }} 筆</el-tag>
            </div>
          </template>

          <el-input
            v-model="searchKeyword"
            placeholder="搜尋訂單 / 司機 / 車牌"
            clearable
            style="margin-bottom: 12px"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>

          <div
            v-for="order in filteredOrders"
            :key="order.id"
            class="tracking-item"
            :class="{ active: selectedOrder?.id === order.id }"
            @click="selectOrder(order)"
          >
            <div class="tracking-header">
              <span class="order-no">{{ order.orderNo }}</span>
              <!-- 進度百分比 -->
              <span class="progress-text">{{ order.progress }}%</span>
            </div>

            <el-progress
              :percentage="order.progress"
              :stroke-width="6"
              :show-text="false"
              status="striped"
              striped-flow
              :duration="10"
              style="margin: 6px 0"
            />

            <div class="tracking-info">
              <div><el-icon><Van /></el-icon> {{ order.driver }} | {{ order.plateNo }}</div>
              <div><el-icon><Location /></el-icon> {{ order.currentLocation }}</div>
            </div>

            <div class="tracking-route">
              <span class="origin">{{ order.origin }}</span>
              <span class="arrow">→</span>
              <span class="destination">{{ order.destination }}</span>
            </div>

            <!-- 預計到達時間 -->
            <div class="eta">預計到達：{{ order.eta }}</div>
          </div>
        </el-card>
      </el-col>

      <!-- 右側：地圖 + 詳細資訊 -->
      <el-col :span="16">
        <el-card shadow="never" class="map-card">
          <template #header>
            <div class="card-header-row">
              <span class="card-title">
                {{ selectedOrder ? `追蹤：${selectedOrder.orderNo}` : '即時追蹤地圖' }}
              </span>
              <div class="header-actions">
                <!-- 模擬位置更新 -->
                <el-button
                  type="primary"
                  size="small"
                  :loading="isTracking"
                  @click="toggleTracking"
                >
                  {{ isTracking ? '停止追蹤' : '開始追蹤' }}
                </el-button>
              </div>
            </div>
          </template>

          <!-- 地圖 -->
          <div id="trackingMap" class="map-container"></div>

          <!-- 選中訂單的詳細資訊 -->
          <div v-if="selectedOrder" class="order-detail">
            <el-descriptions :column="3" border size="small">
              <el-descriptions-item label="訂單編號">{{ selectedOrder.orderNo }}</el-descriptions-item>
              <el-descriptions-item label="司機">{{ selectedOrder.driver }}</el-descriptions-item>
              <el-descriptions-item label="車牌">{{ selectedOrder.plateNo }}</el-descriptions-item>
              <el-descriptions-item label="起點">{{ selectedOrder.origin }}</el-descriptions-item>
              <el-descriptions-item label="終點">{{ selectedOrder.destination }}</el-descriptions-item>
              <el-descriptions-item label="預計到達">{{ selectedOrder.eta }}</el-descriptions-item>
              <el-descriptions-item label="當前位置" :span="3">{{ selectedOrder.currentLocation }}</el-descriptions-item>
            </el-descriptions>
          </div>
        </el-card>
      </el-col>

    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// ─── 修正 Leaflet icon 路徑 ──────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const searchKeyword = ref('')
const selectedOrder = ref(null)
const isTracking    = ref(false)

// 地圖與 Marker 實例不用 ref，避免 Vue 代理干擾 Leaflet
let mapInstance    = null
let vehicleMarker  = null
let trackingTimer  = null

// ─── 模擬運送中訂單資料 ──────────────────────────────────────
const activeOrders = ref([
  {
    id: 1,
    orderNo:         'ORD-20260304-001',
    driver:          '王大明',
    plateNo:         'ABC-1234',
    origin:          '新竹',
    destination:     '台北',
    currentLocation: '桃園市中壢區',
    progress:        65,
    eta:             '14:30',
    // 模擬車輛目前座標
    coord:           [24.9636, 121.2247],
    // 路線座標（起點 → 終點）
    routeCoords:     [[24.8138, 120.9675], [24.9636, 121.2247], [25.0330, 121.5654]],
  },
  {
    id: 2,
    orderNo:         'ORD-20260304-002',
    driver:          '李小華',
    plateNo:         'XYZ-5678',
    origin:          '台中',
    destination:     '高雄',
    currentLocation: '嘉義市東區',
    progress:        42,
    eta:             '17:00',
    coord:           [23.4800, 120.4491],
    routeCoords:     [[24.1477, 120.6736], [23.4800, 120.4491], [22.6273, 120.3014]],
  },
  {
    id: 3,
    orderNo:         'ORD-20260304-003',
    driver:          '張阿成',
    plateNo:         'DEF-9012',
    origin:          '台北',
    destination:     '宜蘭',
    currentLocation: '新北市瑞芳區',
    progress:        80,
    eta:             '13:15',
    coord:           [25.1076, 121.8022],
    routeCoords:     [[25.0330, 121.5654], [25.1076, 121.8022], [24.9021, 121.7739]],
  },
])

// ─── 搜尋過濾 ────────────────────────────────────────────────
const filteredOrders = computed(() =>
  activeOrders.value.filter(o =>
    !searchKeyword.value ||
    o.orderNo.includes(searchKeyword.value) ||
    o.driver.includes(searchKeyword.value)  ||
    o.plateNo.includes(searchKeyword.value)
  )
)

// ─── 初始化地圖 ──────────────────────────────────────────────
onMounted(() => {
  nextTick(() => {
    mapInstance = L.map('trackingMap').setView([23.9739, 120.9773], 7)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstance)

    // 預設顯示所有車輛位置
    showAllVehicles()
  })
})

// ─── 元件卸載時清除計時器，避免記憶體洩漏 ───────────────────
onUnmounted(() => {
  if (trackingTimer) clearInterval(trackingTimer)
})

// ─── 顯示所有車輛 Marker ─────────────────────────────────────
const showAllVehicles = () => {
  if (!mapInstance) return
  activeOrders.value.forEach(order => {
    L.marker(order.coord)
      .addTo(mapInstance)
      .bindPopup(`<b>${order.orderNo}</b><br>司機：${order.driver}<br>進度：${order.progress}%`)
  })
}

// ─── 選擇訂單，地圖聚焦到該車輛 ─────────────────────────────
const selectOrder = (order) => {
  selectedOrder.value = order

  // 停止前一個追蹤
  if (trackingTimer) {
    clearInterval(trackingTimer)
    isTracking.value = false
  }

  // 清除現有圖層（保留底圖）
  mapInstance.eachLayer(layer => {
    if (!(layer instanceof L.TileLayer)) mapInstance.removeLayer(layer)
  })

  // 畫路線
  L.polyline(order.routeCoords, { color: '#409eff', weight: 4, dashArray: '8,4' })
    .addTo(mapInstance)

  // 起點 Marker（綠色）
  L.marker(order.routeCoords[0])
    .addTo(mapInstance)
    .bindPopup(`起點：${order.origin}`)

  // 終點 Marker（紅色）
  const endCoord = order.routeCoords[order.routeCoords.length - 1]
  L.marker(endCoord)
    .addTo(mapInstance)
    .bindPopup(`終點：${order.destination}`)

  // 車輛目前位置（藍色，可移動）
  vehicleMarker = L.marker(order.coord, {
    // 自訂圖示，用 div 模擬車輛圖示
    icon: L.divIcon({
      html: '<div style="background:#409eff;color:#fff;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3)">🚛</div>',
      iconSize:   [32, 32],
      iconAnchor: [16, 16],
      className:  '',
    })
  }).addTo(mapInstance)
    .bindPopup(`${order.driver}｜${order.plateNo}`)
    .openPopup()

  // 地圖縮放到路線範圍
  mapInstance.fitBounds(L.polyline(order.routeCoords).getBounds(), { padding: [40, 40] })
}

// ─── 開始/停止追蹤（模擬位置每 3 秒更新）───────────────────
const toggleTracking = () => {
  if (!selectedOrder.value) return

  if (isTracking.value) {
    // 停止追蹤
    clearInterval(trackingTimer)
    isTracking.value = false
    return
  }

  isTracking.value = true

  // 每 3 秒模擬車輛位置微幅移動
  trackingTimer = setInterval(() => {
    if (!selectedOrder.value || !vehicleMarker) return

    const order = selectedOrder.value
    // 模擬位置偏移（實際串接時改成呼叫 GPS API 取得座標）
    const newLat = order.coord[0] + (Math.random() - 0.5) * 0.01
    const newLng = order.coord[1] + (Math.random() - 0.5) * 0.01

    // 更新資料
    order.coord = [newLat, newLng]

    // 移動 Marker
    vehicleMarker.setLatLng([newLat, newLng])

    // 進度模擬遞增（不超過 100）
    if (order.progress < 99) order.progress += 1

  }, 3000)
}
</script>

<style scoped>
.card-title      { font-size: 15px; font-weight: 600; color: #303133; }
.card-header-row { display: flex; justify-content: space-between; align-items: center; }
.header-actions  { display: flex; align-items: center; gap: 8px; }

/* 左側列表 */
.tracking-list-card { height: calc(100vh - 120px); overflow-y: auto; }

.tracking-item {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.2s;
}
.tracking-item:hover  { border-color: #409eff; background: #f0f7ff; }
.tracking-item.active { border-color: #409eff; background: #ecf5ff; }

.tracking-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.order-no      { font-weight: 600; font-size: 13px; }
.progress-text { font-size: 13px; color: #409eff; font-weight: 600; }

.tracking-info {
  font-size: 12px;
  color: #606266;
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 6px;
}
.tracking-info .el-icon { vertical-align: middle; margin-right: 4px; }

.tracking-route {
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}
.origin      { color: #409eff; font-weight: 500; }
.destination { color: #f56c6c; font-weight: 500; }
.arrow       { color: #909399; }
.eta         { font-size: 12px; color: #e6a23c; }

/* 右側地圖 */
.map-card      { height: calc(100vh - 120px); }
.map-container { height: 380px; border-radius: 4px; }

/* 訂單詳情 */
.order-detail { margin-top: 16px; }
</style>
