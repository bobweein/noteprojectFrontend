<!-- 
  LoginView.vue - 登录页面组件
  负责用户登录功能，包括表单验证和登录状态管理
-->

<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <div class="card-header">
          <h2>登录</h2>
        </div>
      </template>
      
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="handleLogin"
      >
        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="form.email"
            placeholder="请输入邮箱"
            :prefix-icon="User"
          />
        </el-form-item>
        
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            native-type="submit"
            :loading="loading"
            class="login-button"
          >
            登录
          </el-button>
        </el-form-item>
        
        <div class="form-links">
          <div class="register-link">
            还没有账号？
            <router-link to="/register">立即注册</router-link>
          </div>
          <div class="forgot-password-link">
            <router-link to="/forgot-password">忘记密码？</router-link>
          </div>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
// 导入必要的 Vue 组件和工具
import { ref, reactive } from 'vue'                  // Vue 的组合式 API
import { useRouter, useRoute } from 'vue-router'       // 路由实例
import { useUserStore } from '@/stores/user'         // 用户状态管理
import { User, Lock } from '@element-plus/icons-vue'  // Element Plus 图标
import { ElMessage } from 'element-plus'             // Element Plus UI 组件

// 初始化路由和用户状态
const router = useRouter()                           // 获取路由实例
const route = useRoute()                            // 获取路由实例
const userStore = useUserStore()                     // 获取用户状态管理实例

// 表单引用和加载状态
const formRef = ref(null)                            // 表单引用
const loading = ref(false)                           // 加载状态标志

// 表单数据
const form = reactive({
  email: '',
  password: ''
})

// 表单验证规则
const rules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
  ]
}

// 处理表单提交
const handleLogin = async () => {
  if (!formRef.value) return                         // 确保表单引用存在
  
  try {
    await formRef.value.validate()                   // 验证表单
    loading.value = true                             // 开始加载
    
    const result = await userStore.login({           // 调用登录方法
      email: form.email,
      password: form.password
    })
    
    if (result.success) {
      ElMessage.success('登录成功')                   // 显示成功消息
      const redirect = route.query.redirect || '/folders'  // 获取重定向路径
      await router.push(redirect)                    // 跳转到重定向路径
    } else {
      ElMessage.error(result.error || '登录失败')     // 显示错误消息
    }
  } catch (error) {
    console.error('Login error:', error)             // 记录错误
    ElMessage.error(error.message || '登录失败')      // 显示错误消息
  } finally {
    loading.value = false                            // 结束加载
  }
}
</script>

<style scoped>
/* 登录容器样式 */
.login-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background-color: #f5f7fa;
}

/* 登录卡片样式 */
.login-card {
  width: 100%;
  max-width: 400px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.card-header {
  text-align: center;
}

.card-header h2 {
  margin: 0;
  color: #303133;
}

/* 登录按钮样式 */
.login-button {
  width: 100%;
  margin-top: 10px;
}

/* 注册链接样式 */
.register-link {
  text-align: center;
  margin-top: 20px;
  color: #606266;
}

.form-links {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
  font-size: 14px;
}

.register-link a,
.forgot-password-link a {
  color: #409eff;
  text-decoration: none;
}

.register-link a:hover,
.forgot-password-link a:hover {
  text-decoration: underline;
}

/* 使忘记密码链接靠右 */
.forgot-password-link {
  text-align: right;
}

/* 响应式设计：平板设备 */
@media (max-width: 768px) {
  .login-card {
    max-width: 350px;
  }
}

/* 响应式设计：手机设备 */
@media (max-width: 480px) {
  .login-container {
    padding: 10px;
  }
  
  .login-card {
    max-width: 100%;
  }
  
  .card-header h2 {
    font-size: 20px;
  }
}
</style>

<!-- 
  使用指南：
  1. 这个文件实现了用户登录功能
  2. 主要功能：
     - 用户登录表单
     - 表单验证
     - 登录状态管理
     - 响应式设计
  3. 关键点：
     - 使用 Element Plus 表单组件
     - 实现表单验证规则
     - 处理登录状态和错误
     - 提供友好的用户界面
  4. 注意事项：
     - 确保表单验证规则合理
     - 处理各种错误情况
     - 保持界面简洁易用
     - 考虑不同设备的显示效果
--> 