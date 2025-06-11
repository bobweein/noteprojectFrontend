<template>
  <div class="reset-password-container">
    <el-card class="reset-password-card">
      <template #header>
        <div class="card-header">
          <span>重置密码</span>
        </div>
      </template>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="handleSubmit"
      >
        <el-form-item label="新密码" prop="password">
          <el-input
            type="password"
            v-model="form.password"
            placeholder="请输入新密码"
            :prefix-icon="Lock"
            show-password
            clearable
          />
        </el-form-item>
        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input
            type="password"
            v-model="form.confirmPassword"
            placeholder="请再次输入新密码"
            :prefix-icon="Lock"
            show-password
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
            重置密码
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import axios from 'axios';
import { Lock } from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();
const formRef = ref(null);
const loading = ref(false);
const token = ref('');

const form = reactive({
  password: '',
  confirmPassword: '',
});

const validateConfirmPassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入新密码'));
  } else if (value !== form.password) {
    callback(new Error('两次输入的密码不一致'));
  } else {
    callback();
  }
};

const rules = {
  password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少为6个字符', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, validator: validateConfirmPassword, trigger: 'blur' },
  ],
};

onMounted(() => {
  token.value = route.params.token;
  if (!token.value) {
    ElMessage.error('无效的重置链接。');
    router.push('/login');
  }
});

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        const response = await axios.post(`/api/users/reset-password/${token.value}`, {
          password: form.password,
        });
        ElMessage.success(response.data.message || '密码已成功重置。');
        router.push('/login');
      } catch (error) {
        console.error('Reset password error:', error);
        ElMessage.error(error.response?.data?.message || '密码重置失败，链接可能已过期或无效。');
      } finally {
        loading.value = false;
      }
    }
  });
};
</script>

<style scoped>
.reset-password-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 120px); /* Adjust based on header/footer height */
  background-color: #f0f2f5;
  padding: 20px;
}

.reset-password-card {
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
</style>
