<template>
  <div>

    <!-- 搜尋列 -->
    <el-card class="search-card" shadow="never">
      <el-row :gutter="16" align="middle">
        <el-col :span="6">
          <el-input v-model="searchKeyword" placeholder="搜尋姓名 / 身分證 / 電話" clearable @clear="handleSearch"
            @keyup.enter="handleSearch">
            <template #prefix><el-icon>
                <Search />
              </el-icon></template>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-select v-model="searchStatus" placeholder="全部狀態" clearable @change="handleSearch">
            <el-option label="在職" :value="0" />
            <el-option label="休假" :value="1" />
            <el-option label="離職" :value="2" />
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
            </el-icon> 新增司機
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 司機列表 -->
    <el-card shadow="never">
      <el-table :data="drivers" stripe v-loading="loading" style="width: 100%" table-layout="auto">
        <el-table-column prop="name" label="姓名" min-width="100" />
        <el-table-column prop="idNo" label="身分證號" min-width="130" />
        <el-table-column prop="phone" label="聯絡電話" min-width="130" />
        <el-table-column prop="licenseType" label="駕照類別" min-width="100" />
        <el-table-column prop="licenseExp" label="駕照到期" min-width="120" :formatter="formatTime" />
        <el-table-column prop="hireDate" label="到職日期" min-width="120" :formatter="formatTime" />
        <el-table-column prop="resignDate" label="離職日期" min-width="120" :formatter="formatTime">
          <template #default="scope">
            <!-- 非離職狀態顯示 - -->
            {{ scope.row.resignDate || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="totalTrips" label="累計趟次" min-width="100" />
        <el-table-column prop="status" label="狀態" min-width="100">
          <template #default="scope">
            <el-tag :type="statusTagType(scope.row.status)">
              {{ formatDriverStatus(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="120" fixed="right">
          <template #default="scope">
            <el-button type="primary" link @click="openEditDialog(scope.row)">編輯</el-button>
            <el-button type="danger" link @click="handleDelete(scope.row)">刪除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :total="total"
          :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" />
      </div>
    </el-card>

    <!-- 新增/編輯 Dialog -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '編輯司機' : '新增司機'" width="520px" @close="resetForm">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="formData.name" placeholder="請輸入姓名" />
        </el-form-item>
        <el-form-item label="身分證號" prop="idNo">
          <el-input v-model="formData.idNo" placeholder="例：A123456789" />
        </el-form-item>
        <el-form-item label="聯絡電話" prop="phone">
          <el-input v-model="formData.phone" placeholder="例：0912-345-678" />
        </el-form-item>
        <el-form-item label="駕照類別" prop="licenseType">
          <el-select v-model="formData.licenseType" style="width:100%">
            <el-option label="職業小型車" value="職業小型車" />
            <el-option label="職業普通車" value="職業普通車" />
            <el-option label="職業大型車" value="職業大型車" />
            <el-option label="職業聯結車" value="職業聯結車" />
          </el-select>
        </el-form-item>
        <el-form-item label="駕照到期" prop="licenseExp">
          <el-date-picker v-model="formData.licenseExp" type="date" placeholder="選擇日期" format="YYYY-MM-DD"
            value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="到職日期" prop="hireDate">
          <el-date-picker v-model="formData.hireDate" type="date" placeholder="選擇日期" format="YYYY-MM-DD"
            value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <!-- 選擇離職時才顯示離職日期 -->
        <el-form-item v-if="formData.status === 2" label="離職日期" prop="resignDate">
          <el-date-picker v-model="formData.resignDate" type="date" placeholder="選擇離職日期" format="YYYY-MM-DD"
            value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="狀態" prop="status">
          <el-select v-model="formData.status" style="width:100%">
            <el-option label="在職" :value="0" />
            <el-option label="休假" :value="1" />
            <el-option label="離職" :value="2" />
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
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { driverApi } from '@/api/driverApi'
import { formatDate, formatDriverStatus } from '@/utils/format'

// ─── 頁面狀態 ────────────────────────────────────────────────
const loading       = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const isEdit        = ref(false)
const formRef       = ref(null)

// ─── 搜尋條件 ────────────────────────────────────────────────
const searchKeyword = ref('')
const searchStatus  = ref(null)

// ─── 分頁 ────────────────────────────────────────────────────
const currentPage = ref(1)
const pageSize    = ref(10)
const total       = ref(0)

// ─── 司機列表 ────────────────────────────────────────────────
const drivers = ref([])

// ─── 表單資料 ────────────────────────────────────────────────
const formData = ref({
  name:        '',
  idNo:        '',
  phone:       '',
  licenseType: '職業大型車',
  licenseExp:  '',
  hireDate:    '',
  resignDate:  '',
  status:      0,
})

// ─── 表單驗證規則 ────────────────────────────────────────────
// 不用 computed，改用一般物件
// resignDate 的驗證在 handleSubmit 裡手動檢查
const formRules = {
  name:  [{ required: true, message: '請輸入姓名',   trigger: 'blur' }],
  idNo:  [
    { required: true, message: '請輸入身分證號', trigger: 'blur' },
    { pattern: /^[A-Z][0-9]{9}$/, message: '身分證格式不正確', trigger: 'blur' }
  ],
  phone:       [{ required: true, message: '請輸入聯絡電話',   trigger: 'blur'   }],
  licenseType: [{ required: true, message: '請選擇駕照類別',   trigger: 'change' }],
  licenseExp:  [{ required: true, message: '請選擇駕照到期日', trigger: 'change' }],
  hireDate:    [{ required: true, message: '請選擇到職日期',   trigger: 'change' }],
}
// ─── 取得司機列表（GET /api/drivers）────────────────────────
const fetchDrivers = async () => {
  loading.value = true
  try {
    const res = await driverApi.getList({
      page:     currentPage.value,
      pageSize: pageSize.value,
      keyword:  searchKeyword.value,
      status:   searchStatus.value ?? undefined,
    })
    drivers.value = res.items
    total.value   = res.total
  } finally {
    loading.value = false
  }
}

// ─── 狀態 Tag 顏色 ───────────────────────────────────────────
const statusTagType = (status) => {
  const map = { 0: 'success', 1: 'warning', 2: 'info' }
  return map[status] ?? 'info'
}

// ─── 日期格式化 ──────────────────────────────────────────────
const formatTime = (row, column, cellValue) => formatDate(cellValue, false)

const handleSearch    = () => { currentPage.value = 1; fetchDrivers() }
const handleReset     = () => { searchKeyword.value = ''; searchStatus.value = null; currentPage.value = 1; fetchDrivers() }
const handlePageChange = () => fetchDrivers()

const openCreateDialog = () => {
  isEdit.value        = false
  resetForm()
  dialogVisible.value = true
}

const openEditDialog = (row) => {
  isEdit.value   = true
  formData.value = {
    ...row,
    // 日期欄位轉換為 YYYY-MM-DD，el-date-picker 才能正確顯示
    licenseExp: row.licenseExp ? formatDate(row.licenseExp, false) : '',
    hireDate:   row.hireDate   ? formatDate(row.hireDate,   false) : '',
    resignDate: row.resignDate ? formatDate(row.resignDate, false) : '',
  }
  dialogVisible.value = true
}

const resetForm = () => {
  formData.value = {
    name: '', idNo: '', phone: '',
    licenseType: '職業大型車', licenseExp: '',
    hireDate: '', resignDate: '', status: 0
  }
  formRef.value?.clearValidate()
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  // 離職狀態時手動檢查離職日期
  if (formData.value.status === 2 && !formData.value.resignDate) {
    ElMessage.warning('離職狀態請填寫離職日期')
    return
  }

  submitLoading.value = true
  try {
    const payload = {
      name:        formData.value.name,
      idNo:        formData.value.idNo,
      phone:       formData.value.phone,
      licenseType: formData.value.licenseType,
      licenseExp:  formData.value.licenseExp,
      hireDate:    formData.value.hireDate,
      resignDate:  formData.value.status === 2 ? formData.value.resignDate : null,
      status:      formData.value.status,
    }

    if (isEdit.value) {
      await driverApi.update(formData.value.id, payload)
      ElMessage.success('司機資料已更新')
    } else {
      await driverApi.create(payload)
      ElMessage.success('司機已新增')
    }

    dialogVisible.value = false
    fetchDrivers()
  } finally {
    submitLoading.value = false
  }
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    `確定要刪除司機 ${row.name}？`,
    '刪除確認',
    { confirmButtonText: '確定刪除', cancelButtonText: '取消', type: 'warning' }
  ).then(async () => {
    await driverApi.delete(row.id)
    ElMessage.success('司機已刪除')
    fetchDrivers()
  }).catch(() => {})
}

onMounted(() => fetchDrivers())
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
