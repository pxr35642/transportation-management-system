<template>
  <div>

    <!-- 搜尋列 -->
    <el-card class="search-card" shadow="never">
      <el-row :gutter="16" align="middle">
        <el-col :span="6">
          <el-input v-model="searchKeyword" placeholder="搜尋車牌號碼 / 車型" clearable @clear="handleSearch"
            @keyup.enter="handleSearch">
            <template #prefix><el-icon>
                <Search />
              </el-icon></template>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-select v-model="searchStatus" placeholder="全部狀態" clearable @change="handleSearch">
            <el-option label="可用" :value="0" />
            <el-option label="運送中" :value="1" />
            <el-option label="維修中" :value="2" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-button type="primary" @click="handleSearch">
            <el-icon>
              <Search />
            </el-icon> 搜尋
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-col>
        <el-col :span="10" style="text-align: right">
          <el-button type="primary" @click="openCreateDialog">
            <el-icon>
              <Plus />
            </el-icon> 新增車輛
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 車輛列表 -->
    <el-card shadow="never">
      <el-table :data="vehicles" stripe v-loading="loading" style="width: 100%" table-layout="auto">
        <el-table-column prop="plateNo" label="車牌號碼" min-width="120" />
        <el-table-column prop="brand" label="廠牌車型" min-width="140" />
        <el-table-column prop="type" label="車輛類型" min-width="120" />
        <el-table-column prop="capacity" label="載重(噸)" min-width="100" />
        <el-table-column prop="mileage" label="里程數(km)" min-width="120" />
        <el-table-column prop="nextMaintain" label="下次保養" min-width="120" :formatter="formatTime" />
        <el-table-column prop="status" label="狀態" min-width="100">
          <template #default="scope">
            <el-tag :type="statusTagType(scope.row.status)">
              {{ formatVehicleStatus(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="200" fixed="right">
          <template #default="scope">
            <div style="display:flex; gap:4px; flex-wrap:nowrap">
              <el-button type="primary" link @click="openEditDialog(scope.row)">編輯</el-button>
              <el-button link :type="scope.row.status === 2 ? 'success' : 'warning'" @click="toggleMaintain(scope.row)">
                {{ scope.row.status === 2 ? '完修' : '送修' }}
              </el-button>
              <el-button type="danger" link @click="handleDelete(scope.row)">刪除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :total="total"
          :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" />
      </div>
    </el-card>

    <!-- 新增/編輯 Dialog -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '編輯車輛' : '新增車輛'" width="500px" @close="resetForm">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="車牌號碼" prop="plateNo">
          <el-input v-model="formData.plateNo" placeholder="例：ABC-1234" />
        </el-form-item>
        <el-form-item label="廠牌車型" prop="brand">
          <el-input v-model="formData.brand" placeholder="例：賓士 Actros" />
        </el-form-item>
        <el-form-item label="車輛類型" prop="type">
          <el-select v-model="formData.type" style="width:100%">
            <el-option label="小貨車" value="小貨車" />
            <el-option label="中型貨車" value="中型貨車" />
            <el-option label="大型貨車" value="大型貨車" />
            <el-option label="聯結車" value="聯結車" />
            <el-option label="冷凍車" value="冷凍車" />
          </el-select>
        </el-form-item>
        <el-form-item label="載重(噸)" prop="capacity">
          <el-input-number v-model="formData.capacity" :min="0.5" :max="50" :step="0.5" style="width:100%" />
        </el-form-item>
        <el-form-item label="里程數(km)" prop="mileage">
          <el-input-number v-model="formData.mileage" :min="0" :step="100" style="width:100%" />
        </el-form-item>
        <el-form-item label="下次保養" prop="nextMaintain">
          <el-date-picker v-model="formData.nextMaintain" type="date" placeholder="選擇日期" format="YYYY-MM-DD"
            value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="狀態" prop="status">
          <el-select v-model="formData.status" style="width:100%">
            <el-option label="可用" :value="0" />
            <el-option label="運送中" :value="1" />
            <el-option label="維修中" :value="2" />
          </el-select>
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
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { vehicleApi } from '@/api/vehicleApi'
import { formatDate, formatVehicleStatus } from '@/utils/format'

// ─── 頁面狀態 ────────────────────────────────────────────────
const loading = ref(false)  // 表格載入中
const submitLoading = ref(false)  // 表單送出中
const dialogVisible = ref(false)  // Dialog 開關
const isEdit = ref(false)  // 編輯 or 新增模式
const formRef = ref(null)   // 表單 ref

// ─── 搜尋條件 ────────────────────────────────────────────────
const searchKeyword = ref('')
const searchStatus = ref(null)

// ─── 分頁（後端分頁，total 由 API 回傳）─────────────────────
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// ─── 車輛列表 ────────────────────────────────────────────────
const vehicles = ref([])

// ─── 表單資料 ────────────────────────────────────────────────
const formData = ref({
  plateNo: '',
  brand: '',
  type: '大型貨車',
  capacity: 5,
  mileage: 0,
  nextMaintain: '',
  status: 0,
})

// ─── 表單驗證規則 ────────────────────────────────────────────
const formRules = {
  plateNo: [{ required: true, message: '請輸入車牌號碼', trigger: 'blur' }],
  brand: [{ required: true, message: '請輸入廠牌車型', trigger: 'blur' }],
  type: [{ required: true, message: '請選擇車輛類型', trigger: 'change' }],
}

// ─── 取得車輛列表（GET /api/vehicles）───────────────────────
const fetchVehicles = async () => {
  loading.value = true
  try {
    const res = await vehicleApi.getList({
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: searchKeyword.value,
      status: searchStatus.value ?? undefined,
    })
    vehicles.value = res.items
    total.value = res.total
  } finally {
    loading.value = false
  }
}

// ─── 狀態 Tag 顏色 ───────────────────────────────────────────
const statusTagType = (status) => {
  const map = { 0: 'success', 1: 'warning', 2: 'danger' }
  return map[status] ?? 'info'
}

// ─── 日期格式化（共用工具）──────────────────────────────────
const formatTime = (row, column, cellValue) => formatDate(cellValue, false)
const formatStatus = (row, column, cellValue) => formatVehicleStatus(cellValue)

// ─── 搜尋 / 重置 ─────────────────────────────────────────────
const handleSearch = () => { currentPage.value = 1; fetchVehicles() }
const handleReset = () => { searchKeyword.value = ''; searchStatus.value = null; currentPage.value = 1; fetchVehicles() }
const handlePageChange = () => fetchVehicles()

// ─── 送修 / 完修 快速切換（PUT /api/vehicles/{id}）──────────
const toggleMaintain = (row) => {
  const action = row.status === 2 ? '完修' : '送修'
  ElMessageBox.confirm(
    `確定將 ${row.plateNo} 標記為「${action}」？`,
    '狀態變更',
    { confirmButtonText: '確定', cancelButtonText: '取消', type: 'warning' }
  ).then(async () => {
    // 送修→狀態改 2，完修→狀態改 0，其餘欄位保持不變
    await vehicleApi.update(row.id, {
      ...row,
      status: row.status === 2 ? 0 : 2,
      updatedAt: undefined, // 不傳 updatedAt，由後端自動設定
    })
    ElMessage.success(`${row.plateNo} 已更新為${action}`)
    fetchVehicles()
  }).catch(() => { })
}

const openCreateDialog = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const openEditDialog = (row) => {
  isEdit.value = true
  // nextMaintain 後端回傳 ISO 格式，el-date-picker 需要 YYYY-MM-DD
  formData.value = {
    ...row,
    nextMaintain: row.nextMaintain ? formatDate(row.nextMaintain, false) : '',
  }
  dialogVisible.value = true
}

const resetForm = () => {
  formData.value = {
    plateNo: '', brand: '', type: '大型貨車',
    capacity: 5, mileage: 0, nextMaintain: '', status: 0
  }
  formRef.value?.clearValidate()
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    if (isEdit.value) {
      await vehicleApi.update(formData.value.id, {
        plateNo: formData.value.plateNo,
        brand: formData.value.brand,
        type: formData.value.type,
        capacity: formData.value.capacity,
        mileage: formData.value.mileage,
        nextMaintain: formData.value.nextMaintain || null,
        status: formData.value.status,
      })
      ElMessage.success('車輛資料已更新')
    } else {
      await vehicleApi.create({
        plateNo: formData.value.plateNo,
        brand: formData.value.brand,
        type: formData.value.type,
        capacity: formData.value.capacity,
        mileage: formData.value.mileage,
        nextMaintain: formData.value.nextMaintain || null,
        status: formData.value.status,
      })
      ElMessage.success('車輛已新增')
    }
    dialogVisible.value = false
    fetchVehicles()
  } finally {
    submitLoading.value = false
  }
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    `確定要刪除車輛 ${row.plateNo}？`,
    '刪除確認',
    { confirmButtonText: '確定刪除', cancelButtonText: '取消', type: 'warning' }
  ).then(async () => {
    await vehicleApi.delete(row.id)
    ElMessage.success('車輛已刪除')
    fetchVehicles()
  }).catch(() => { })
}

onMounted(() => fetchVehicles())
</script>

<style scoped>
.search-card {
  margin-bottom: 16px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
