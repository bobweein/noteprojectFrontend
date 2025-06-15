<template>
  <!-- 收藏夹详情容器 -->
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

    <!-- 链接列表容器 - 替换 el-table -->
    <div class="links-list-container">
      <div v-if="folderStore.loadingLinks" class="loading-indicator">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>加载链接中...</span>
      </div>
      <div v-else-if="folderStore.currentFolderLinks.length === 0" class="empty-links">
        <p>暂无链接</p>
      </div>
      <div v-else class="links-list">
        <div 
          v-for="link in folderStore.currentFolderLinks" 
          :key="link._id" 
          class="link-item"
        >
          <div class="link-item-header">
            <div class="link-info">
              <div class="link-title-wrapper">
                <el-icon><Document /></el-icon>
                <span class="link-title-text">{{ link.title }}</span>
              </div>
              <a v-if="link.url" :href="link.url" target="_blank" class="link-url-text">
                <el-icon><Link /></el-icon>
                {{ link.url }}
              </a>
              <span v-else class="link-url-text no-url">无链接地址</span>
            </div>
            <div class="link-item-actions">
              <el-button 
                type="text" 
                size="small" 
                @click.stop="showDialog(link)"
                class="edit-button"
              >
                编辑
              </el-button>
              <el-button 
                type="text" 
                size="small" 
                @click.stop="confirmDelete(link)"
                class="delete-button"
              >
                删除
              </el-button>
              <el-button 
                link 
                @click="toggleLinkExpansion(link._id)" 
                class="expand-button"
                :title="expandedStates[link._id] ? '收起摘要' : '展开摘要'"
              >
                <el-icon>
                  <component :is="expandedStates[link._id] ? ArrowUp : ArrowDown" />
                </el-icon>
              </el-button>
            </div>
          </div>
          <div v-show="expandedStates[link._id]" class="link-item-note">
            <p>{{ link.note || '暂无摘要内容' }}</p>
          </div>
        </div>
      </div>
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
import { ref, reactive, onMounted, watch } from 'vue'; // 移除 nextTick
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Link, Document, ArrowDown, ArrowUp, Loading } from '@element-plus/icons-vue'; // 导入新图标
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
// const linkTableRef = ref(null); // 移除 el-table 的 ref

// 用于管理每个链接的展开状态
const expandedStates = reactive({});

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
      result = await folderStore.addLink(formData);
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
    if (!result.success) {
      ElMessage.error(result.message);
    }
  }).catch(() => {
    // 用户取消删除
  });
};

// 切换链接摘要的展开/收起状态
const toggleLinkExpansion = (linkId) => {
  expandedStates[linkId] = !expandedStates[linkId];
};

// 监听 props.folderId 变化，当选中文件夹改变时，重新获取链接
watch(() => props.folderId, async (newFolderId) => {
  if (newFolderId) {
    await folderStore.fetchLinksByFolder(newFolderId);
    // 重置所有链接的展开状态
    for (const key in expandedStates) {
      delete expandedStates[key];
    }
  }
}, { immediate: true });

// 移除对 loadingLinks 的监听和 doLayout 调用，因为不再使用 el-table
// watch(() => folderStore.loadingLinks, (newVal, oldVal) => {
//   if (oldVal === true && newVal === false) {
//     nextTick(() => {
//       if (linkTableRef.value) {
//         setTimeout(() => {
//           linkTableRef.value.doLayout();
//         }, 50);
//       }
//     });
//   }
// });

onMounted(() => {
  // 移除对 el-table 的 doLayout 调用
  // nextTick(() => {
  //   if (linkTableRef.value) {
  //     setTimeout(() => {
  //       linkTableRef.value.doLayout();
  //     }, 50);
  //   }
  // });
});
</script>

<style scoped>
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

/* 新增：链接列表容器样式 */
.links-list-container {
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 10px;
  max-height: calc(100vh - 250px); /* 固定高度，根据实际布局调整 */
  overflow-y: auto; /* 允许垂直滚动 */
}

.loading-indicator,
.empty-links {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 150px; /* 确保加载/空状态有足够高度 */
  color: #909399;
  font-size: 16px;
}

.loading-indicator .el-icon {
  font-size: 30px;
  margin-bottom: 10px;
}

.links-list {
  display: flex;
  flex-direction: column;
  gap: 10px; /* 链接项之间的间距 */
}

.link-item {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 10px 15px;
  background-color: #fdfdfd;
  transition: all 0.2s ease-in-out;
}

.link-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.link-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap; /* 允许换行 */
  gap: 10px;
}

.link-info {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0; /* 允许内容收缩 */
}

.link-title-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
  color: #303133;
  font-size: 16px;
  word-break: break-word; /* 允许长标题换行 */
}

.link-title-text {
  flex-grow: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap; /* 标题默认不换行 */
}

.link-url-text {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #409eff;
  text-decoration: none;
  font-size: 13px;
  word-break: break-all; /* 链接地址允许换行 */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap; /* 链接默认不换行 */
}

.link-url-text.no-url {
  color: #909399;
  font-style: italic;
}

.link-url-text:hover {
  text-decoration: underline;
}

.link-item-actions {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0; /* 防止按钮被压缩 */
}

.link-item-actions .el-button {
  padding: 0 5px;
  min-height: unset;
  height: auto;
  font-size: 14px;
}

.expand-button .el-icon {
  font-size: 18px;
  transition: transform 0.2s;
}

.link-item-note {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #ebeef5;
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap; /* 保留换行符和空格 */
  word-break: break-word; /* 允许长单词换行 */
}

/* 对话框和表单样式保持不变 */
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

  .links-list-container {
    max-height: calc(100vh - 200px); /* 调整小屏幕下的高度 */
  }

  .link-item-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .link-item-actions {
    width: 100%;
    justify-content: flex-end; /* 按钮靠右对齐 */
  }
}

@media (max-width: 480px) {
  .folder-detail-container {
    padding: 10px;
  }
}
</style>