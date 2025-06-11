<!-- 
  RegisterView.vue - 注册页面组件
  负责用户注册功能，包括表单验证和注册状态管理
-->

<template>
  <div class="register-container">
    <el-card class="register-card">
      <template #header>
        <div class="card-header">
          <h2>注册</h2>
        </div>
      </template>
      
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="handleRegister"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入用户名"
            :prefix-icon="User"
          />
        </el-form-item>
        
        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="form.email"
            placeholder="请输入邮箱"
            :prefix-icon="Message"
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
        
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            native-type="submit"
            :loading="loading"
            class="register-button"
          >
            注册
          </el-button>
        </el-form-item>
        
        <div class="login-link">
          已有账号？
          <router-link to="/login">立即登录</router-link>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
// 导入必要的 Vue 组件和工具
import { ref, reactive } from 'vue'                  // Vue 的组合式 API
import { useRouter } from 'vue-router'               // 路由实例
import { useUserStore } from '@/stores/user'         // 用户状态管理
import { User, Message, Lock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'             // Element Plus UI 组件

// 初始化路由和用户状态
const router = useRouter()                           // 获取路由实例
const userStore = useUserStore()                     // 获取用户状态管理实例

// 表单引用和加载状态
const formRef = ref(null)                            // 表单引用
const loading = ref(false)                           // 加载状态标志

// 表单数据
const form = reactive({
  username: '',                                      // 用户名
  email: '',                                         // 邮箱
  password: '',                                      // 密码
  confirmPassword: ''                                // 确认密码
})

const validatePass = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请输入密码'))
  } else {
    if (form.confirmPassword !== '') {
      formRef.value?.validateField('confirmPassword')
    }
    callback()
  }
}

const validatePass2 = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== form.password) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

// 表单验证规则
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },  // 必填验证
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }  // 长度验证
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },    // 必填验证
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }  // 邮箱格式验证
  ],
  password: [
    { required: true, validator: validatePass, trigger: 'blur' },    // 必填验证
    { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }  // 长度验证
  ],
  confirmPassword: [
    { required: true, validator: validatePass2, trigger: 'blur' }
  ]
}

// 处理表单提交
const handleRegister = async () => {
  if (!formRef.value) return                         // 确保表单引用存在
  
  try {
    await formRef.value.validate()                   // 验证表单
    loading.value = true                             // 开始加载
    
    const result = await userStore.register({        // 调用注册方法
      username: form.username,
      email: form.email,
      password: form.password
    })
    
    if (result.success) {                            // 注册成功
      ElMessage.success('注册成功')                  // 显示成功消息
      router.push('/login')                               // 跳转到登录页面
    } else {
      ElMessage.error(result.error || '注册失败')    // 显示错误消息
    }
  } catch (error) {
    console.error('Register error:', error)          // 记录错误
    ElMessage.error('表单验证失败')                  // 显示错误消息
  } finally {
    loading.value = false                            // 结束加载
  }
}
</script>

<style scoped>
/* 注册容器样式 */
.register-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background-color: #f5f7fa;
}

/* 注册卡片样式 */
.register-card {
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

.register-button {
  width: 100%;
  margin-top: 10px;
}

.login-link {
  text-align: center;
  margin-top: 20px;
  color: #606266;
}

.login-link a {
  color: #409eff;
  text-decoration: none;
}

.login-link a:hover {
  color: #66b1ff;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .register-container {
    padding: 10px;
  }

  .register-card {
    max-width: 100%;
  }

  .card-header h2 {
    font-size: 20px;
  }
}
</style>

<!-- 
  使用指南：
  1. 这个文件实现了用户注册功能
  2. 主要功能：
     - 用户注册表单
     - 表单验证
     - 注册状态管理
     - 响应式设计
  3. 关键点：
     - 使用 Element Plus 表单组件
     - 实现表单验证规则
     - 处理注册状态和错误
     - 提供友好的用户界面
  4. 注意事项：
     - 确保表单验证规则合理
     - 处理各种错误情况
     - 保持界面简洁易用
     - 考虑不同设备的显示效果
--> 