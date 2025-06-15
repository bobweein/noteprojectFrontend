<template>
  <!-- 收藏夹详情容器 -->
  <div class="folder-detail-container">
    <!-- 页面头部 -->
    <div class="folder-header">
      <!-- 返回按钮 (现在不再需要返回到 /folders，因为始终在主布局中) -->
      <!-- <el-button @click="goBackToFolders()" class="back-button">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button> -->
      <!-- 收藏夹标题 -->
      <h2 class="folder-title">{{ folderStore.selectedFolder?.name }}</h2>
      <!-- 添加链接按钮 -->
      <el-button type="primary" @click="showDialog()" class="add-button">
        <el-icon><Plus /></el-icon>
        添加链接
      </el-button>
    </div>

    <!-- 收藏夹描述 -->
    <p class="folder-description">
      {{ folderStore.selectedFolder?.description || '暂无描述' }}
    </p>

    <!-- 链接列表容器 -->
    <div class="links-container">
      <!-- 链接表格 -->
      <el-table
        :data="folderStore.links"
        style="width: 100%"
        :empty-text="'暂无链接'"
        class="links-table"
        v-loading="folderStore.loadingLinks"
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
import { ref, reactive, onMounted, watch } from 'vue'        // Vue 的组合式 API
import { useRoute, useRouter } from 'vue-router'     // 路由实例
import { ElMessage, ElMessageBox } from 'element-plus'  // Element Plus UI 组件
import { Plus, Link, Document } from '@element-plus/icons-vue'  // Element Plus 图标
import { useFolderStore } from '@/stores/folder'; // 导入 Pinia Store

// 定义 props，接收 folderId
const props = defineProps({
  folderId: {
    type: String,
    required: true
  }
});

// 初始化路由 (虽然不再直接使用 route.params.id，但保留 useRoute 以防万一)
const route = useRoute();
const router = useRouter();

// 获取 Store 实例
const folderStore = useFolderStore();

// 状态管理
// const folder = ref(null); // 不再需要，从 store 获取
// const links = ref([]); // 不再需要，从 store 获取
const dialogVisible = ref(false);
const editingLink = ref(null);
const loading = ref(false); // 用于表单提交的加载状态
const isSubmitting = ref(false); // 提交状态标志，防止重复提交
const formRef = ref(null);

// 表单数据
const form = reactive({
  title: '',
  url: '',
  note: ''
});

// 表单验证规则
const rules = {
  title: [
    { required: true, message: '请输入链接标题', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  url: [
    { type: 'url', message: '请输入有效的链接地址或留空', trigger: ['blur', 'change'] }
  ],
  note: [
    { validator: (rule, value, callback) => {
        if (!form.url && !value) {
          callback(new Error('请输入摘要内容，或提供一个链接地址'));
        } else {
          callback();
        }
      },
      trigger: ['blur', 'change']
    }
  ]
};

// 从文本中提取URL的函数
const extractUrlFromText = (text) => {
  if (!text) return '';
  const urlRegex = /(https?:\/\/[^\s\"\'\)\]\}]+)/g;
  const matches = text.match(urlRegex);
  return matches && matches.length > 0 ? matches[0] : text;
};

// 移除 fetchFolder，因为 folder 信息从 store 获取
// const fetchFolder = async () => { ... };

// 移除 fetchLinks，因为链接获取逻辑已移到 store
// const fetchLinks = async () => { ... };

// 显示对话框
const showDialog = (link = null) => {
  editingLink.value = link;
  if (link) {
    form.title = link.title;
    form.url = link.url;
    form.note = link.note;
  } else {
    form.title = '';
    form.url = '';
    form.note = '';
  }
  dialogVisible.value = true;
};

// 处理表单提交
const handleSubmit = async () => {
  if (!formRef.value || isSubmitting.value) return;
  
  try {
    const valid = await formRef.value.validate().catch(() => false);
    if (!valid) return;
    
    isSubmitting.value = true;
    loading.value = true;
    
    const isEditing = !!editingLink.value;
    const linkId = isEditing ? editingLink.value._id : null;
    
    const formData = { 
      title: form.title, 
      url: extractUrlFromText(form.url),
      note: form.note 
    };
    
    const urlPattern = /^(https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*))?$/;
    if (formData.url && !urlPattern.test(formData.url)) {
      ElMessage.warning('您输入的URL格式不正确，请检查或留空');
      isSubmitting.value = false;
      loading.value = false;
      return;
    }

    if (!formData.url && !formData.note) {
      ElMessage.warning('请输入链接地址或填写摘要内容');
      isSubmitting.value = false;
      loading.value = false;
      return;
    }
    
    let result;
    if (isEditing) {
      result = await folderStore.updateLink(linkId, formData);
    } else {
      result = await folderStore.addLink(props.folderId, formData); // 使用 props.folderId
    }

    if (result.success) {
      dialogVisible.value = false;
      // 链接列表已在 store 中自动更新，无需手动 fetchLinks()
    }
  } catch (error) {
    console.error('Error submitting link:', error);
    // 错误信息已在 store 中处理
  } finally {
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
    const result = await folderStore.deleteLink(link._id);
    if (result.success) {
      // 链接列表已在 store 中自动更新
    }
  }).catch(() => {
    // 用户取消删除
  });
};

// 移除 goToFolder 和 goBackToFolders，因为导航逻辑已改变
// const goToFolder = (folderId) => { ... };
// const goBackToFolders = () => { ... };

// 监听 props.folderId 变化，当选中文件夹改变时，重新获取链接
watch(() => props.folderId, (newFolderId) => {
  if (newFolderId) {
    folderStore.fetchLinksByFolder(newFolderId);
  } else {
    folderStore.links = []; // 如果没有选中文件夹，清空链接
  }
}, { immediate: true }); // immediate: true 确保在组件挂载时也执行一次

// 组件挂载时，如果 folderId 存在，则获取链接
onMounted(() => {
  // fetchFolder() 不再需要
  // fetchLinks() 也不再需要，因为 watch 已经处理了
});
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