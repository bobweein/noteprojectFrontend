// 路由配置文件
// 负责定义应用的路由结构和路由守卫

import { createRouter, createWebHistory } from 'vue-router'  // Vue Router 相关函数
import { useUserStore } from '@/stores/user'                 // 用户状态管理

// 创建路由实例
const router = createRouter({
  // 使用 HTML5 History 模式
  history: createWebHistory(import.meta.env.BASE_URL),
  // 定义路由配置
  routes: [
    {
      path: '/',
      name: 'home',
      redirect: '/folders'
    },
    {
      path: '/login',                    // 登录页面路径
      name: 'login',                     // 路由名称
      component: () => import('@/views/LoginView.vue'),  // 懒加载登录组件
      meta: { requiresAuth: false }      // 不需要认证
    },
    {
      path: '/register',                 // 注册页面路径
      name: 'register',                  // 路由名称
      component: () => import('@/views/RegisterView.vue'),  // 懒加载注册组件
      meta: { requiresAuth: false }      // 不需要认证
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('@/views/ForgotPassword.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/reset-password/:token',
      name: 'reset-password',
      component: () => import('@/views/ResetPassword.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/folders',                   // 首页路径
      name: 'folders',                   // 路由名称
      component: () => import('@/views/FoldersView.vue'),  // 懒加载收藏夹列表组件
      meta: { requiresAuth: true }       // 需要认证
    },
    {
      path: '/folders/:id',               // 收藏夹详情页面路径
      name: 'folder-detail',             // 路由名称
      component: () => import('@/views/FolderDetailView.vue'),  // 懒加载收藏夹详情组件
      meta: { requiresAuth: true }       // 需要认证
    }
  ]
})

// 全局路由守卫
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()       // 获取用户状态管理实例
  const token = localStorage.getItem('token')  // 获取本地存储的 token
  
  // 如果访问的是登录或注册页面
  if (!to.meta.requiresAuth) {
    // 如果用户已登录，重定向到收藏夹页面
    if (userStore.isAuthenticated) {
      next({ name: 'folders' })
    } else {
      next()
    }
    return
  }

  // 如果需要认证的页面
  if (to.meta.requiresAuth) {
    // 如果用户已登录，直接通过
    if (userStore.isAuthenticated) {
      next()
      return
    }

    // 如果有 token 但没有用户信息，尝试恢复状态
    if (token && !userStore.user) {
      try {
        await userStore.initializeFromToken(token)  // 尝试用 token 初始化用户状态
        next()
        return
      } catch (error) {
        console.error('Failed to initialize user state:', error)
        // 只有在明确的认证错误时才清除状态
        if (error.response?.status === 401) {
          userStore.logout()
        }
      }
    }

    // 如果没有 token 或初始化失败，重定向到登录页
    next({ name: 'login' })
  }
})

export default router

/* 
  使用指南：
  1. 这个文件负责管理应用的所有路由和导航守卫
  2. 主要功能：
     - 定义路由结构
     - 实现路由懒加载
     - 处理路由权限
     - 管理页面跳转
  3. 关键点：
     - 使用懒加载优化性能
     - 实现路由守卫保护需要认证的页面
     - 处理 token 验证和状态恢复
     - 管理登录状态和页面重定向
  4. 注意事项：
     - 确保路由路径正确
     - 合理使用懒加载
     - 正确处理认证状态
     - 注意路由守卫的执行顺序
*/
