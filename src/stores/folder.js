import { defineStore } from 'pinia';
import apiClient from '@/utils/api';
import { ElMessage } from 'element-plus';

export const useFolderStore = defineStore('folder', {
  state: () => ({
    folders: [], // 所有收藏夹列表
    selectedFolderId: null, // 当前选中的收藏夹ID
    selectedFolder: null, // 当前选中的收藏夹完整对象
    loadingFolders: false, // 收藏夹列表加载状态
    isFetchingFolders: false, // 防止重复获取收藏夹列表
  }),
  actions: {
    /**
     * 获取所有收藏夹
     */
    async fetchAllFolders() {
      if (this.isFetchingFolders) {
        console.warn('Fetch folders is already in progress.');
        return;
      }
      this.isFetchingFolders = true;
      this.loadingFolders = true;
      try {
        const response = await apiClient.get(`/api/folders?t=${new Date().getTime()}`);
        if (Array.isArray(response.data)) {
          this.folders = response.data.filter(folder =>
            folder &&
            folder._id &&
            folder.name &&
            typeof folder.name === 'string' &&
            folder.name.trim() !== '' &&
            folder.description !== undefined // 确保 description 字段存在
          );

          // 如果之前有选中的收藏夹，尝试重新选中它
          if (this.selectedFolderId) {
            this.selectedFolder = this.folders.find(f => f._id === this.selectedFolderId) || null;
          } 
          // 如果没有选中任何收藏夹且有数据，默认选中第一个
          else if (this.folders.length > 0) {
            this.selectedFolderId = this.folders[0]._id;
            this.selectedFolder = this.folders[0];
          } else {
            // 如果没有收藏夹，清空选中状态
            this.selectedFolderId = null;
            this.selectedFolder = null;
          }
        } else {
          console.error('Invalid response format:', response.data);
          this.folders = [];
          ElMessage.error('获取收藏夹失败：服务器返回数据格式错误');
        }
      } catch (error) {
        console.error('Error fetching folders:', error);
        ElMessage.error(error.response?.data?.message || '获取收藏夹失败');
      } finally {
        this.loadingFolders = false;
        this.isFetchingFolders = false;
      }
    },

    /**
     * 设置当前选中的收藏夹
     * @param {string} folderId - 收藏夹的 ID
     */
    setSelectedFolder(folderId) {
      this.selectedFolderId = folderId;
      this.selectedFolder = this.folders.find(f => f._id === folderId) || null;
    },

    /**
     * 创建新收藏夹
     * @param {object} formData - 收藏夹数据 { name, description }
     */
    async createFolder(formData) {
      try {
        const response = await apiClient.post('/api/folders', formData);
        ElMessage.success('创建成功');
        await this.fetchAllFolders(); // 刷新收藏夹列表
        this.setSelectedFolder(response.data._id); // 选中新创建的收藏夹
        return { success: true, folder: response.data };
      } catch (error) {
        console.error('Error creating folder:', error);
        return { success: false, message: error.response?.data?.message || '创建失败' };
      }
    },

    /**
     * 更新收藏夹
     * @param {string} folderId - 收藏夹的 ID
     * @param {object} formData - 更新的收藏夹数据 { name, description }
     */
    async updateFolder(folderId, formData) {
      try {
        const response = await apiClient.put(`/api/folders/${folderId}`, formData);
        ElMessage.success('更新成功');
        await this.fetchAllFolders(); // 刷新收藏夹列表
        return { success: true, folder: response.data };
      } catch (error) {
        console.error('Error updating folder:', error);
        return { success: false, message: error.response?.data?.message || '更新失败' };
      }
    },

    /**
     * 删除收藏夹
     * @param {string} folderId - 收藏夹的 ID
     */
    async deleteFolder(folderId) {
      try {
        await apiClient.delete(`/api/folders/${folderId}`);
        ElMessage.success('删除成功');
        await this.fetchAllFolders(); // 刷新收藏夹列表
        // 如果删除的是当前选中的收藏夹，则清空选中或选中第一个
        if (this.selectedFolderId === folderId) {
          this.selectedFolderId = this.folders.length > 0 ? this.folders[0]._id : null;
          this.selectedFolder = this.folders.length > 0 ? this.folders[0] : null;
        }
        return { success: true };
      } catch (error) {
        console.error('Error deleting folder:', error);
        return { success: false, message: error.response?.data?.message || '删除失败' };
      }
    },
  },
});