<template>
  <div>

    <!-- 搜尋列 -->
    <el-card class="search-card" shadow="never">
      <el-row :gutter="16" align="middle">
        <el-col :span="6">
          <el-input
            v-model="searchKeyword"
            placeholder="搜尋車牌號碼 / 車型"
            clearable
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-select v-model="searchStatus" placeholder="全部狀態" clearable @change="handleSearch">
            <el-option label="可用"   :value="0" />
            <el-option label="運送中" :value="1" />
            <el-option label="維修中" :value="2" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon> 搜尋
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-col>
        <el-col :span="10" style="text-align: right">
          <el-button type="primary" @click="openCreateDialog">
            <el-icon><Plus /></el-icon> 新增車輛
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 車輛列表 -->
    <el-card shadow="never">
      <el-table
        :data="pagedVehicles"
        stripe
        v-loading="loading"
        style="width: 100%"
        table-layout="auto"
      >
        <el-table-column prop="plateNo"    label="車牌號碼" min-width="120" />
        <el-table-column prop="brand"      label="廠牌車型" min-width="120" />
        <el-table-column prop="type"       label="車輛類型" min-width="100" />
        <el-table-column prop="capacity"   label="載重(噸)" min-width="100" />
        <el-table-column prop="mileage"    label="里程數(km)" min-width="120" />
        <el-table-column prop="nextMaintain" label="下次保養" min-width="120" />
        <el-table-column prop="status"     label="狀態"     min-width="100">
          <template #default="scope">
            <el-tag :type="statusTagType(scope.row.status)">
              {{ statusLabel(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="160" fixed="right">
          <template #default="scope">
            <el-button type="primary" link @click="openEditDialog(scope.row)">編輯</el-button>
            <el-button
              link
              :type="scope.row.status === 2 ? 'success' : 'warning'"
              @click="toggleMaintain(scope.row)"
            >
              {{ scope.row.status === 2 ? '完修' : '送修' }}
            </el-button>
            <el-button type="danger" link @click="handleDelete(scope.row)">刪除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="filteredVehicles.length"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
        />
      </div>
    </el-card>

    <!-- 新增/編輯 Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '編輯車輛' : '新增車輛'"
      width="500px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
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
          <el-date-picker
            v-model="formData.nextMaintain"
            type="date"
            placeholder="選擇日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width:100%"
          />
        </el-form-item>
        <el-form-item label="狀態" prop="status">
          <el-select v-model="formData.status" style="width:100%">
            <el-option label="可用"   :value="0" />
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
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading       = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const isEdit        = ref(false)
const formRef       = ref(null)

const searchKeyword = ref('')
const searchStatus  = ref(null)
const currentPage   = ref(1)
const pageSize      = ref(10)

const formData = ref({
  plateNo:      '',
  brand:        '',
  type:         '大型貨車',
  capacity:     5,
  mileage:      0,
  nextMaintain: '',
  status:       0,
})

const formRules = {
  plateNo:  [{ required: true, message: '請輸入車牌號碼', trigger: 'blur' }],
  brand:    [{ required: true, message: '請輸入廠牌車型', trigger: 'blur' }],
  type:     [{ required: true, message: '請選擇車輛類型', trigger: 'change' }],
}

// ─── 模擬資料 ────────────────────────────────────────────────
const vehicles = ref([
  { id: 1, plateNo: 'ABC-1234', brand: '賓士 Actros',   type: '大型貨車', capacity: 20, mileage: 85000, nextMaintain: '2024-06-01', status: 0 },
  { id: 2, plateNo: 'XYZ-5678', brand: '富豪 FH16',     type: '聯結車',   capacity: 40, mileage: 120000, nextMaintain: '2024-05-15', status: 1 },
  { id: 3, plateNo: 'DEF-9012', brand: '五十鈴 ELF',    type: '小貨車',   capacity: 2,  mileage: 45000, nextMaintain: '2024-07-20', status: 0 },
  { id: 4, plateNo: 'GHI-3456', brand: '日野 Ranger',   type: '中型貨車', capacity: 8,  mileage: 67000, nextMaintain: '2024-04-30', status: 2 },
  { id: 5, plateNo: 'JKL-7890', brand: '三菱 Canter',   type: '冷凍車',   capacity: 3,  mileage: 32000, nextMaintain: '2024-08-10', status: 0 },
])

// ─── 搜尋過濾 ────────────────────────────────────────────────
const filteredVehicles = computed(() => {
  return vehicles.value.filter(v => {
    const keywordMatch = !searchKeyword.value ||
      v.plateNo.includes(searchKeyword.value) ||
      v.brand.includes(searchKeyword.value)
    const statusMatch = searchStatus.value === null ||
      searchStatus.value === undefined ||
      v.status === searchStatus.value
    return keywordMatch && statusMatch
  })
})

const pagedVehicles = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredVehicles.value.slice(start, start + pageSize.value)
})

// ─── 狀態對應 ────────────────────────────────────────────────
const statusTagType = (status) => {
  const map = { 0: 'success', 1: 'warning', 2: 'danger' }
  return map[status] ?? 'info'
}

const statusLabel = (status) => {
  const map = { 0: '可用', 1: '運送中', 2: '維修中' }
  return map[status] ?? '未知'
}

// ─── 送修 / 完修 快速切換 ────────────────────────────────────
const toggleMaintain = (row) => {
  const action = row.status === 2 ? '完修' : '送修'
  ElMessageBox.confirm(
    `確定將 ${row.plateNo} 標記為「${action}」？`,
    '狀態變更',
    { confirmButtonText: '確定', cancelButtonText: '取消', type: 'warning' }
  ).then(() => {
    const index = vehicles.value.findIndex(v => v.id === row.id)
    // 送修 → 狀態改 2，完修 → 狀態改 0
    vehicles.value[index].status = row.status === 2 ? 0 : 2
    ElMessage.success(`${row.plateNo} 已更新為${action}`)
  }).catch(() => {})
}

const handleSearch = () => { currentPage.value = 1 }
const handleReset  = () => { searchKeyword.value = ''; searchStatus.value = null; currentPage.value = 1 }

const openCreateDialog = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const openEditDialog = (row) => {
  isEdit.value = true
  formData.value = { ...row }
  dialogVisible.value = true
}

const resetForm = () => {
  formData.value = { plateNo: '', brand: '', type: '大型貨車', capacity: 5, mileage: 0, nextMaintain: '', status: 0 }
  formRef.value?.clearValidate()
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  await new Promise(resolve => setTimeout(resolve, 600))

  if (isEdit.value) {
    const index = vehicles.value.findIndex(v => v.id === formData.value.id)
    if (index !== -1) vehicles.value[index] = { ...formData.value }
    ElMessage.success('車輛資料已更新')
  } else {
    vehicles.value.unshift({
      ...formData.value,
      id: vehicles.value.length + 1,
    })
    ElMessage.success('車輛已新增')
  }

  submitLoading.value = false
  dialogVisible.value = false
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    `確定要刪除車輛 ${row.plateNo}？`,
    '刪除確認',
    { confirmButtonText: '確定刪除', cancelButtonText: '取消', type: 'warning' }
  ).then(() => {
    vehicles.value = vehicles.value.filter(v => v.id !== row.id)
    ElMessage.success('車輛已刪除')
  }).catch(() => {})
}
</script>

<style scoped>
.search-card { margin-bottom: 16px; }
.pagination  { display: flex; justify-content: flex-end; margin-top: 16px; }
</style>
