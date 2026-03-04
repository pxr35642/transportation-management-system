<template>
  <div>

    <!-- 搜尋列 -->
    <el-card class="search-card" shadow="never">
      <el-row :gutter="16" align="middle">
        <el-col :span="6">
          <el-input v-model="searchKeyword" placeholder="搜尋客戶名稱 / 統編 / 聯絡人" clearable @clear="handleSearch"
            @keyup.enter="handleSearch">
            <template #prefix><el-icon>
                <Search />
              </el-icon></template>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-select v-model="searchLevel" placeholder="全部等級" clearable @change="handleSearch">
            <el-option label="VIP" value="VIP" />
            <el-option label="一般" value="一般" />
            <el-option label="停用" value="停用" />
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
            </el-icon> 新增客戶
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 客戶列表 -->
    <el-card shadow="never">
      <el-table :data="pagedCustomers" stripe v-loading="loading" style="width: 100%" table-layout="auto">
        <el-table-column prop="name" label="客戶名稱" min-width="150" />
        <el-table-column prop="taxId" label="統一編號" min-width="120" />
        <el-table-column prop="contact" label="聯絡人" min-width="100" />
        <el-table-column prop="phone" label="聯絡電話" min-width="130" />
        <el-table-column prop="email" label="Email" min-width="180" />
        <el-table-column prop="address" label="地址" min-width="200" />
        <el-table-column prop="totalOrders" label="累計訂單" min-width="100" />
        <el-table-column prop="level" label="等級" min-width="90">
          <template #default="scope">
            <el-tag :type="levelTagType(scope.row.level)">
              {{ scope.row.level }}
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
        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :total="filteredCustomers.length"
          :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" />
      </div>
    </el-card>

    <!-- 新增/編輯 Dialog -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '編輯客戶' : '新增客戶'" width="540px" @close="resetForm">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="客戶名稱" prop="name">
          <el-input v-model="formData.name" placeholder="請輸入客戶名稱" />
        </el-form-item>
        <el-form-item label="統一編號" prop="taxId">
          <el-input v-model="formData.taxId" placeholder="請輸入8位統一編號" maxlength="8" />
        </el-form-item>
        <el-form-item label="聯絡人" prop="contact">
          <el-input v-model="formData.contact" placeholder="請輸入聯絡人姓名" />
        </el-form-item>
        <el-form-item label="聯絡電話" prop="phone">
          <el-input v-model="formData.phone" placeholder="例：02-1234-5678" />
        </el-form-item>
        <el-form-item label="Email" prop="email">
          <el-input v-model="formData.email" placeholder="例：contact@company.com" />
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input v-model="formData.address" placeholder="請輸入公司地址" />
        </el-form-item>
        <el-form-item label="客戶等級" prop="level">
          <el-select v-model="formData.level" style="width:100%">

            <el-option label="VIP" value="VIP" />
            <el-option label="一般" value="一般" />
            <el-option label="停用" value="停用" />

          </el-select>
        </el-form-item>
        <el-form-item label="備註">
          <el-input v-model="formData.remark" type="textarea" :rows="3" placeholder="選填" />
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
const searchLevel = ref(null)
const currentPage = ref(1)
const pageSize = ref(10)

const formData = ref({
  name: '',
  taxId: '',
  contact: '',
  phone: '',
  email: '',
  address: '',
  level: '一般',
  remark: '',
})

const formRules = {
  name: [{ required: true, message: '請輸入客戶名稱', trigger: 'blur' }],
  taxId: [
    { required: true, message: '請輸入統一編號', trigger: 'blur' },
    // 台灣統一編號為8位數字
    { pattern: /^\d{8}$/, message: '統一編號須為8位數字', trigger: 'blur' }
  ],
  contact: [{ required: true, message: '請輸入聯絡人', trigger: 'blur' }],
  phone: [{ required: true, message: '請輸入聯絡電話', trigger: 'blur' }],
  email: [
    { required: true, message: '請輸入 Email', trigger: 'blur' },
    { type: 'email', message: 'Email 格式不正確', trigger: 'blur' }
  ],
  address: [{ required: true, message: '請輸入地址', trigger: 'blur' }],
  level: [{ required: true, message: '請選擇客戶等級', trigger: 'change' }],
}

// ─── 模擬資料 ────────────────────────────────────────────────
const customers = ref([
  { id: 1, name: '台積電股份有限公司', taxId: '22099131', contact: '張經理', phone: '03-563-6688', email: 'logistics@tsmc.com', address: '新竹市東區力行六路8號', totalOrders: 312, level: 'VIP', remark: '' },
  { id: 2, name: '聯發科技股份有限公司', taxId: '23154026', contact: '李協理', phone: '03-567-0766', email: 'supply@mediatek.com', address: '新竹市東區建國路1號', totalOrders: 278, level: 'VIP', remark: '' },
  { id: 3, name: '鴻海精密工業股份有限公司', taxId: '04506953', contact: '王主任', phone: '02-2268-3466', email: 'purchase@foxconn.com', address: '新北市土城區自由街66號', totalOrders: 195, level: '一般', remark: '' },
  { id: 4, name: '日月光半導體製造股份有限公司', taxId: '84149961', contact: '陳副理', phone: '07-361-7131', email: 'ase@logistics.com', address: '高雄市前鎮區國際路1號', totalOrders: 143, level: '一般', remark: '' },
  { id: 5, name: '友達光電股份有限公司', taxId: '16314668', contact: '林組長', phone: '03-478-8888', email: 'auo@purchase.com', address: '桃園市龍潭區文化二路1號', totalOrders: 87, level: '停用', remark: '合約到期暫停' },
])

// ─── 搜尋過濾 ────────────────────────────────────────────────
const filteredCustomers = computed(() => {
  return customers.value.filter(c => {
    const keywordMatch = !searchKeyword.value ||
      c.name.includes(searchKeyword.value) ||
      c.taxId.includes(searchKeyword.value) ||
      c.contact.includes(searchKeyword.value)
    const levelMatch = !searchLevel.value || c.level === searchLevel.value
    return keywordMatch && levelMatch
  })
})

const pagedCustomers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredCustomers.value.slice(start, start + pageSize.value)
})

// ─── 等級 Tag 顏色 ───────────────────────────────────────────
const levelTagType = (level) => {
  const map = { 'VIP': 'warning', '一般': 'success', '停用': 'info' }
  return map[level] ?? 'info'
}

const handleSearch = () => { currentPage.value = 1 }
const handleReset = () => { searchKeyword.value = ''; searchLevel.value = null; currentPage.value = 1 }

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
  formData.value = { name: '', taxId: '', contact: '', phone: '', email: '', address: '', level: '一般', remark: '' }
  formRef.value?.clearValidate()
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  await new Promise(resolve => setTimeout(resolve, 600))

  if (isEdit.value) {
    const index = customers.value.findIndex(c => c.id === formData.value.id)
    if (index !== -1) customers.value[index] = { ...formData.value }
    ElMessage.success('客戶資料已更新')
  } else {
    customers.value.unshift({
      ...formData.value,
      id: customers.value.length + 1,
      totalOrders: 0,
    })
    ElMessage.success('客戶已新增')
  }

  submitLoading.value = false
  dialogVisible.value = false
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    `確定要刪除客戶「${row.name}」？`,
    '刪除確認',
    { confirmButtonText: '確定刪除', cancelButtonText: '取消', type: 'warning' }
  ).then(() => {
    customers.value = customers.value.filter(c => c.id !== row.id)
    ElMessage.success('客戶已刪除')
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
