import api from './config';
import type { 
  ApiResponse, 
  AuthResponse, 
  User, 
  RegisterRequest, 
  LoginRequest 
} from './types';

// 用户注册
export const register = async (data: RegisterRequest): Promise<ApiResponse<AuthResponse>> => {
  return api.post('/api/auth/register', data);
};

// 用户登录
export const login = async (data: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
  return api.post('/api/auth/login', data);
};

// 获取当前用户信息
export const getProfile = async (): Promise<ApiResponse<User>> => {
  return api.get('/api/auth/profile');
};

// 认证工具函数
export const authUtils = {
  // 保存登录信息
  saveAuth: (token: string, user: User): void => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },

  // 获取当前用户
  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // 获取token
  getToken: (): string | null => {
    return localStorage.getItem('token');
  },

  // 检查是否登录
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },

  // 检查是否是管理员
  isAdmin: (): boolean => {
    const user = authUtils.getCurrentUser();
    return user?.role === 'admin';
  },

  // 退出登录
  logout: (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}; 