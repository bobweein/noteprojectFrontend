<template>
  <div class="forgot-password-container">
    <el-card class="forgot-password-card">
      <template #header>
        <div class="card-header">
          <span>忘记密码</span>
        </div>
      </template>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="handleSubmit"
      >
        <el-form-item label="邮箱地址" prop="email">
          <el-input
            v-model="form.email"
            placeholder="请输入注册时使用的邮箱地址"
            :prefix-icon="Message"
            clearable
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            @click="handleSubmit"
            :loading="loading"
            class="submit-button"
          >
            发送重置链接
          </el-button>
        </el-form-item>
      </el-form>
      <div class="login-link">
        <router-link to="/login">返回登录</router-link>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import axios from 'axios';
import { Message } from '@element-plus/icons-vue';

const formRef = ref(null);
const loading = ref(false);
const form = reactive({
  email: '',
});

const rules = {
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: ['blur', 'change'] },
  ],
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        const response = await axios.post('/api/users/forgot-password', { email: form.email });
        ElMessage.success(response.data.message || '如果邮箱存在，密码重置链接已发送。');
      } catch (error) {
        console.error('Forgot password error:', error);
        ElMessage.error(error.response?.data?.message || '请求失败，请稍后再试。');
      } finally {
        loading.value = false;
      }
    }
  });
};
</script>

<style scoped>
.forgot-password-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 120px); /* Adjust based on header/footer height */
  background-color: #f0f2f5;
  padding: 20px;
}

.forgot-password-card {
  width: 100%;
  max-width: 400px;
  border-radius: 8px;
}

.card-header {
  text-align: center;
  font-size: 20px;
  font-weight: bold;
}

.submit-button {
  width: 100%;
}

.login-link {
  margin-top: 15px;
  text-align: center;
}

.login-link a {
  color: #409eff;
  text-decoration: none;
}

.login-link a:hover {
  text-decoration: underline;
}
</style>
