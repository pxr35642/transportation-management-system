<template>
  <!-- 加上 style 確保全螢幕高度且水平排列 -->
  <div class="app-wrapper">

    <!-- 側邊欄 -->
    <div class="sidebar">
      <div class="logo">運輸管理系統</div>
      <el-menu :default-active="activeMenu" router background-color="#1a1f2e" text-color="#c0c4cc"
        active-text-color="#409eff">
        <el-menu-item v-for="item in menuItems" :key="item.path" :index="item.path">
          <el-icon>
            <component :is="item.icon" />
          </el-icon>
          <span>{{ item.label }}</span>
        </el-menu-item>
      </el-menu>
    </div>

    <!-- 右側區域 -->
    <div class="main-wrapper">
      <!-- Header -->
      <div class="header">
        <span class="page-title">{{ currentTitle }}</span>
        <div style="display:flex;align-items:center;gap:12px">
          <span style="font-size:14px;color:#606266">{{ authStore.userInfo?.fullName }}</span>
          <el-dropdown @command="handleCommand">
            <el-avatar style="cursor:pointer">
              {{ authStore.userInfo?.fullName?.charAt(0) }}
            </el-avatar>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">登出</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <!-- 頁面內容 -->
      <div class="main-content">
        <router-view />
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()

const menuItems = [
  { path: '/dashboard', label: '儀表板', icon: 'Odometer' },
  { path: '/orders', label: '訂單管理', icon: 'Document' },
  { path: '/vehicles', label: '車輛管理', icon: 'Van' },
  { path: '/drivers', label: '司機管理', icon: 'User' },
  { path: '/routes', label: '路線規劃', icon: 'MapLocation' },
  { path: '/tracking', label: '即時追蹤', icon: 'Location' },
  { path: '/reports', label: '報表統計', icon: 'TrendCharts' },
  { path: '/customers', label: '客戶管理', icon: 'Avatar' },
]

const activeMenu = computed(() => route.path)
const currentTitle = computed(() => route.meta.title || '運輸管理系統')

const authStore = useAuthStore()

const handleCommand = (command) => {
  if (command === 'logout') authStore.logout()
}
</script>

<style scoped>
/* 最外層：水平排列，佔滿全螢幕 */
.app-wrapper {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

/* 側邊欄：固定寬度，深色背景 */
.sidebar {
  width: 220px;
  min-width: 220px;
  background-color: #1a1f2e;
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
}

.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  border-bottom: 1px solid #2d3446;
}

/* 右側：佔剩餘寬度，垂直排列 */
.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 頂部 Header */
.header {
  height: 60px;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  padding: 0 20px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

/* 內容區：可捲動 */
.main-content {
  flex: 1;
  background: #f0f2f5;
  overflow-y: auto;
  padding: 20px;
}
</style>
