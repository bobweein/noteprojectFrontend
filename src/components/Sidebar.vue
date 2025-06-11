<template>
  <div class="sidebar">
    <el-menu
      :default-active="activeIndex"
      class="sidebar-menu"
      router
    >
      <el-menu-item index="/folders">
        <el-icon><Folder /></el-icon>
        <span>我的收藏夹</span>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { Folder } from '@element-plus/icons-vue'

const route = useRoute()
const activeIndex = computed(() => route.path)
</script>

<style scoped>
.sidebar {
  width: 200px;
  height: 100%;
  border-right: 1px solid #e6e6e6;
  background-color: #fff;
}

.sidebar-menu {
  height: 100%;
  border-right: none;
}

.el-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.el-icon {
  font-size: 18px;
}
</style> 