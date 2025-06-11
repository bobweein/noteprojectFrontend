<!-- 
  FoldersView.vue - 收藏夹列表页面组件
  负责展示和管理用户的收藏夹，包括创建、编辑、删除和查看收藏夹
-->

<template>
  <!-- 收藏夹容器 -->
  <div class="folders-container">
    <!-- 页面头部 -->
    <div class="folders-header">
      <h2>我的收藏夹</h2>
      <div class="header-actions">
        <!-- 刷新按钮 -->
        <el-button @click="refreshFolders" :loading="loading" circle>
          <el-icon><Refresh /></el-icon>
        </el-button>
        <!-- 新建收藏夹按钮 -->
        <el-button type="primary" @click="showDialog()" class="add-button">
          新建收藏夹
        </el-button>
      </div>
    </div>

    <!-- 收藏夹网格布局 -->
    <el-row :gutter="20" class="folders-grid">
      <!-- 循环渲染收藏夹卡片 -->
      <el-col 
        v-for="folder in folders" 
        :key="folder._id" 
        :xs="24" 
        :sm="12" 
        :md="8" 
        :lg="6"
        class="folder-col"
      >
        <!-- 收藏夹卡片 -->
        <el-card 
          class="folder-card" 
          shadow="hover" 
          @click="goToFolder(folder._id)"
        >
          <!-- 卡片头部 -->
          <template #header>
            <div class="folder-header">
              <span class="folder-name">{{ folder.name }}</span>
              <!-- 操作按钮组 -->
              <div class="folder-actions">
                <!-- 编辑按钮 -->
                <el-button 
                  type="text" 
                  @click.stop="showDialog(folder)"
                  class="edit-button"
                >
                  编辑
                </el-button>
                <!-- 删除按钮 -->
                <el-button 
                  type="text" 
                  @click.stop="confirmDelete(folder)"
                  class="delete-button"
                >
                  删除
                </el-button>
              </div>
            </div>
          </template>
          <!-- 卡片内容 -->
          <div class="folder-content">
            <p class="folder-description">
              {{ folder.description || '暂无描述' }}
            </p>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 新建/编辑收藏夹对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingFolder ? '编辑收藏夹' : '新建收藏夹'"
      width="90%"
      :max-width="500"
      destroy-on-close
    >
      <!-- 表单 -->
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent
      >
        <!-- 名称输入框 -->
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入收藏夹名称" />
        </el-form-item>
        <!-- 描述输入框 -->
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            placeholder="请输入收藏夹描述"
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
import { ref, reactive, onMounted, onActivated } from 'vue'        // Vue 的组合式 API
import { useRouter } from 'vue-router'               // 路由实例
import apiClient from '@/utils/api';                        // HTTP 请求库
import { ElMessage, ElMessageBox } from 'element-plus'  // Element Plus UI 组件
import { Refresh } from '@element-plus/icons-vue'

// 初始化路由
const router = useRouter()                           // 获取路由实例

// 状态管理
const folders = ref([])                              // 收藏夹列表
const dialogVisible = ref(false)                     // 对话框显示状态
const editingFolder = ref(null)                      // 当前编辑的收藏夹
const loading = ref(false)                           // 加载状态
const formRef = ref(null)                            // 表单引用
const isFatching = ref(false)
// 表单数据
const form = reactive({
  name: '',                                          // 收藏夹名称
  description: ''                                    // 收藏夹描述
})

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入收藏夹名称', trigger: 'blur' },  // 必填验证
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }  // 长度验证
  ]
}

// 获取收藏夹列表

const fetchFolders = async () => {
  // 如果已经在获取数据，则直接返回
  if (isFatching.value) {
    console.warn('Fetch folders is already in progress.');
    return;
  }
  isFatching.value = true; // 设置正在获取状态
  loading.value = true; // 开始加载状态
  try {
    console.log('Fetching folders...');
    
    // 使用 apiClient 添加时间戳防止缓存
    const response = await apiClient.get(`/api/folders?t=${new Date().getTime()}`);
    console.log('Folders response:', response.data);
    
    // 严格过滤空白或无效文件夹
    if (Array.isArray(response.data)) {
      folders.value = response.data.filter(folder => 
        folder && 
        folder._id && 
        folder.name && 
        typeof folder.name === 'string' && 
        folder.name.trim() !== '' 
      );
      
      console.log('Filtered folders:', folders.value);
    } else {
      console.error('Invalid response format:', response.data);
      folders.value = [];
      ElMessage.error('获取收藏夹失败：服务器返回数据格式错误');
    }
    
    if (folders.value.length === 0) {
      ElMessage.info('您还没有创建任何收藏夹，点击"新建收藏夹"按钮创建一个吧！');
    }
  }catch (error) {
      console.error('Error:', error); // 打印完整错误对象
      ElMessage.error(error.response?.data?.message || '操作失败'); // 显示更友好的错误提示
    }finally {
    loading.value = false;
    isFatching.value = false; // 重置正在获取状态
  }
}
// 强制刷新
const refreshFolders = () => {
  // 清除本地数据
  folders.value = [];
  // 重新获取数据
  fetchFolders();
}

// 显示对话框
const showDialog = (folder = null) => {
  editingFolder.value = folder                       // 设置当前编辑的收藏夹
  if (folder) {
    form.name = folder.name                          // 填充表单数据
    form.description = folder.description
  } else {
    form.name = ''                                   // 清空表单数据
    form.description = ''
  }
  dialogVisible.value = true                         // 显示对话框
}

// 处理表单提交
const handleSubmit = async () => {
  if (!formRef.value) return                         // 确保表单引用存在
  
  try {
    await formRef.value.validate()                   // 验证表单
    loading.value = true                             // 开始加载
    
        // 获取当前输入的收藏夹名字
    const newFolderName = form.name;

    // 获取当前正在编辑的收藏夹（如果有的话）
    const currentFolder = editingFolder.value;

    // 遍历已有的收藏夹，逐个检查是否重名
    const isDuplicateName = folders.value.find(existingFolder => {
      // 判断：名字是否和已有收藏夹一样
      const hasSameName = existingFolder.name === newFolderName;

      // 判断：这个已有收藏夹是不是当前正在编辑的那个（如果正在编辑）
      const isNotCurrentFolder = !currentFolder || existingFolder._id !== currentFolder._id;

      // 如果名字相同，并且不是当前这个收藏夹，那就是重名了
      return hasSameName && isNotCurrentFolder;
    });

    if (isDuplicateName) {
      ElMessage.warning('已存在同名的收藏夹，请更换名称');
      loading.value = false;
      return;
    }

    if (editingFolder.value) {
      // 更新收藏夹
      await apiClient.put(`/api/folders/${editingFolder.value._id}`, form);
      ElMessage.success('更新成功'); // 成功提示
      } else {
      // 创建新收藏夹
      await apiClient.post('/api/folders', form);
      ElMessage.success('创建成功'); // 成功提示
    }

    dialogVisible.value = false                      // 关闭对话框
    fetchFolders()                                   // 刷新收藏夹列表
  } catch (error) {
      console.error('Error:', error); // 打印完整错误对象
      ElMessage.error(error.response?.data?.message || '操作失败'); // 显示更友好的错误提示
  } finally {
    loading.value = false                            // 结束加载
  }
}

// 确认删除收藏夹

// 确认删除收藏夹

const confirmDelete = (folder) => {
    ElMessageBox.confirm(
      '确定要删除这个收藏夹吗？',
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(async () => {
    try {
      await apiClient.delete(`/api/folders/${folder._id}`); // 使用 apiClient 发送删除请求      
      ElMessage.success('删除成功')                  // 成功提示
      fetchFolders()                                 // 刷新收藏夹列表
    } catch (error) {
        console.error('Error:', error); // 打印完整错误对象
        ElMessage.error(error.response?.data?.message || '操作失败'); // 显示更友好的错误提示
      }
  })
}


const goToFolder = (folderId) => {
  if (!folderId) {
    ElMessage.error('无效的收藏夹 ID');
    return;
  }
  router.push(`/folders/${folderId}`);
};

// 组件挂载时获取收藏夹列表
onMounted(refreshFolders);
// 在页面激活时刷新数据（用于缓存路由）
onActivated(refreshFolders);

</script>

<style scoped>
/* 收藏夹容器样式 */
.folders-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

/* 页面头部样式 */
.folders-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.folders-header h2 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

/* 收藏夹网格布局样式 */
.folders-grid {
  margin: -10px;
}

.folder-col {
  padding: 10px;
}

/* 收藏夹卡片样式 */
.folder-card {
  height: 100%;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.folder-card:hover {
  transform: translateY(-5px);
}

/* 卡片头部样式 */
.folder-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.folder-name {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  flex: 1;
  margin-right: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 操作按钮组样式 */
.folder-actions {
  display: flex;
  gap: 10px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .folders-container {
    padding: 15px;
  }
  
  .folders-header h2 {
    font-size: 20px;
  }
}

@media (max-width: 480px) {
  .folders-container {
    padding: 10px;
  }
  
  .folders-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .add-button {
    width: 100%;
  }
  
  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}
</style>

<!-- 
  使用指南：
  1. 这个文件实现了收藏夹列表页面
  2. 主要功能：
     - 展示收藏夹列表
     - 创建新收藏夹
     - 编辑收藏夹
     - 删除收藏夹
     - 查看收藏夹详情
  3. 关键点：
     - 使用 Element Plus 组件库
     - 实现响应式网格布局
     - 处理表单验证
     - 管理收藏夹状态
  4. 注意事项：
     - 确保表单验证规则合理
     - 处理各种错误情况
     - 保持界面简洁易用
     - 考虑不同设备的显示效果
--> 