<template>
  <div class="sidebar">
    <el-menu
      :default-active="folderStore.selectedFolderId"
      class="sidebar-menu"
      @select="handleFolderSelect"
      :collapse="false"
      :unique-opened="true"
      :loading="folderStore.loadingFolders"
    >
      <!-- 新的侧边栏头部，包含标题和操作按钮 -->
      <div class="sidebar-header">
        <el-icon><Folder /></el-icon>
        <span class="header-title">收藏夹</span>
        <div class="header-actions">
          <el-button link @click="showCreateFolderDialog" title="新建收藏夹">
            <el-icon><Plus /></el-icon>
          </el-button>
          <el-button link @click="folderStore.fetchAllFolders()" title="刷新列表">
            <el-icon><Refresh /></el-icon>
          </el-button>
        </div>
      </div>

      <el-divider class="menu-divider" />

      <!-- 循环渲染收藏夹列表 -->
      <el-menu-item 
        v-for="folder in folderStore.folders" 
        :key="folder._id" 
        :index="folder._id"
        class="folder-menu-item"
      >
        <el-icon><FolderOpened /></el-icon>
        <span class="folder-name-text">{{ folder.name }}</span>
        <div class="folder-item-actions">
          <el-button 
            type="text" 
            size="small" 
            @click.stop="showEditFolderDialog(folder)"
            class="edit-button"
          >
            <el-icon><Edit /></el-icon>
          </el-button>
          <el-button 
            type="text" 
            size="small" 
            @click.stop="confirmDeleteFolder(folder)"
            class="delete-button"
          >
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>
      </el-menu-item>
    </el-menu>

    <!-- 新建/编辑收藏夹对话框 (从 FoldersView.vue 迁移过来) -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingFolder ? '编辑收藏夹' : '新建收藏夹'"
      width="90%"
      :max-width="500"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent
      >
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入收藏夹名称" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            placeholder="请输入收藏夹描述"
          />
        </el-form-item>
      </el-form>
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
import { useRoute, useRouter } from 'vue-router';
import { useFolderStore } from '@/stores/folder'; // 导入 folder store
import { ElMessage, ElMessageBox } from 'element-plus';
import { Folder, Plus, Refresh, FolderOpened, Edit, Delete } from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();
const folderStore = useFolderStore(); // 使用 folder store

// 对话框状态 (从 FoldersView.vue 迁移过来)
const dialogVisible = ref(false);
const editingFolder = ref(null);
const loading = ref(false); // 用于对话框提交按钮
const formRef = ref(null);

const form = reactive({
  name: '',
  description: ''
});

const rules = {
  name: [
    { required: true, message: '请输入收藏夹名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ]
};

// 处理菜单项选择 (收藏夹点击)
const handleFolderSelect = (index) => {
  // 排除功能性菜单项 (现在这些功能项不再是 el-menu-item 的 index)
  // 实际上，由于它们现在是按钮，这个检查可能不再严格需要，但保留以防万一
  if (['folders-management'].includes(index)) { 
    return;
  }
  folderStore.setSelectedFolder(index);
  // 路由跳转到 /folders/:id 保持 URL 同步，但实际内容由 App.vue 控制
  if (router.currentRoute.value.path !== `/folders/${index}`) {
    router.push(`/folders/${index}`);
  }
};

// 显示创建收藏夹对话框
const showCreateFolderDialog = () => {
  editingFolder.value = null;
  form.name = '';
  form.description = '';
  dialogVisible.value = true;
};

// 显示编辑收藏夹对话框
const showEditFolderDialog = (folder) => {
  editingFolder.value = folder;
  form.name = folder.name;
  form.description = folder.description;
  dialogVisible.value = true;
};

// 处理表单提交 (创建/编辑收藏夹)
const handleSubmit = async () => {
  if (!formRef.value) return;
  
  try {
    await formRef.value.validate();
    loading.value = true;

    const newFolderName = form.name;
    const currentFolderId = editingFolder.value ? editingFolder.value._id : null;

    // 检查是否存在同名收藏夹 (逻辑从 FoldersView.vue 迁移过来)
    const isDuplicateName = folderStore.folders.find(existingFolder => {
      const hasSameName = existingFolder.name === newFolderName;
      const isNotCurrentFolder = !currentFolderId || existingFolder._id !== currentFolderId;
      return hasSameName && isNotCurrentName; // 修复：这里应该是 isNotCurrentFolder
    });

    if (isDuplicateName) {
      ElMessage.warning('已存在同名的收藏夹，请更换名称');
      loading.value = false;
      return;
    }

    let result;
    if (editingFolder.value) {
      result = await folderStore.updateFolder(editingFolder.value._id, form);
    } else {
      result = await folderStore.createFolder(form);
    }

    if (result.success) {
      dialogVisible.value = false;
    } else {
      ElMessage.error(result.message);
    }
  } catch (error) {
    console.error('Error submitting folder:', error);
    ElMessage.error(error.response?.data?.message || '操作失败');
  } finally {
    loading.value = false;
  }
};

// 确认删除收藏夹
const confirmDeleteFolder = (folder) => {
  ElMessageBox.confirm(
    '确定要删除这个收藏夹吗？',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    const result = await folderStore.deleteFolder(folder._id);
    if (!result.success) {
      ElMessage.error(result.message);
    }
  }).catch(() => {
    // 用户取消删除
  });
};

// 监听路由参数变化，如果直接通过 URL 访问 /folders/:id，则选中对应的收藏夹
watch(() => route.params.id, (newId) => {
  if (newId && folderStore.folders.length > 0 && folderStore.selectedFolderId !== newId) {
    folderStore.setSelectedFolder(newId);
  }
}, { immediate: true });

// 监听收藏夹列表加载完成，如果当前没有选中任何收藏夹，则默认选中第一个
watch(() => folderStore.folders.length, (newLength) => {
  if (newLength > 0 && !folderStore.selectedFolderId) {
    folderStore.setSelectedFolder(folderStore.folders[0]._id);
    // 路由跳转到 /folders/:id 保持 URL 同步
    if (router.currentRoute.value.path !== `/folders/${folderStore.folders[0]._id}`) {
      router.push(`/folders/${folderStore.folders[0]._id}`);
    }
  }
}, { immediate: true });

// 确保在组件挂载时，立即获取所有收藏夹
onMounted(() => {
  folderStore.fetchAllFolders(); // 立即加载所有收藏夹
  // 如果路由中有ID，则尝试选中该文件夹 (这个逻辑在上面的 watch 已经处理了，但为了健壮性可以保留)
  if (route.params.id) {
    folderStore.setSelectedFolder(route.params.id);
  }
});
</script>

<style scoped>
.sidebar {
  width: 100%;
  height: 100%;
  border-right: 1px solid #e6e6e6;
  background-color: #fff;
  overflow-y: auto; /* 允许滚动以显示更多收藏夹 */
}

.sidebar-menu {
  width: 100%;
  height: 100%;
  border-right: none;
}

/* 新增侧边栏头部样式 */
.sidebar-header {
  display: flex;
  align-items: center;
  padding: 10px 20px; /* 与 el-menu-item 的 padding 保持一致 */
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  gap: 8px; /* 图标和文字之间的间距 */
  height: var(--el-menu-item-height); /* 保持与菜单项相同的高度 */
  box-sizing: border-box; /* 确保 padding 不会增加总高度 */
}

.sidebar-header .header-title {
  flex-grow: 1; /* 让标题占据剩余空间 */
}

.sidebar-header .header-actions {
  display: flex;
  gap: 5px; /* 按钮之间的间距 */
}

.sidebar-header .header-actions .el-button {
  padding: 0;
  min-height: unset;
  height: auto;
  font-size: 18px; /* 调整图标大小 */
  color: #606266; /* 调整图标颜色 */
}

.sidebar-header .header-actions .el-button:hover {
  color: #409eff; /* 悬停颜色 */
}

.el-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-left: 20px !important; /* 调整以匹配 header 的左边距 */
}

.el-icon {
  font-size: 18px;
}

.folder-menu-item {
  position: relative;
  padding-right: 60px !important; /* 为操作按钮留出空间 */
}

.folder-name-text {
  flex-grow: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.folder-item-actions {
  position: absolute;
  right: 10px;
  display: flex;
  gap: 5px;
  background-color: #fff; /* 确保按钮在文本上方可见 */
  padding-left: 5px;
}

.folder-item-actions .el-button {
  padding: 0;
  min-height: unset;
  height: auto;
  font-size: 14px;
}

.menu-divider {
  margin: 0;
  border-top: 1px solid var(--el-border-color-light);
}
</style>