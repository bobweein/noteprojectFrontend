import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '@/views/LoginView.vue';
import RegisterView from '@/views/RegisterView.vue';
// import FoldersView from '@/views/FoldersView.vue'; // 不再直接使用
// import FolderDetailView from '@/views/FolderDetailView.vue'; // 不再直接通过路由访问

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/folders' // 默认重定向到 /folders
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView
    },
    {
      path: '/folders',
      name: 'folders',
      // FoldersView 不再直接作为路由组件，而是由 App.vue 内部管理
      // 这里可以留空或者重定向到 App.vue 的主布局
      component: () => import('@/App.vue'), // App.vue 负责内部渲染
      children: [
        {
          path: ':id', // 动态路由参数，用于深层链接，但实际渲染由 App.vue 内部处理
          name: 'folder-detail',
          // component: FolderDetailView, // 不再直接作为路由组件
          props: true // 允许将路由参数作为 props 传递，但 App.vue 会直接使用 store
        }
      ]
    },
    // 捕获所有未匹配的路由，重定向到 /folders 或 404 页面
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      redirect: '/folders' // 或者可以指向一个 404 页面
    }
  ]
});

// 路由守卫，确保用户登录
router.beforeEach((to, from, next) => {
  const publicPages = ['/login', '/register', '/forgot-password', '/reset-password'];
  const authRequired = !publicPages.includes(to.path);
  const loggedIn = localStorage.getItem('token');

  if (authRequired && !loggedIn) {
    return next('/login');
  }

  next();
});

export default router;