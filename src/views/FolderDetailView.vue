<template>
  <!-- ... existing template code ... -->
  <div class="folder-detail-container">
    <!-- ... existing header and description ... -->

    <!-- 链接列表容器 -->
    <div class="links-container">
      <!-- 链接表格 -->
      <el-table
        :data="folderStore.currentFolderLinks"
        style="width: 100%"
        :empty-text="'暂无链接'"
        class="links-table"
        v-loading="folderStore.loadingLinks"
        ref="linkTableRef"
      >
        <!-- ... existing table columns ... -->
      </el-table>
    </div>

    <!-- ... existing dialog ... -->
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, nextTick } from 'vue';
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
const linkTableRef = ref(null); // 声明 el-table 的 ref

const form = reactive({
  title: '',
  url: '',
  note: ''
});

const rules = {
  title: [
    { required: true, message: '请输入链接标题', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ]
  // ... existing rules ...
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
    await formRef.value.validate();
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
      loading.value = false;
      isSubmitting.value = false;
      return;
    }

    if (!formData.url && !formData.note) {
      ElMessage.warning('请输入链接地址或填写摘要内容');
      loading.value = false;
      isSubmitting.value = false;
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
    // User cancelled deletion
  });
};

// 监听 props.folderId 变化，当选中文件夹改变时，重新获取链接
watch(() => props.folderId, async (newFolderId) => {
  if (newFolderId) {
    await folderStore.fetchLinksByFolder(newFolderId);
    // 这里的 doLayout 仍然保留，以防万一
    nextTick(() => {
      if (linkTableRef.value) {
        linkTableRef.value.doLayout();
      }
    });
  }
}, { immediate: true });

// 新增：监听 loadingLinks 状态，在加载完成后强制 el-table 重新布局
watch(() => folderStore.loadingLinks, (newVal, oldVal) => {
  if (oldVal === true && newVal === false) { // 从加载中变为加载完成
    nextTick(() => {
      if (linkTableRef.value) {
        linkTableRef.value.doLayout();
      }
    });
  }
});

onMounted(() => {
  // 在组件挂载时，如果表格已经存在，也强制进行一次布局
  nextTick(() => {
    if (linkTableRef.value) {
      linkTableRef.value.doLayout();
    }
  });
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