// 导入全局样式
import './assets/main.css'                           // 导入全局样式文件

// 导入 Vue 核心功能
import { createApp } from 'vue'                      // 导入 Vue 应用创建函数
import { createPinia } from 'pinia'                  // 导入 Pinia 状态管理库
import ElementPlus from 'element-plus'               // 导入 Element Plus UI 库
import 'element-plus/dist/index.css'                 // 导入 Element Plus 样式
import * as ElementPlusIconsVue from '@element-plus/icons-vue'  // 导入 Element Plus 图标

// 导入应用组件和路由
import App from './App.vue'                          // 导入根组件
import router from './router'                        // 导入路由配置
import axios from 'axios'

// 配置 axios
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000'  // 使用环境变量
axios.defaults.withCredentials = true                 // 允许跨域携带cookie

// 创建 Vue 应用实例
const app = createApp(App)                           // 创建 Vue 应用

// 注册所有 Element Plus 图标组件
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)                      // 全局注册图标组件
}

// 使用插件
app.use(createPinia())                               // 使用 Pinia 状态管理
app.use(router)                                      // 使用路由
app.use(ElementPlus)                                 // 使用 Element Plus UI 库

// 挂载应用
app.mount('#app')                                    // 将应用挂载到 DOM

/*
  使用指南：
  1. 这个文件是应用的入口文件
  2. 主要功能：
     - 创建 Vue 应用实例
     - 配置全局插件
     - 注册全局组件
     - 挂载应用到 DOM
  3. 关键点：
     - 使用 Element Plus 组件库
     - 使用 Pinia 状态管理
     - 使用 Vue Router 路由
     - 全局注册图标组件
  4. 注意事项：
     - 确保按正确顺序使用插件
     - 注意样式文件的导入顺序
     - 合理使用全局组件
     - 保持代码简洁清晰
*/
