<!-- 
  App.vue - 应用程序的主入口组件
  这个文件包含了整个应用的基本布局和全局状态管理
-->

<script setup>
// 导入必要的 Vue 组件和工具
import { RouterLink, RouterView } from 'vue-router'  // 路由相关组件
import { computed, onMounted, ref } from 'vue'       // Vue 的组合式 API
import { useRouter } from 'vue-router'               // 路由实例
import { useUserStore } from '@/stores/user'         // 用户状态管理
import { ElMessage, ElLoading } from 'element-plus'  // Element Plus UI 组件
import { Loading } from '@element-plus/icons-vue'    // Element Plus 图标
import Sidebar from '@/components/Sidebar.vue'

// 初始化路由和用户状态
const router = useRouter()                           // 获取路由实例
const userStore = useUserStore()                     // 获取用户状态管理实例
const isLoading = ref(true)                          // 加载状态标志

// 计算属性：获取当前用户和认证状态
const user = computed(() => userStore.currentUser)   // 当前登录用户
const isAuthenticated = computed(() => userStore.isAuthenticated)  // 是否已认证

// 处理用户登出
const handleLogout = () => {
  userStore.logout()                                 // 清除用户状态
  ElMessage.success('已退出登录')                    // 显示成功消息
  router.push('/login')                             // 跳转到登录页
}

// 初始化用户状态
const initializeUserState = async () => {
  const token = localStorage.getItem('token')        // 从本地存储获取 token
  if (token) {                                       // 如果有 token
    try {
      await userStore.initializeFromToken(token)     // 尝试用 token 初始化用户状态
    } catch (error) {
      console.error('Failed to initialize user state:', error)
      // 只有在明确的认证错误时才登出
      if (error.response?.status === 401) {
        userStore.logout()
        // 如果当前不在登录页面，重定向到登录页
        if (router.currentRoute.value.name !== 'login') {
          router.push('/login')
        }
      }
    }
  }
  isLoading.value = false                           // 关闭加载状态
}

// 组件挂载时初始化用户状态
onMounted(() => {
  initializeUserState()
})
</script>

<template>
  <!-- 显示加载中状态 -->
  <div v-if="isLoading" class="app-loading">
    <el-icon class="is-loading"><Loading /></el-icon>
    <span>加载中...</span>
  </div>
  
  <!-- 已认证用户的完整应用布局 -->
  <el-container v-else-if="isAuthenticated" class="app-container">
    <el-header class="app-header">
      <div class="header-content">
        <h1>收藏夹</h1>
        <div class="user-info">
          <span>{{ user?.username }}</span>
          <el-button type="text" @click="handleLogout">退出</el-button>
        </div>
      </div>
    </el-header>
    
    <el-container class="main-container">
      <el-aside width="200px">
        <Sidebar />
      </el-aside>
      
      <el-main class="app-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
  
  <!-- 未认证用户只显示登录/注册页面 -->
  <div v-else class="auth-container">
    <router-view />
  </div>
</template>

<style>
/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

#app {
  height: 100%;
}
</style>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 0 20px;
  height: 60px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

.header-content {
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.header-content h1 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.main-container {
  margin-top: 60px;
  flex: 1;
  min-height: calc(100vh - 60px);
}

.app-main {
  background-color: #f5f7fa;
  padding: 20px;
  height: 100%;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .app-header {
    padding: 0 10px;
  }
  
  .header-content h1 {
    font-size: 20px;
  }
  
  .app-main {
    padding: 10px;
  }
}

.auth-container {
  min-height: 100vh;
  width: 100%;
}

.app-loading {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.9);
  z-index: 9999;
}

.app-loading .el-icon {
  font-size: 40px;
  color: #409eff;
  margin-bottom: 10px;
}
</style>

<!-- 
  使用指南：
  1. 这个文件是应用的根组件，负责整体布局和用户认证状态管理
  2. 主要功能：
     - 显示顶部导航栏（登录后）
     - 管理用户认证状态
     - 处理页面刷新时的状态恢复
     - 提供响应式布局
  3. 关键点：
     - 使用 localStorage 存储 token
     - 使用 Pinia 管理用户状态
     - 使用 Element Plus 组件库
     - 实现了响应式设计
  4. 注意事项：
     - 确保后端 API 正确配置
     - 注意 token 的安全性
     - 保持样式的一致性
     - 考虑不同设备的显示效果
-->
