// src/stores/user.js
// 用户状态管理模块：使用 Pinia 管理用户登录、注册、认证状态

import { defineStore } from 'pinia'
import apiClient from '@/utils/api'  // 使用封装后的 axios 实例（带 token、拦截器）

export const useUserStore = defineStore('user', {
  // 状态
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || null
  }),

  // 计算属性
  getters: {
    isAuthenticated: (state) => !!state.token,
    currentUser: (state) => state.user
  },

  // 操作方法
  actions: {
    // 登录
    async login(credentials) {
      try {
        const response = await apiClient.post('/api/users/login', credentials)
        const { token, user } = response.data
        this.token = token
        this.user = user
        localStorage.setItem('token', token)
        return { success: true }
      } catch (error) {
        console.error('登录失败:', error)
        return {
          success: false,
          error: error.response?.data?.message || '登录失败，请检查用户名和密码'
        }
      }
    },

    // 注册
    async register(userData) {
      try {
        const response = await apiClient.post('/api/users/register', userData)
        const { token, user } = response.data
        this.token = token
        this.user = user
        localStorage.setItem('token', token)
        return { success: true }
      } catch (error) {
        console.error('注册失败:', error)
        return {
          success: false,
          error: error.response?.data?.message || '注册失败，请稍后重试'
        }
      }
    },

    // 获取用户信息
    async fetchUser() {
      try {
        const response = await apiClient.get('/api/users/profile')
        this.user = response.data
        return { success: true }
      } catch (error) {
        console.error('获取用户信息失败:', error)
        if (error.response?.status === 401) {
          this.logout()
        }
        return { success: false }
      }
    },

    // 用 token 初始化状态（用于页面刷新后保持登录）
    async initializeFromToken(token) {
      try {
        this.token = token
        const response = await apiClient.get('/api/users/profile')
        this.user = response.data
        return { success: true }
      } catch (error) {
        console.error('Token 初始化失败:', error)
        if (error.response?.status === 401) {
          this.logout()
        }
        throw error
      }
    },
    
    // 登出
    logout() {
      this.user = null
      this.token = null
      localStorage.removeItem('token')
    }
  }
})