<script setup>
// filepath: src/App.vue
// 导入必要的 Vue 组件和工具
import { RouterLink, RouterView } from 'vue-router'  // 路由相关组件
import { computed, onMounted, ref, watch } from 'vue'       // Vue 的组合式 API
import { useRouter } from 'vue-router'               // 路由实例
import { useUserStore } from '@/stores/user'         // 用户状态管理
import { useFolderStore } from '@/stores/folder';    // 导入新的 Folder Store
import { ElMessage, ElLoading } from 'element-plus'  // Element Plus UI 组件
import { Loading } from '@element-plus/icons-vue'    // Element Plus 图标
import Sidebar from '@/components/Sidebar.vue'
import FolderDetailView from '@/views/FolderDetailView.vue'; // 导入 FolderDetailView

// 初始化路由和用户状态
const router = useRouter()                           // 获取路由实例
const userStore = useUserStore()                     // 获取用户状态管理实例
const folderStore = useFolderStore();                // 获取 Folder Store 实例
const isLoading = ref(true)                          // 加载状态标志

// 计算属性：获取当前用户和认证状态
const user = computed(() => userStore.currentUser)   // 当前登录用户
const isAuthenticated = computed(() => userStore.isAuthenticated)  // 是否已认证

// 处理用户登出
const handleLogout = () => {
  userStore.logout()                                 // 清除用户状态
  folderStore.$reset();                              // 清除 Folder Store 状态
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
        folderStore.$reset(); // 清除 Folder Store 状态
        // 如果当前不在登录页面，重定向到登录页
        if (router.currentRoute.value.name !== 'login') {
          router.push('/login')
        }
      }
    }
  }
  isLoading.value = false                           // 关闭加载状态
}

// 监听 selectedFolderId 变化，如果需要路由跳转（可选，但为了保持URL一致性）
watch(() => folderStore.selectedFolderId, (newId) => {
  if (newId && router.currentRoute.value.params.id !== newId) {
    router.replace(`/folders/${newId}`);
  } else if (!newId && router.currentRoute.value.path !== '/folders') {
    router.replace('/folders'); // 如果没有选中文件夹，回到 /folders 基础路径
  }
}, { immediate: true }); // immediate: true 确保在组件挂载时也执行一次

// 组件挂载时初始化用户状态
onMounted(() => {
  initializeUserState();
  // 尝试从路由参数中恢复选中状态（如果用户直接访问 /folders/:id）
  if (router.currentRoute.value.params.id) {
    folderStore.selectFolder(router.currentRoute.value.params.id);
  } else {
    // 如果没有指定ID，默认选中第一个文件夹（如果存在）
    if (folderStore.folders.length > 0) {
      folderStore.selectFolder(folderStore.folders[0]._id);
    }
  }
});
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
      <el-aside width="30%">
        <Sidebar />
      </el-aside>
      
      <el-main class="app-main">
        <!-- 根据 selectedFolderId 渲染 FolderDetailView 或提示信息 -->
        <FolderDetailView 
          v-if="folderStore.selectedFolderId" 
          :folderId="folderStore.selectedFolderId" 
        />
        <div v-else class="no-folder-selected">
          <p>请在左侧选择一个收藏夹，或点击“新建收藏夹”创建一个。</p>
        </div>
      </el-main>
    </el-container>
  </el-container>
  
  <!-- 未认证用户只显示登录/注册页面 -->
  <div v-else class="auth-container">
    <router-view />
  </div>
</template>

<style scoped>
/* ...existing styles... */

.app-loading {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 20px;
  color: #409eff;
}

.app-loading .el-icon {
  font-size: 40px;
  margin-bottom: 10px;
}

.app-container {
  height: 100vh;
}

.app-header {
  background-color: #409eff;
  color: #fff;
  display: flex;
  align-items: center;
  padding: 0 20px;
  height: 60px; /* 固定头部高度 */
}

.header-content {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.app-header h1 {
  margin: 0;
  font-size: 22px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-info span {
  font-size: 16px;
}

.user-info .el-button {
  color: #fff;
}

.main-container {
  height: calc(100vh - 60px); /* 减去头部高度 */
}

.el-aside {
  background-color: #fff;
  border-right: 1px solid var(--el-border-color-light);
  box-sizing: border-box;
  overflow-y: auto; /* 允许侧边栏内容滚动 */
}

.app-main {
  padding: 0px;
  background-color: #f0f2f5;
  overflow-y: auto; /* 允许主内容区域滚动 */
}

.auth-container {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f2f5;
}

.no-folder-selected {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #909399;
  font-size: 16px;
  text-align: center;
}
</style>