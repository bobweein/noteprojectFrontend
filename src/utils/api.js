// src/utils/api.js
import axios from 'axios';

// 创建 Axios 实例
const apiClient = axios.create({
  baseURL: 'https://noteproject-backend.vercel.app/',
  timeout: 30000, // 设置请求超时时间
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：自动附加 token
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// 响应拦截器：统一处理 401 错误
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);
console.log('Axios Config:', apiClient.defaults);
export default apiClient;