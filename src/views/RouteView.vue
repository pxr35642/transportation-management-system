<template>
  <div>

    <el-row :gutter="16">
      <!-- 左側：路線列表 -->
      <el-col :span="10">
        <el-card shadow="never" class="route-list-card">
          <template #header>
            <div class="card-header-row">
              <span class="card-title">路線列表</span>
              <el-button type="primary" size="small" @click="openCreateDialog">
                <el-icon><Plus /></el-icon> 新增路線
              </el-button>
            </div>
          </template>

          <!-- 搜尋 -->
          <el-input
            v-model="searchKeyword"
            placeholder="搜尋路線名稱"
            clearable
            style="margin-bottom: 12px"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>

          <!-- 路線卡片列表 -->
          <div
            v-for="route in filteredRoutes"
            :key="route.id"
            class="route-item"
            :class="{ active: selectedRoute?.id === route.id }"
            @click="selectRoute(route)"
          >
            <div class="route-item-header">
              <span class="route-name">{{ route.name }}</span>
              <el-tag :type="route.active ? 'success' : 'info'" size="small">
                {{ route.active ? '啟用' : '停用' }}
              </el-tag>
            </div>
            <div class="route-item-body">
              <div class="route-point">
                <el-icon color="#409eff"><Location /></el-icon>
                起：{{ route.origin }}
              </div>
              <div class="route-point">
                <el-icon color="#f56c6c"><Location /></el-icon>
                迄：{{ route.destination }}
              </div>
            </div>
            <div class="route-item-footer">
              <span>距離：{{ route.distance }} km</span>
              <span>預估時間：{{ route.duration }} 分鐘</span>
              <span>停靠點：{{ route.stops.length }} 站</span>
            </div>
            <div class="route-actions">
              <el-button type="primary" link size="small" @click.stop="openEditDialog(route)">編輯</el-button>
              <el-button type="danger"  link size="small" @click.stop="handleDelete(route)">刪除</el-button>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右側：地圖 -->
      <el-col :span="14">
        <el-card shadow="never" class="map-card">
          <template #header>
            <span class="card-title">
              {{ selectedRoute ? `路線預覽：${selectedRoute.name}` : '請選擇路線' }}
            </span>
          </template>

          <!-- Leaflet 地圖容器 -->
          <div id="map" class="map-container"></div>

          <!-- 選中路線的停靠點明細 -->
          <div v-if="selectedRoute" class="stop-list">
            <div class="stop-title">停靠點順序</div>
            <el-steps :active="selectedRoute.stops.length" direction="vertical" size="small">
              <el-step
                v-for="(stop, index) in selectedRoute.stops"
                :key="index"
                :title="stop.name"
                :description="stop.address"
              />
            </el-steps>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 新增/編輯 Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '編輯路線' : '新增路線'"
      width="560px"
      @close="resetForm"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="路線名稱" prop="name">
          <el-input v-model="formData.name" placeholder="例：新竹 → 台北幹線" />
        </el-form-item>
        <el-form-item label="起點" prop="origin">
          <el-input v-model="formData.origin" placeholder="請輸入起點" />
        </el-form-item>
        <el-form-item label="終點" prop="destination">
          <el-input v-model="formData.destination" placeholder="請輸入終點" />
        </el-form-item>
        <el-form-item label="距離(km)" prop="distance">
          <el-input-number v-model="formData.distance" :min="1" :step="1" style="width:100%" />
        </el-form-item>
        <el-form-item label="預估時間" prop="duration">
          <el-input-number v-model="formData.duration" :min="1" :step="10" style="width:100%">
            <template #suffix>分鐘</template>
          </el-input-number>
        </el-form-item>
        <el-form-item label="狀態">
          <el-switch v-model="formData.active" active-text="啟用" inactive-text="停用" />
        </el-form-item>

        <!-- 停靠點動態新增 -->
        <el-form-item label="停靠點">
          <div style="width:100%">
            <div
              v-for="(stop, index) in formData.stops"
              :key="index"
              class="stop-input-row"
            >
              <el-input
                v-model="stop.name"
                :placeholder="`停靠點 ${index + 1} 名稱`"
                style="width: 45%; margin-right: 8px"
              />
              <el-input
                v-model="stop.address"
                placeholder="地址"
                style="width: 45%; margin-right: 8px"
              />
              <el-button type="danger" link @click="removeStop(index)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
            <el-button type="primary" link @click="addStop">
              <el-icon><Plus /></el-icon> 新增停靠點
            </el-button>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
          {{ isEdit ? '儲存' : '新增' }}
        </el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// ─── 修正 Leaflet 預設 icon 路徑問題 ────────────────────────
// Vite 打包後 Leaflet 的 icon 圖片路徑會跑掉，需要手動修正
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const dialogVisible = ref(false)
const submitLoading = ref(false)
const isEdit        = ref(false)
const formRef       = ref(null)
const searchKeyword = ref('')
const selectedRoute = ref(null)

// ─── 地圖實例（不用 ref 包，避免 Vue 代理干擾 Leaflet）─────
let mapInstance = null

const formData = ref({
  name:        '',
  origin:      '',
  destination: '',
  distance:    50,
  duration:    60,
  active:      true,
  stops:       [],
})

const formRules = {
  name:        [{ required: true, message: '請輸入路線名稱', trigger: 'blur' }],
  origin:      [{ required: true, message: '請輸入起點',     trigger: 'blur' }],
  destination: [{ required: true, message: '請輸入終點',     trigger: 'blur' }],
}

// ─── 模擬資料（含台灣城市座標）──────────────────────────────
const routes = ref([
  {
    id: 1, name: '新竹 → 台北幹線', origin: '新竹', destination: '台北',
    distance: 78, duration: 90, active: true,
    // coords 為地圖上的路徑點 [緯度, 經度]
    coords: [[24.8138, 120.9675], [24.9936, 121.3010], [25.0330, 121.5654]],
    stops: [
      { name: '新竹站', address: '新竹市東區中華路二段445號' },
      { name: '桃園站', address: '桃園市桃園區中正路1號' },
      { name: '台北站', address: '台北市中正區北平西路3號' },
    ]
  },
  {
    id: 2, name: '台中 → 高雄幹線', origin: '台中', destination: '高雄',
    distance: 165, duration: 180, active: true,
    coords: [[24.1477, 120.6736], [23.4800, 120.4491], [22.6273, 120.3014]],
    stops: [
      { name: '台中站', address: '台中市西區臺灣大道一段1號' },
      { name: '嘉義站', address: '嘉義市西區中山路528號' },
      { name: '高雄站', address: '高雄市三民區建國二路318號' },
    ]
  },
  {
    id: 3, name: '台北 → 宜蘭支線', origin: '台北', destination: '宜蘭',
    distance: 55, duration: 75, active: false,
    coords: [[25.0330, 121.5654], [24.9021, 121.7739]],
    stops: [
      { name: '台北站', address: '台北市中正區北平西路3號' },
      { name: '宜蘭站', address: '宜蘭縣宜蘭市站前路1號' },
    ]
  },
])

// ─── 搜尋過濾 ────────────────────────────────────────────────
const filteredRoutes = computed(() =>
  routes.value.filter(r =>
    !searchKeyword.value || r.name.includes(searchKeyword.value)
  )
)

// ─── 初始化地圖 ──────────────────────────────────────────────
onMounted(() => {
  // nextTick 確保 DOM 已渲染後再初始化地圖
  nextTick(() => {
    mapInstance = L.map('map').setView([23.9739, 120.9773], 7)

    // 使用 OpenStreetMap 免費圖層
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstance)
  })
})

// ─── 監聽選中路線，更新地圖 ──────────────────────────────────
watch(selectedRoute, (route) => {
  if (!mapInstance || !route) return

  // 清除地圖上現有的圖層
  mapInstance.eachLayer(layer => {
    // 保留底圖 TileLayer，只移除 Marker 和 Polyline
    if (!(layer instanceof L.TileLayer)) {
      mapInstance.removeLayer(layer)
    }
  })

  if (!route.coords || route.coords.length === 0) return

  // 畫路線
  const polyline = L.polyline(route.coords, { color: '#409eff', weight: 4 }).addTo(mapInstance)

  // 加上起點終點 Marker
  route.stops.forEach((stop, index) => {
    const coord = route.coords[index]
    if (!coord) return
    L.marker(coord)
      .addTo(mapInstance)
      .bindPopup(`<b>${stop.name}</b><br>${stop.address}`)
  })

  // 自動縮放到路線範圍
  mapInstance.fitBounds(polyline.getBounds(), { padding: [30, 30] })
})

// ─── 選擇路線 ────────────────────────────────────────────────
const selectRoute = (route) => {
  selectedRoute.value = route
}

// ─── 停靠點操作 ──────────────────────────────────────────────
const addStop = () => {
  formData.value.stops.push({ name: '', address: '' })
}

const removeStop = (index) => {
  formData.value.stops.splice(index, 1)
}

const openCreateDialog = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const openEditDialog = (route) => {
  isEdit.value = true
  formData.value = {
    ...route,
    // 深拷貝 stops 陣列，避免直接修改原資料
    stops: route.stops.map(s => ({ ...s }))
  }
  dialogVisible.value = true
}

const resetForm = () => {
  formData.value = { name: '', origin: '', destination: '', distance: 50, duration: 60, active: true, stops: [] }
  formRef.value?.clearValidate()
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  await new Promise(resolve => setTimeout(resolve, 600))

  if (isEdit.value) {
    const index = routes.value.findIndex(r => r.id === formData.value.id)
    if (index !== -1) routes.value[index] = { ...formData.value, coords: routes.value[index].coords }
    ElMessage.success('路線已更新')
  } else {
    routes.value.unshift({
      ...formData.value,
      id:     routes.value.length + 1,
      coords: [],
    })
    ElMessage.success('路線已新增')
  }

  submitLoading.value = false
  dialogVisible.value = false
}

const handleDelete = (route) => {
  ElMessageBox.confirm(
    `確定要刪除路線「${route.name}」？`,
    '刪除確認',
    { confirmButtonText: '確定刪除', cancelButtonText: '取消', type: 'warning' }
  ).then(() => {
    routes.value = routes.value.filter(r => r.id !== route.id)
    if (selectedRoute.value?.id === route.id) selectedRoute.value = null
    ElMessage.success('路線已刪除')
  }).catch(() => {})
}
</script>

<style scoped>
.card-title      { font-size: 15px; font-weight: 600; color: #303133; }
.card-header-row { display: flex; justify-content: space-between; align-items: center; }

/* 路線卡片 */
.route-list-card { height: calc(100vh - 120px); overflow-y: auto; }

.route-item {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.2s;
}
.route-item:hover  { border-color: #409eff; background: #f0f7ff; }
.route-item.active { border-color: #409eff; background: #ecf5ff; }

.route-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.route-name   { font-weight: 600; font-size: 14px; }
.route-item-body   { display: flex; gap: 16px; margin-bottom: 6px; }
.route-point  { font-size: 13px; color: #606266; display: flex; align-items: center; gap: 4px; }
.route-item-footer { font-size: 12px; color: #909399; display: flex; gap: 16px; margin-bottom: 6px; }
.route-actions { display: flex; gap: 8px; }

/* 地圖 */
.map-card      { height: calc(100vh - 120px); }
.map-container { height: 400px; border-radius: 4px; z-index: 0; }

/* 停靠點明細 */
.stop-list  { margin-top: 16px; padding-top: 16px; border-top: 1px solid #e4e7ed; }
.stop-title { font-size: 14px; font-weight: 600; color: #303133; margin-bottom: 12px; }

/* Dialog 停靠點輸入 */
.stop-input-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}
</style>
