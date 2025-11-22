import axios from 'axios';

// API基础URL
export const BASE_URL = import.meta.env.VITE_API_URL;
console.log('hhhh', import.meta.env)
// 创建axios实例
const api = axios.create({
  baseURL: '',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加认证token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 统一处理响应
api.interceptors.response.use(
  (response) => {
    // 返回响应数据
    return response.data;
  },
  (error) => {
    // 统一错误处理
    if (error.response?.status === 401) {
      // 检查是否是token无效导致的401，还是密码错误等业务逻辑错误
      const errorMessage = error.response?.data?.message || '';
      
      // 如果是密码错误、邮箱不存在等业务逻辑错误，不自动重定向
      if (errorMessage.includes('邮箱或密码错误') || 
          errorMessage.includes('邮箱不存在') ||
          errorMessage.includes('密码错误')) {
        // 返回错误信息，让业务逻辑处理
        const errorMessage = error.response?.data?.message || '网络错误，请稍后重试';
        return Promise.reject(new Error(errorMessage));
      }
      
      // 如果是token无效导致的401，才自动清除token并重定向
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    // 返回错误信息
    const errorMessage = error.response?.data?.message || '网络错误，请稍后重试';
    return Promise.reject(new Error(errorMessage));
  }
);

export default api; 