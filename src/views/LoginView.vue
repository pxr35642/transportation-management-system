<template>
  <div class="login-wrapper">
    <div class="login-box">
      <div class="login-header">
        <div class="login-logo">🚛</div>
        <h2 class="login-title">運輸管理系統</h2>
        <p class="login-subtitle">Transport Management System</p>
      </div>

      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-position="top"
        @keyup.enter="handleLogin"
      >
        <el-form-item label="帳號" prop="username">
          <el-input
            v-model="formData.username"
            placeholder="請輸入帳號"
            size="large"
            prefix-icon="User"
          />
        </el-form-item>
        <el-form-item label="密碼" prop="password">
          <el-input
            v-model="formData.password"
            type="password"
            placeholder="請輸入密碼"
            size="large"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        <el-button
          type="primary"
          size="large"
          style="width: 100%; margin-top: 8px"
          :loading="loading"
          @click="handleLogin"
        >
          登入
        </el-button>
      </el-form>

      <div class="login-footer">預設帳號：admin　密碼：admin1234</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

const authStore = useAuthStore()
const formRef   = ref(null)
const loading   = ref(false)

const formData = ref({
  username: '',
  password: '',
})

const formRules = {
  username: [{ required: true, message: '請輸入帳號', trigger: 'blur' }],
  password: [{ required: true, message: '請輸入密碼', trigger: 'blur' }],
}

const handleLogin = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await authStore.login(formData.value.username, formData.value.password)
    ElMessage.success('登入成功')
  } catch {
    // 錯誤訊息由 http.js 攔截器統一處理
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-wrapper {
  height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1f2e 0%, #2d3446 100%);
}

.login-box {
  width: 420px;
  background: #fff;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-logo {
  font-size: 48px;
  margin-bottom: 8px;
}

.login-title {
  font-size: 22px;
  font-weight: 700;
  color: #303133;
  margin: 0 0 4px;
}

.login-subtitle {
  font-size: 13px;
  color: #909399;
  margin: 0;
}

.login-footer {
  margin-top: 20px;
  text-align: center;
  font-size: 12px;
  color: #c0c4cc;
}
</style>
