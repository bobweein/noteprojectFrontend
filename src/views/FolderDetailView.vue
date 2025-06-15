<template>
  <!-- 收藏夹详情容器 1-->
  <div class="folder-detail-container">
    <!-- 页面头部 -->
    <div class="folder-header">
      <h2 class="folder-title">{{ folderStore.selectedFolder?.name }}</h2>
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
        :data="folderStore.currentFolderLinks" <!-- 这里是修改点 -->
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
import { ref, reactive, onMounted, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Link, Document } from '@element-plus/icons-vue';
import { useFolderStore } from '@/stores/folder';

const props = defineProps({
  folderId: {
    type: String,
    required: true
  }
});

const folderStore = useFolderStore();

const dialogVisible = ref(false);
const editingLink = ref(null);
const loading = ref(false);
const isSubmitting = ref(false);
const formRef = ref(null);

const form = reactive({
  title: '',
  url: '',
  note: ''
});

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

const extractUrlFromText = (text) => {
  if (!text) return '';
  const urlRegex = /(https?:\/\/[^\s\"\'\)\]\}]+)/g;
  const matches = text.match(urlRegex);
  return matches && matches.length > 0 ? matches[0] : text;
};

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
      result = await folderStore.addLink(formData); // addLink now takes only linkData
    }

    if (result.success) {
      dialogVisible.value = false;
    }
  } catch (error) {
    console.error('Error submitting link:', error);
  } finally {
    setTimeout(() => {
      loading.value = false;
      isSubmitting.value = false;
    }, 500);
  }
};

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
      // Links are automatically updated by the store
    }
  }).catch(() => {
    // User cancelled deletion
  });
};

watch(() => props.folderId, (newFolderId) => {
  if (newFolderId) {
    folderStore.fetchLinksByFolder(newFolderId);
  } else {
    // If no folder is selected, ensure currentFolderLinks is empty
    // This is handled by the getter, but you might want to explicitly clear cache if needed
  }
}, { immediate: true });

onMounted(() => {
  // fetchLinksByFolder is handled by the watch effect with immediate: true
});
</script>

<style scoped>
/* ... (your existing styles) ... */
.folder-detail-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

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

.folder-description {
  margin: 0 0 20px;
  color: #606266;
  font-size: 14px;
}

.links-container {
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.links-table {
  margin-top: 20px;
}

.link-title-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.link-title {
  color: #409eff;
  text-decoration: none;
}

.link-title:hover {
  color: #66b1ff;
}

.link-url {
  color: #606266;
  text-decoration: none;
  word-break: break-all;
}

.link-url:hover {
  color: #409eff;
}

.link-note {
  color: #909399;
  display: block;
  max-height: 60px;
  overflow-y: auto;
  text-overflow: ellipsis;
  line-height: 1.5;
  word-break: break-word;
}

.link-actions {
  display: flex;
  gap: 10px;
}

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

.link-form :deep(.el-input__inner),
.url-input :deep(.el-input__inner) {
  height: 50px !important;
}

.textarea-input :deep(.el-textarea__inner) {
  min-height: 200px !important;
}

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
