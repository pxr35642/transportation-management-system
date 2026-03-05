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
      <el-table :data="orders" stripe v-loading="loading" style="width: 100%" table-layout="auto">
        <el-table-column prop="orderNo" label="訂單編號" min-width="180" />
        <el-table-column prop="customerName" label="客戶名稱" min-width="100" />
        <el-table-column prop="origin" label="起點" min-width="80" />
        <el-table-column prop="destination" label="終點" min-width="80" />
        <el-table-column prop="driver" label="司機" min-width="80" />
        <el-table-column prop="status" label="狀態" min-width="80" :formatter="formatStatus" />
        <el-table-column prop="createdAt" label="建立時間" min-width="160" :formatter="formatTime" />
        <el-table-column label="操作" min-width="120" fixed="right">
          <template #default="scope">
            <el-button type="primary" link @click="openEditDialog(scope.row)">編輯</el-button>
            <el-button type="danger" link @click="handleDelete(scope.row)">刪除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <!-- 分頁 -->
      <div class="pagination">
        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :total="total"
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
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { orderApi } from '@/api/orderApi'
import { formatDate, formatOrderStatus } from '@/utils/format'

// ─── 頁面狀態 ────────────────────────────────────────────────
const loading = ref(false)  // 表格載入中（顯示 loading 遮罩）
const submitLoading = ref(false)  // 表單送出中（防止重複點擊）
const dialogVisible = ref(false)  // 控制新增/編輯 Dialog 開關
const isEdit = ref(false)  // true=編輯模式 false=新增模式
const formRef = ref(null)   // 表單 ref，用來呼叫 validate()

// ─── 搜尋條件 ────────────────────────────────────────────────
const searchKeyword = ref('')     // 關鍵字（訂單編號 or 客戶名稱）
const searchStatus = ref(null)   // 狀態篩選，null 代表全部

// ─── 分頁 ────────────────────────────────────────────────────
const currentPage = ref(1)        // 目前頁碼
const pageSize = ref(10)       // 每頁筆數
const total = ref(0)        // 總筆數（由後端回傳，用於計算總頁數）

// ─── 表單資料 ────────────────────────────────────────────────
// 新增時為空值，編輯時會把該列資料填入
const formData = ref({
  customerName: '',
  origin: '',
  destination: '',
  driver: '',
  status: 0,
})

// ─── 表單驗證規則 ────────────────────────────────────────────
// trigger: 'blur' 表示輸入框失去焦點時觸發驗證
const formRules = {
  customerName: [{ required: true, message: '請輸入客戶名稱', trigger: 'blur' }],
  origin: [{ required: true, message: '請輸入起點', trigger: 'blur' }],
  destination: [{ required: true, message: '請輸入終點', trigger: 'blur' }],
  driver: [{ required: true, message: '請輸入司機姓名', trigger: 'blur' }],
}

// ─── 訂單列表資料 ────────────────────────────────────────────
// 不再使用本地模擬資料，改由 fetchOrders() 從 API 取得
const orders = ref([])

// ─── 取得訂單列表（呼叫後端 GET /api/orders）────────────────
const fetchOrders = async () => {
  loading.value = true
  try {
    // 把搜尋條件和分頁參數傳給後端
    // status 為 null 時傳 undefined，後端收不到此參數代表查全部
    const res = await orderApi.getList({
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: searchKeyword.value,
      status: searchStatus.value ?? undefined,
    })

    // 後端回傳格式：{ total: 總筆數, items: 當頁資料陣列 }
    orders.value = res.items
    total.value = res.total
  } finally {
    // 無論成功或失敗都要關閉 loading
    loading.value = false
  }
}

// ─── 格式化狀態欄位（el-table formatter）────────────────────
// el-table 的 formatter 接收 (row, column, cellValue)
// 回傳要顯示的文字，不支援 HTML，若要顯示 Tag 需用 slot
// 使用共用工具格式化狀態和日期
const formatStatus = (row, column, cellValue) => formatOrderStatus(cellValue)
const formatTime = (row, column, cellValue) => formatDate(cellValue)

// ─── 搜尋：回到第一頁再重新取得資料 ─────────────────────────
// 避免篩選後停留在不存在的頁碼（例如原本第 5 頁，篩選後只有 1 頁）
const handleSearch = () => {
  currentPage.value = 1
  fetchOrders()
}

// ─── 重置搜尋條件 ────────────────────────────────────────────
const handleReset = () => {
  searchKeyword.value = ''
  searchStatus.value = null
  currentPage.value = 1
  fetchOrders()
}

// ─── 分頁切換（換頁或換每頁筆數時觸發）─────────────────────
const handlePageChange = () => {
  fetchOrders()
}

// ─── 開啟新增 Dialog ─────────────────────────────────────────
const openCreateDialog = () => {
  isEdit.value = false
  resetForm()           // 清空表單資料
  dialogVisible.value = true
}

// ─── 開啟編輯 Dialog ─────────────────────────────────────────
// 把該列的資料填入表單，用展開運算子複製避免直接修改表格資料
const openEditDialog = (row) => {
  isEdit.value = true
  formData.value = { ...row }  // 淺拷貝，避免修改到 orders 陣列的原始資料
  dialogVisible.value = true
}

// ─── 重設表單 ────────────────────────────────────────────────
// Dialog 關閉時也會觸發（@close="resetForm"）
const resetForm = () => {
  formData.value = {
    customerName: '',
    origin: '',
    destination: '',
    driver: '',
    status: 0,
  }
  // clearValidate() 清除紅色錯誤提示
  // 加上 ?. 是因為 Dialog 剛開啟時 formRef 可能還未掛載
  formRef.value?.clearValidate()
}

// ─── 送出表單（新增 or 編輯）────────────────────────────────
const handleSubmit = async () => {
  // 先執行表單驗證，驗證失敗（catch 回傳 false）就停止
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    if (isEdit.value) {
      // 編輯模式：呼叫 PUT /api/orders/{id}
      // 只傳後端 UpdateOrderDto 需要的欄位，不傳 id、orderNo、createdAt 等
      await orderApi.update(formData.value.id, {
        customerName: formData.value.customerName,
        origin: formData.value.origin,
        destination: formData.value.destination,
        driver: formData.value.driver,
        status: formData.value.status,
      })
      ElMessage.success('訂單已更新')
    } else {
      // 新增模式：呼叫 POST /api/orders
      // 訂單編號由後端自動產生（ORD-YYYYMMDD-XXX），前端不需傳入
      await orderApi.create({
        customerName: formData.value.customerName,
        origin: formData.value.origin,
        destination: formData.value.destination,
        driver: formData.value.driver,
      })
      ElMessage.success('訂單已新增')
    }

    dialogVisible.value = false
    fetchOrders()  // 送出後重新載入列表，確保畫面資料與資料庫同步

  } finally {
    submitLoading.value = false
  }
}

// ─── 刪除訂單 ────────────────────────────────────────────────
// 先跳確認 Dialog，確認後才呼叫 DELETE /api/orders/{id}
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `確定要刪除訂單 ${row.orderNo}？`,
    '刪除確認',
    { confirmButtonText: '確定刪除', cancelButtonText: '取消', type: 'warning' }
  ).then(async () => {
    await orderApi.delete(row.id)
    ElMessage.success('訂單已刪除')
    fetchOrders()  // 刪除後重新載入
  }).catch(() => {
    // 使用者點取消，不做任何事
  })
}

// ─── 生命週期：頁面載入時自動取得第一頁資料 ─────────────────
onMounted(() => fetchOrders())
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
