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
      <el-table :data="pagedDrivers" stripe v-loading="loading" style="width: 100%" table-layout="auto">
        <el-table-column prop="name" label="姓名" min-width="100" />
        <el-table-column prop="idNo" label="身分證號" min-width="130" />
        <el-table-column prop="phone" label="聯絡電話" min-width="130" />
        <el-table-column prop="licenseType" label="駕照類別" min-width="100" />
        <el-table-column prop="licenseExp" label="駕照到期" min-width="120" />
        <el-table-column prop="hireDate" label="到職日期" min-width="120" />
        <el-table-column prop="resignDate" label="離職日期" min-width="120">
          <template #default="scope">
            <!-- 非離職狀態顯示 - -->
            {{ scope.row.resignDate || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="totalTrips" label="累計趟次" min-width="100" />
        <el-table-column prop="status" label="狀態" min-width="100">
          <template #default="scope">
            <el-tag :type="statusTagType(scope.row.status)">
              {{ statusLabel(scope.row.status) }}
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
        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :total="filteredDrivers.length"
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
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)

const searchKeyword = ref('')
const searchStatus = ref(null)
const currentPage = ref(1)
const pageSize = ref(10)

const formData = ref({
  name: '',
  idNo: '',
  phone: '',
  licenseType: '職業大型車',
  licenseExp: '',
  hireDate: '',
  resignDate: '',  // 新增
  status: 0,
})

const formRules = computed(() => ({
  name: [{ required: true, message: '請輸入姓名', trigger: 'blur' }],
  idNo: [
    { required: true, message: '請輸入身分證號', trigger: 'blur' },
    { pattern: /^[A-Z][0-9]{9}$/, message: '身分證格式不正確', trigger: 'blur' }
  ],
  phone: [{ required: true, message: '請輸入聯絡電話', trigger: 'blur' }],
  licenseType: [{ required: true, message: '請選擇駕照類別', trigger: 'change' }],
  licenseExp: [{ required: true, message: '請選擇駕照到期日', trigger: 'change' }],
  hireDate: [{ required: true, message: '請選擇到職日期', trigger: 'change' }],
  // 狀態為離職時才必填
  resignDate: formData.value.status === 2
    ? [{ required: true, message: '請選擇離職日期', trigger: 'change' }]
    : [],
}))

// ─── 模擬資料 ────────────────────────────────────────────────
const drivers = ref([
  { id: 1, name: '王大明', idNo: 'A123456789', phone: '0912-345-678', licenseType: '職業大型車', licenseExp: '2026-08-01', hireDate: '2018-03-01', totalTrips: 312, status: 0 },
  { id: 2, name: '李小華', idNo: 'B234567890', phone: '0923-456-789', licenseType: '職業聯結車', licenseExp: '2025-12-31', hireDate: '2019-07-15', totalTrips: 278, status: 0 },
  { id: 3, name: '張阿成', idNo: 'C345678901', phone: '0934-567-890', licenseType: '職業普通車', licenseExp: '2027-03-20', hireDate: '2020-01-10', totalTrips: 195, status: 1 },
  { id: 4, name: '陳志明', idNo: 'D456789012', phone: '0945-678-901', licenseType: '職業大型車', licenseExp: '2026-05-15', hireDate: '2017-09-01', totalTrips: 430, status: 0 },
  { id: 5, name: '林建宏', idNo: 'E567890123', phone: '0956-789-012', licenseType: '職業聯結車', licenseExp: '2025-11-30', hireDate: '2021-04-20', totalTrips: 156, status: 2 },
])

// ─── 搜尋過濾 ────────────────────────────────────────────────
const filteredDrivers = computed(() => {
  return drivers.value.filter(d => {
    const keywordMatch = !searchKeyword.value ||
      d.name.includes(searchKeyword.value) ||
      d.idNo.includes(searchKeyword.value) ||
      d.phone.includes(searchKeyword.value)
    const statusMatch = searchStatus.value === null ||
      searchStatus.value === undefined ||
      d.status === searchStatus.value
    return keywordMatch && statusMatch
  })
})

const pagedDrivers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredDrivers.value.slice(start, start + pageSize.value)
})

// ─── 狀態對應 ────────────────────────────────────────────────
const statusTagType = (status) => {
  const map = { 0: 'success', 1: 'warning', 2: 'info' }
  return map[status] ?? 'info'
}

const statusLabel = (status) => {
  const map = { 0: '在職', 1: '休假', 2: '離職' }
  return map[status] ?? '未知'
}

const handleSearch = () => { currentPage.value = 1 }
const handleReset = () => { searchKeyword.value = ''; searchStatus.value = null; currentPage.value = 1 }

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
  formData.value = {
    name: '', idNo: '', phone: '',
    licenseType: '職業大型車', licenseExp: '', hireDate: '',
    resignDate: '',  // 新增
    status: 0
  }
  formRef.value?.clearValidate()
}
const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  await new Promise(resolve => setTimeout(resolve, 600))

  if (isEdit.value) {
    const index = drivers.value.findIndex(d => d.id === formData.value.id)
    if (index !== -1) drivers.value[index] = { ...formData.value }
    ElMessage.success('司機資料已更新')
  } else {
    drivers.value.unshift({
      ...formData.value,
      id: drivers.value.length + 1,
      totalTrips: 0,
    })
    ElMessage.success('司機已新增')
  }

  submitLoading.value = false
  dialogVisible.value = false
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    `確定要刪除司機 ${row.name}？`,
    '刪除確認',
    { confirmButtonText: '確定刪除', cancelButtonText: '取消', type: 'warning' }
  ).then(() => {
    drivers.value = drivers.value.filter(d => d.id !== row.id)
    ElMessage.success('司機已刪除')
  }).catch(() => { })
}
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
