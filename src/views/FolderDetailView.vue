<!-- 
  FolderDetailView.vue - 收藏夹详情页面组件
  负责展示和管理收藏夹中的链接，包括添加、编辑、删除和查看链接
-->

<template>
  <!-- 收藏夹详情容器 -->
  <div class="folder-detail-container">
    <!-- 页面头部 -->
    <div class="folder-header">
      <!-- 返回按钮 -->
      <el-button @click="goBackToFolders()" class="back-button">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <!-- 收藏夹标题 -->
      <h2 class="folder-title">{{ folder?.name }}</h2>
      <!-- 添加链接按钮 -->
      <el-button type="primary" @click="showDialog()" class="add-button">
        <el-icon><Plus /></el-icon>
        添加链接
      </el-button>
    </div>

    <!-- 收藏夹描述 -->
    <p class="folder-description">
      {{ folder?.description || '暂无描述' }}
    </p>

    <!-- 链接列表容器 -->
    <div class="links-container">
      <!-- 链接表格 -->
      <el-table
        :data="links"
        style="width: 100%"
        :empty-text="'暂无链接'"
        class="links-table"
      >
        <!-- 标题列 -->
        <el-table-column prop="title" label="标题" min-width="200">
          <template #default="{ row }">
            <div class="link-title-container">
              <el-icon><Link /></el-icon>
              <a :href="row.url" target="_blank" class="link-title">
                {{ row.title }}
              </a>
            </div>
          </template>
        </el-table-column>
        
        <!-- 链接列 -->
        <el-table-column prop="url" label="链接" min-width="250">
          <template #default="{ row }">
            <a :href="row.url" target="_blank" class="link-url">
              {{ row.url }}
            </a>
          </template>
        </el-table-column>
        
        <!-- 摘要列 -->
        <el-table-column prop="note" label="摘要" min-width="300">
          <template #default="{ row }">
            <span class="link-note">{{ row.note || '-' }}</span>
          </template>
        </el-table-column>
        
        <!-- 操作列 -->
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <div class="link-actions">
              <!-- 编辑按钮 -->
              <el-button
                type="primary"
                link
                @click="showDialog(row)"
                class="edit-button"
              >
                编辑
              </el-button>
              <!-- 删除按钮 -->
              <el-button
                type="danger"
                link
                @click="confirmDelete(row)"
                class="delete-button"
              >
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 添加/编辑链接对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingLink ? '编辑链接' : '添加链接'"
      width="50%"
      :max-width="600"
      class="link-dialog"
      destroy-on-close
    >
      <!-- 表单 -->
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        class="link-form"
      >
        <!-- 链接输入框 -->
        <el-form-item label="链接" prop="url">
          <div class="url-input-container">
            <el-input 
              v-model="form.url" 
              placeholder="请输入链接地址 (可选)"
              :prefix-icon="Link"
              class="url-input"
            />
          </div>
        </el-form-item>
        <!-- 标题输入框 -->
        <el-form-item label="标题" prop="title">
          <el-input 
            v-model="form.title" 
            placeholder="请输入链接标题"
            :prefix-icon="Document"
            class="form-input"
          />
        </el-form-item>
        <!-- 摘要输入框 -->
        <el-form-item label="摘要" prop="note">
          <el-input
            v-model="form.note"
            type="textarea"
            :rows="8"
            placeholder="请输入摘要"
            class="form-input textarea-input"
          />
        </el-form-item>
      </el-form>
      <!-- 对话框底部按钮 -->
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="loading">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
// 导入必要的 Vue 组件和工具
import { ref, reactive, onMounted } from 'vue'        // Vue 的组合式 API
import { useRoute, useRouter } from 'vue-router'     // 路由实例
import axios from 'axios'                            // HTTP 请求库
import { ElMessage, ElMessageBox } from 'element-plus'  // Element Plus UI 组件
import { ArrowLeft, Plus, Link, Document, Loading } from '@element-plus/icons-vue'  // Element Plus 图标
import apiClient from '@/utils/api'; 
// 初始化路由
const route = useRoute()                             // 获取当前路由信息
const router = useRouter()                           // 获取路由实例

// 状态管理
const folder = ref(null)                             // 当前收藏夹信息
const links = ref([])                                // 链接列表
const dialogVisible = ref(false)                     // 对话框显示状态
const editingLink = ref(null)                        // 当前编辑的链接
const loading = ref(false)                           // 加载状态
const isSubmitting = ref(false)                      // 提交状态标志，防止重复提交
const formRef = ref(null)                            // 表单引用

// 表单数据
const form = reactive({
  title: '',                                         // 链接标题
  url: '',                                           // 链接地址
  note: ''                                           // 链接备注
})

// 表单验证规则
const rules = {
  title: [
    { required: true, message: '请输入链接标题', trigger: 'blur' },  // 必填验证
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }  // 长度验证
  ],
  url: [
    // URL不再是必填项, 但如果填写，必须是有效的URL
    { type: 'url', message: '请输入有效的链接地址或留空', trigger: ['blur', 'change'] }
  ],
  note: [
    { validator: (rule, value, callback) => {
        // 如果URL为空，则备注不能为空
        if (!form.url && !value) {
          callback(new Error('请输入摘要内容，或提供一个链接地址'));
        }
        // 如果URL不为空，备注可以为空
        else if (form.url && !value) {
          callback();
        }
        // 如果URL为空，且备注不为空
        else if (!form.url && value) {
           callback();
        }
        // 如果都有值
        else {
          callback();
        }
      },
      trigger: ['blur', 'change']
    }
  ]
}

// 从文本中提取URL的函数
const extractUrlFromText = (text) => {
  if (!text) return '';
  
  // 匹配URL的正则表达式
  const urlRegex = /(https?:\/\/[^\s\"\'\)\]\}]+)/g;
  const matches = text.match(urlRegex);
  
  if (matches && matches.length > 0) {
    return matches[0]; // 返回第一个匹配到的URL
  }
  
  return text; // 如果没有找到URL，返回原始文本
}

// 获取收藏夹详情
const fetchFolder = async () => {
  try {
    console.log('Fetching folder details...');       // 调试日志
   const response = await apiClient.get(`/api/folders/${route.params.id}`);
    console.log('Folder response:', response.data);  // 调试日志
    folder.value = response.data;                    // 更新收藏夹信息
  }catch (error) {
      console.error('Error:', error);
      if (error.response?.status === 401) {
        ElMessage.error('会话已过期，请重新登录');
        router.push('/login'); // 跳转到登录页面
      } else {
        ElMessage.error(error.response?.data?.message || '操作失败');
      }
    }
};

// 获取链接列表
const fetchLinks = async () => {
  try {
    console.log('Fetching links...');                // 调试日志
    const response = await apiClient.get(`/api/links/${route.params.id}`);
    console.log('Links response:', response.data);   // 调试日志
    links.value = response.data;                     // 更新链接列表
  } catch (error) {
      console.error('Error:', error);
      if (error.response?.status === 401) {
        ElMessage.error('会话已过期，请重新登录');
        router.push('/login'); // 跳转到登录页面
      } else {
        ElMessage.error(error.response?.data?.message || '操作失败');
      }
    }
};

// 显示对话框
const showDialog = (link = null) => {
  editingLink.value = link                           // 设置当前编辑的链接
  if (link) {
    form.title = link.title                          // 填充表单数据
    form.url = link.url
    form.note = link.note
  } else {
    form.title = ''                                  // 清空表单数据
    form.url = ''
    form.note = ''
  }
  dialogVisible.value = true                         // 显示对话框
}

// 处理表单提交
const handleSubmit = async () => {
  // 如果表单引用不存在或已经在提交过程中，直接返回
  if (!formRef.value || isSubmitting.value) return;
  
  try {
    // 验证表单
    const valid = await formRef.value.validate().catch(() => false);
    if (!valid) return;  // 验证失败，不继续提交
    
    // 设置状态，防止重复提交
    isSubmitting.value = true;
    loading.value = true;
    
    // 保存当前编辑状态，避免异步操作过程中状态变化
    const isEditing = !!editingLink.value;
    const linkId = isEditing ? editingLink.value._id : null;
    
    // 创建提交数据的副本并处理URL
    const formData = { 
      title: form.title, 
      url: extractUrlFromText(form.url), // 自动提取URL
      note: form.note 
    };
    
    // 如果URL存在但格式不正确，显示提示并终止提交
    // 使用更完善的URL正则表达式
    const urlPattern = /^(https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*))?$/;
    if (formData.url && !urlPattern.test(formData.url)) {
      ElMessage.warning('您输入的URL格式不正确，请检查或留空');
      isSubmitting.value = false;
      loading.value = false;
      return;
    }

    // 如果URL为空，但备注也为空（根据新的校验规则，这不应该发生，但作为双重检查）
    if (!formData.url && !formData.note) {
      ElMessage.warning('请输入链接地址或填写摘要内容');
      isSubmitting.value = false;
      loading.value = false;
      return;
    }
    
    // 替换 axios 调用为 apiClient
    if (isEditing) {
        await apiClient.put(`/api/links/${linkId}`, formData);
        ElMessage.success('更新成功');
        } else {
        await apiClient.post('/api/links', {
          ...formData,
          folderId: route.params.id
        });
        ElMessage.success('添加成功');
      }
    // 关闭对话框并刷新链接列表
    dialogVisible.value = false;
    fetchLinks();
  } catch (error) {
    console.error('Error submitting link:', error);
    ElMessage.error(error.response?.data?.message || '操作失败');
  } finally {
      // 延迟重置状态，防止按钮闪烁
      setTimeout(() => {
        loading.value = false;
        isSubmitting.value = false;
      }, 500);
    }
};

// 确认删除链接
const confirmDelete = (link) => {
  ElMessageBox.confirm(
    '确定要删除这个链接吗？',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await apiClient.delete(`/api/links/${link._id}`);
      ElMessage.success('删除成功');                 // 成功提示
      // 从本地数据中移除已删除的链接
      links.value = links.value.filter((l) => l._id !== link._id);                              // 刷新链接列表
    } catch (error) {
      console.error('Error deleting link:', error);  // 错误日志
      ElMessage.error(error.response?.data?.message || '删除失败');  // 错误提示
    }
  });
};

// 跳转到收藏夹详情页
const goToFolder = (folderId) => {
  router.push(`/folders/${folderId}`)                // 路由跳转
}

// 返回收藏夹列表
const goBackToFolders = () => {
  router.push('/folders')
}

// 组件挂载时获取数据
onMounted(() => {
  fetchFolder()                                      // 获取收藏夹详情
  fetchLinks()                                       // 获取链接列表
})
</script>

<style scoped>
/* 收藏夹详情容器样式 */
.folder-detail-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

/* 页面头部样式 */
.folder-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.folder-title {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

/* 收藏夹描述样式 */
.folder-description {
  margin: 0 0 20px;
  color: #606266;
  font-size: 14px;
}

/* 链接列表容器样式 */
.links-container {
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 链接表格样式 */
.links-table {
  margin-top: 20px;
}

/* 链接标题容器样式 */
.link-title-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 链接标题样式 */
.link-title {
  color: #409eff;
  text-decoration: none;
}

.link-title:hover {
  color: #66b1ff;
}

/* 链接地址样式 */
.link-url {
  color: #606266;
  text-decoration: none;
  word-break: break-all;
}

.link-url:hover {
  color: #409eff;
}

/* 链接备注样式 */
.link-note {
  color: #909399;
  display: block;
  max-height: 60px;
  overflow-y: auto;
  text-overflow: ellipsis;
  line-height: 1.5;
  word-break: break-word;
}

/* 操作按钮组样式 */
.link-actions {
  display: flex;
  gap: 10px;
}

/* 链接对话框样式 */
.link-dialog {
  display: flex;
  justify-content: center;
}

.link-dialog :deep(.el-dialog__body) {
  padding: 20px 30px;
}

.link-form {
  width: 100%;
}

.form-input,
.url-input {
  width: 100% !important;
  box-sizing: border-box !important;
}

.link-form :deep(.el-textarea__inner),
.link-form :deep(.el-input__inner),
.url-input :deep(.el-input__inner) {
  width: 100% !important;
  box-sizing: border-box !important;
}

/* 设置第一个和第二个输入框的高度 */
.link-form :deep(.el-input__inner),
.url-input :deep(.el-input__inner) {
  height: 50px !important; /* 链接和标题输入框高度 */
}

/* 设置摘要输入框高度 */
.textarea-input :deep(.el-textarea__inner) {
  min-height: 200px !important; /* 摘要输入框高度 */
}

/* URL输入容器 */
.url-input-container {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.url-input {
  width: 100% !important;
}

.url-analyzing {
  position: absolute;
  right: 10px;
  color: #409eff;
  font-size: 18px;
  z-index: 10;
}

.url-helper-text {
  font-size: 12px;
  color: #409eff;
  margin-top: 5px;
}

.url-helper-tips {
  font-size: 12px;
  margin-top: 5px;
  color: #909399;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .folder-detail-container {
    padding: 15px;
  }
  
  .folder-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .folder-title {
    font-size: 20px;
  }
  
  .add-button {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .folder-detail-container {
    padding: 10px;
  }
  
  .links-table {
    margin-top: 15px;
  }
}
</style>

<!-- 
  使用指南：
  1. 这个文件实现了收藏夹详情页面
  2. 主要功能：
     - 展示收藏夹信息
     - 展示链接列表
     - 添加新链接
     - 编辑链接
     - 删除链接
  3. 关键点：
     - 使用 Element Plus 组件库
     - 实现表格展示
     - 处理表单验证
     - 管理链接状态
  4. 注意事项：
     - 确保表单验证规则合理
     - 处理各种错误情况
     - 保持界面简洁易用
     - 考虑不同设备的显示效果
--> 