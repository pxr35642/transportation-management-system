<template>
  <div>

    <!-- 搜尋列 -->
    <el-card class="search-card" shadow="never">
      <el-row :gutter="16" align="middle">
        <el-col :span="6">
          <el-input v-model="searchKeyword" placeholder="搜尋訂單編號 / 客戶名稱" clearable @clear="handleSearch"
            @keyup.enter="handleSearch">
            <template #prefix><el-icon>
                <Search />
              </el-icon></template>
          </el-input>
        </el-col>
        <el-col :span="4">
          <!-- 狀態篩選下拉 -->
          <el-select v-model="searchStatus" placeholder="全部狀態" clearable @change="handleSearch">
            <el-option label="待派車" :value="0" />
            <el-option label="運送中" :value="1" />
            <el-option label="已完成" :value="2" />
            <el-option label="已取消" :value="3" />
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
            </el-icon> 新增訂單
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 訂單列表 -->
    <el-card shadow="never" class="table-card">
      <el-table :data="pagedOrders" stripe v-loading="loading" style="width: 100%" table-layout="auto">
        <el-table-column prop="orderNo" label="訂單編號" min-width="180" />
        <el-table-column prop="customerName" label="客戶名稱" min-width="100" />
        <el-table-column prop="origin" label="起點" min-width="80" />
        <el-table-column prop="destination" label="終點" min-width="80" />
        <el-table-column prop="driver" label="司機" min-width="80" />
        <el-table-column prop="status" label="狀態" min-width="80" :formatter="formatStatus" />
        <el-table-column prop="createdAt" label="建立時間" min-width="150" />
        <el-table-column label="操作" min-width="120" fixed="right">
          <template #default="scope">
            <el-button type="primary" link @click="openEditDialog(scope.row)">編輯</el-button>
            <el-button type="danger" link @click="handleDelete(scope.row)">刪除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <!-- 分頁 -->
      <div class="pagination">
        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :total="filteredOrders.length"
          :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" @change="handlePageChange" />
      </div>
    </el-card>

    <!-- 新增/編輯 Dialog -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '編輯訂單' : '新增訂單'" width="500px" @close="resetForm">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="80px">
        <el-form-item label="客戶名稱" prop="customerName">
          <el-input v-model="formData.customerName" placeholder="請輸入客戶名稱" />
        </el-form-item>
        <el-form-item label="起點" prop="origin">
          <el-input v-model="formData.origin" placeholder="請輸入起點" />
        </el-form-item>
        <el-form-item label="終點" prop="destination">
          <el-input v-model="formData.destination" placeholder="請輸入終點" />
        </el-form-item>
        <el-form-item label="司機" prop="driver">
          <el-input v-model="formData.driver" placeholder="請輸入司機姓名" />
        </el-form-item>
        <el-form-item label="狀態" prop="status">
          <el-select v-model="formData.status" style="width: 100%">
            <el-option label="待派車" :value="0" />
            <el-option label="運送中" :value="1" />
            <el-option label="已完成" :value="2" />
            <el-option label="已取消" :value="3" />
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

// ─── 狀態變數 ────────────────────────────────────────────────
const loading = ref(false)  // 表格載入中
const submitLoading = ref(false)  // 表單送出中
const dialogVisible = ref(false)  // Dialog 開關
const isEdit = ref(false)  // 判斷是新增還是編輯
const formRef = ref(null)   // 表單 ref，用來呼叫驗證

// ─── 搜尋條件 ────────────────────────────────────────────────
const searchKeyword = ref('')
const searchStatus = ref(null)

// ─── 分頁 ────────────────────────────────────────────────────
const currentPage = ref(1)
const pageSize = ref(10)

// ─── 表單資料（每次開 Dialog 都會重設）──────────────────────
const formData = ref({
  customerName: '',
  origin: '',
  destination: '',
  driver: '',
  status: 0,
})

// ─── 表單驗證規則 ────────────────────────────────────────────
const formRules = {
  customerName: [{ required: true, message: '請輸入客戶名稱', trigger: 'blur' }],
  origin: [{ required: true, message: '請輸入起點', trigger: 'blur' }],
  destination: [{ required: true, message: '請輸入終點', trigger: 'blur' }],
  driver: [{ required: true, message: '請輸入司機姓名', trigger: 'blur' }],
}

// ─── 模擬資料（之後替換成 API 呼叫）─────────────────────────
const orders = ref([
  { id: 1, orderNo: 'ORD-20240301', customerName: '台積電', origin: '新竹', destination: '台北', driver: '王大明', status: 1, createdAt: '2024-03-01 09:00' },
  { id: 2, orderNo: 'ORD-20240302', customerName: '聯發科', origin: '台中', destination: '高雄', driver: '李小華', status: 2, createdAt: '2024-03-01 10:30' },
  { id: 3, orderNo: 'ORD-20240303', customerName: '鴻海精密', origin: '台南', destination: '桃園', driver: '張阿成', status: 0, createdAt: '2024-03-01 11:00' },
  { id: 4, orderNo: 'ORD-20240304', customerName: '日月光', origin: '高雄', destination: '台中', driver: '陳志明', status: 1, createdAt: '2024-03-01 13:15' },
  { id: 5, orderNo: 'ORD-20240305', customerName: '友達光電', origin: '龍潭', destination: '新竹', driver: '林建宏', status: 3, createdAt: '2024-03-01 14:00' },
  { id: 6, orderNo: 'ORD-20240306', customerName: '華碩電腦', origin: '台北', destination: '台南', driver: '吳志豪', status: 0, createdAt: '2024-03-01 15:00' },
  { id: 7, orderNo: 'ORD-20240307', customerName: '廣達電腦', origin: '桃園', destination: '台中', driver: '黃俊傑', status: 2, createdAt: '2024-03-01 16:00' },
])

// ─── 搜尋過濾（computed 自動響應搜尋條件變化）───────────────
const filteredOrders = computed(() => {
  return orders.value.filter(order => {
    // 關鍵字同時比對訂單編號和客戶名稱
    const keywordMatch = !searchKeyword.value ||
      order.orderNo.includes(searchKeyword.value) ||
      order.customerName.includes(searchKeyword.value)

    // 狀態篩選：null 代表全部
    const statusMatch = searchStatus.value === null ||
      searchStatus.value === undefined ||
      order.status === searchStatus.value

    return keywordMatch && statusMatch
  })
})

// ─── 分頁切割（computed 依 currentPage 自動更新）─────────────
const pagedOrders = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredOrders.value.slice(start, start + pageSize.value)
})

// ─── 搜尋 / 重置 ─────────────────────────────────────────────
const handleSearch = () => {
  // 搜尋時回到第一頁，避免篩選後停在不存在的頁數
  currentPage.value = 1
}

const handleReset = () => {
  searchKeyword.value = ''
  searchStatus.value = null
  currentPage.value = 1
}

const handlePageChange = () => {
  // 分頁變更時可在此加入 API 呼叫
}

// ─── 格式化狀態欄位 ──────────────────────────────────────────
const formatStatus = (row, column, cellValue) => {
  const map = { 0: '待派車', 1: '運送中', 2: '已完成', 3: '已取消' }
  return map[cellValue] ?? '未知'
}

// ─── 開啟新增 Dialog ─────────────────────────────────────────
const openCreateDialog = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

// ─── 開啟編輯 Dialog，把該列資料填入表單 ────────────────────
const openEditDialog = (row) => {
  isEdit.value = true
  // 用展開運算子複製，避免直接修改表格資料
  formData.value = { ...row }
  dialogVisible.value = true
}

// ─── 重設表單 ────────────────────────────────────────────────
const resetForm = () => {
  formData.value = { customerName: '', origin: '', destination: '', driver: '', status: 0 }
  // formRef 可能還未掛載，加上 ?. 防止報錯
  formRef.value?.clearValidate()
}

// ─── 送出表單（新增 or 編輯）────────────────────────────────
const handleSubmit = async () => {
  // 先執行表單驗證，驗證失敗就停止
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true

  // 模擬 API 呼叫延遲（實際串接時換成 await orderApi.create/update）
  await new Promise(resolve => setTimeout(resolve, 600))

  if (isEdit.value) {
    // 找到對應資料並更新
    const index = orders.value.findIndex(o => o.id === formData.value.id)
    if (index !== -1) orders.value[index] = { ...formData.value }
    ElMessage.success('訂單已更新')
  } else {
    // ─── 產生訂單編號：ORD-YYYYMMDD-XXX（當天日期 + 三位流水號）───
    const generateOrderNo = () => {
      // 取得今天日期，格式 YYYYMMDD
      const today = new Date()
      const dateStr = today.getFullYear().toString() +
        String(today.getMonth() + 1).padStart(2, '0') +
        String(today.getDate()).padStart(2, '0')

      // 找出今天已有的訂單，計算流水號
      const todayOrders = orders.value.filter(o => o.orderNo.includes(dateStr))
      const seq = String(todayOrders.length + 1).padStart(3, '0')

      return `ORD-${dateStr}-${seq}`
    }

    const newOrder = {
      ...formData.value,
      id: orders.value.length + 1,
      orderNo: generateOrderNo(),
      createdAt: new Date().toLocaleString('zh-TW'),
    }
    orders.value.unshift(newOrder) // 插到最前面
    ElMessage.success('訂單已新增')
  }

  submitLoading.value = false
  dialogVisible.value = false
}

// ─── 刪除訂單（帶確認 Dialog）───────────────────────────────
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `確定要刪除訂單 ${row.orderNo}？`,
    '刪除確認',
    { confirmButtonText: '確定刪除', cancelButtonText: '取消', type: 'warning' }
  ).then(() => {
    orders.value = orders.value.filter(o => o.id !== row.id)
    ElMessage.success('訂單已刪除')
  }).catch(() => {
    // 使用者點取消，不做任何事
  })
}
</script>

<style scoped>
.search-card {
  margin-bottom: 16px;
}

.table-card {}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
