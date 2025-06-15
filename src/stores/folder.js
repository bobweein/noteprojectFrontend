import { defineStore } from 'pinia';
import apiClient from '@/utils/api';
import { ElMessage } from 'element-plus';

export const useFolderStore = defineStore('folder', {
  state: () => ({
    folders: [],             // 所有收藏夹列表
    selectedFolderId: null,  // 当前选中的收藏夹ID
    selectedFolder: null,    // 当前选中的收藏夹对象
    loadingFolders: false,   // 收藏夹列表加载状态
    
    // links 现在是一个对象，以 folderId 为键，存储该文件夹下的链接数组
    links: {},               // { [folderId]: linkArray }
    loadingLinks: false,     // 链接列表加载状态
    lastFetched: {}          // { [folderId]: timestamp } 用于缓存控制
  }),

  getters: {
    // 根据ID获取收藏夹对象
    getFolderById: (state) => (id) => {
      return state.folders.find(folder => folder._id === id);
    },
    // 获取当前选中的收藏夹的名称
    currentFolderName: (state) => {
      return state.selectedFolder ? state.selectedFolder.name : '未选择收藏夹';
    },
    // 获取当前选中的收藏夹的描述
    currentFolderDescription: (state) => {
      return state.selectedFolder ? state.selectedFolder.description : '请在左侧选择一个收藏夹。';
    },
    // 获取当前选中收藏夹的链接列表
    currentFolderLinks: (state) => {
      return state.selectedFolderId 
        ? state.links[state.selectedFolderId] || []
        : [];
    }
  },

  actions: {
    /**
     * 获取所有收藏夹列表
     */
    async fetchAllFolders() {
      if (this.loadingFolders) {
        console.warn('Fetch all folders is already in progress.');
        return;
      }
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
            folder.description !== undefined
          );
          
          // 如果当前没有选中文件夹，且有文件夹列表，则默认选中第一个
          if (this.folders.length > 0 && !this.selectedFolderId) {
            this.setSelectedFolder(this.folders[0]._id);
          } else if (this.selectedFolderId && !this.getFolderById(this.selectedFolderId)) {
            // 如果当前选中的文件夹不存在了（可能被删除），则清空选中状态或选中第一个
            this.setSelectedFolder(this.folders.length > 0 ? this.folders[0]._id : null);
          }

          if (this.folders.length === 0) {
            ElMessage.info('您还没有创建任何收藏夹，点击"新建收藏夹"按钮创建一个吧！');
          }
        } else {
          console.error('Invalid response format for folders:', response.data);
          this.folders = [];
          ElMessage.error('获取收藏夹失败：服务器返回数据格式错误');
        }
      } catch (error) {
        console.error('Error fetching all folders:', error);
        ElMessage.error(error.response?.data?.message || '获取收藏夹列表失败');
      } finally {
        this.loadingFolders = false;
      }
    },

    /**
     * 设置当前选中的收藏夹，并获取其链接
     * @param {string | null} folderId - 收藏夹的 ID，或 null 表示不选中任何文件夹
     */
    async setSelectedFolder(folderId) {
      this.selectedFolderId = folderId;
      this.selectedFolder = this.getFolderById(folderId) || null;
      
      // 清空当前链接，然后根据新的选中文件夹ID获取链接
      if (folderId) {
        await this.fetchLinksByFolder(folderId);
      } else {
        this.links = {}; // 如果没有选中文件夹，清空所有链接缓存
      }
    },

    /**
     * 获取指定收藏夹的链接
     * @param {string} folderId - 收藏夹ID
     */
    async fetchLinksByFolder(folderId) {
      if (!folderId) return;
      
      // 返回缓存数据如果最近获取过 (例如，5分钟内)
      const now = Date.now();
      if (this.lastFetched[folderId] &&
          now - this.lastFetched[folderId] < 300000) { // 5 minutes cache
          return this.links[folderId] || [];
      }
      
      this.loadingLinks = true;
      try {
        const response = await apiClient.get(`/api/links/${folderId}`);
        // 使用展开运算符更新 links 对象，确保响应式
        this.links = {
          ...this.links,
          [folderId]: response.data || []
        };
        // 更新最后获取时间
        this.lastFetched = {
          ...this.lastFetched,
          [folderId]: now
        };
        return response.data;
      } catch (error) {
        console.error('Error fetching links:', error);
        ElMessage.error(error.response?.data?.message || '获取链接失败');
        // 即使失败，也确保该文件夹的链接数组存在（可能为空）
        this.links = {
          ...this.links,
          [folderId]: []
        };
        throw error; // 重新抛出错误，以便组件可以处理
      } finally {
        this.loadingLinks = false;
      }
    },

    /**
     * 创建新收藏夹
     * @param {object} formData - 收藏夹数据 { name, description }
     */
    async createFolder(formData) {
      try {
        const response = await apiClient.post('/api/folders', formData);
        ElMessage.success('创建成功');
        // 直接添加到本地列表，避免重新fetchAllFolders
        this.folders.push(response.data);
        // 选中新创建的收藏夹
        await this.setSelectedFolder(response.data._id); 
        return { success: true, folder: response.data };
      } catch (error) {
        console.error('Error creating folder:', error);
        ElMessage.error(error.response?.data?.message || '创建失败');
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
        // 更新本地列表中的收藏夹
        const index = this.folders.findIndex(f => f._id === folderId);
        if (index !== -1) {
          this.folders[index] = response.data;
          // 如果更新的是当前选中的文件夹，也更新 selectedFolder
          if (this.selectedFolderId === folderId) {
            this.selectedFolder = response.data;
          }
        }
        return { success: true, folder: response.data };
      } catch (error) {
        console.error('Error updating folder:', error);
        ElMessage.error(error.response?.data?.message || '更新失败');
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
        // 从本地列表中移除
        this.folders = this.folders.filter(f => f._id !== folderId);
        // 如果删除的是当前选中的文件夹，清空选中状态
        if (this.selectedFolderId === folderId) {
          // 尝试选中第一个文件夹，如果没有则清空
          await this.setSelectedFolder(this.folders.length > 0 ? this.folders[0]._id : null);
        }
        // 从 links 缓存中移除该文件夹的链接
        delete this.links[folderId];
        delete this.lastFetched[folderId];
        return { success: true };
      } catch (error) {
        console.error('Error deleting folder:', error);
        ElMessage.error(error.response?.data?.message || '删除失败');
        return { success: false, message: error.response?.data?.message || '删除失败' };
      }
    },

    /**
     * 添加链接到当前选中的收藏夹
     * @param {object} linkData - 链接数据 { title, url, note }
     */
    async addLink(linkData) {
      if (!this.selectedFolderId) {
        ElMessage.error('请先选择一个收藏夹');
        return { success: false, message: '未选择收藏夹' };
      }
      try {
        const response = await apiClient.post('/api/links', {
          ...linkData,
          folderId: this.selectedFolderId
        });
        ElMessage.success('添加成功');
        // 直接更新当前选中文件夹的链接列表
        if (this.links[this.selectedFolderId]) {
          this.links[this.selectedFolderId].push(response.data);
        } else {
          // 如果该文件夹的链接列表尚未加载，则重新获取
          await this.fetchLinksByFolder(this.selectedFolderId);
        }
        return { success: true, link: response.data };
      } catch (error) {
        console.error('Error adding link:', error);
        ElMessage.error(error.response?.data?.message || '添加失败');
        return { success: false, message: error.response?.data?.message || '添加失败' };
      }
    },

    /**
     * 更新链接
     * @param {string} linkId - 链接ID
     * @param {object} linkData - 更新的链接数据 { title, url, note }
     */
    async updateLink(linkId, linkData) {
      if (!this.selectedFolderId) {
        ElMessage.error('未选择收藏夹');
        return { success: false, message: '未选择收藏夹' };
      }
      try {
        const response = await apiClient.put(`/api/links/${linkId}`, linkData);
        ElMessage.success('更新成功');
        // 更新当前选中文件夹的链接列表中的对应链接
        if (this.links[this.selectedFolderId]) {
          const index = this.links[this.selectedFolderId].findIndex(link => link._id === linkId);
          if (index !== -1) {
            this.links[this.selectedFolderId][index] = response.data;
          }
        }
        return { success: true, link: response.data };
      } catch (error) {
        console.error('Error updating link:', error);
        ElMessage.error(error.response?.data?.message || '更新失败');
        return { success: false, message: error.response?.data?.message || '更新失败' };
      }
    },

    /**
     * 删除链接
     * @param {string} linkId - 链接ID
     */
    async deleteLink(linkId) {
      if (!this.selectedFolderId) {
        ElMessage.error('未选择收藏夹');
        return { success: false, message: '未选择收藏夹' };
      }
      try {
        await apiClient.delete(`/api/links/${linkId}`);
        ElMessage.success('删除成功');
        // 从当前选中文件夹的链接列表中移除
        if (this.links[this.selectedFolderId]) {
          this.links[this.selectedFolderId] = this.links[this.selectedFolderId].filter(link => link._id !== linkId);
        }
        return { success: true };
      } catch (error) {
        console.error('Error deleting link:', error);
        ElMessage.error(error.response?.data?.message || '删除失败');
        return { success: false, message: error.response?.data?.message || '删除失败' };
      }
    },

    /**
     * 重置 store 状态 (用于登出等场景)
     */
    $reset() {
      this.folders = [];
      this.selectedFolderId = null;
      this.selectedFolder = null;
      this.loadingFolders = false;
      this.isFetchingFolders = false;
      this.links = {};
      this.loadingLinks = false;
      this.lastFetched = {};
    }
  }
});