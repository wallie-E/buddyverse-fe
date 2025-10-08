import api from './config';
import type { 
  ApiResponse, 
  User, 
  Post,
  UpdateProfileRequest,
  PaginatedResponse,
  PaginationParams
} from './types';

// 更新用户信息
export const updateProfile = async (data: UpdateProfileRequest): Promise<ApiResponse<User>> => {
  return api.put('/api/users/profile', data);
};

// 获取用户发布的帖子
export const getUserPosts = async (params?: PaginationParams): Promise<ApiResponse<PaginatedResponse<Post>>> => {
  return api.get('/api/users/posts', { params });
};

// 获取用户资料
export const getUserProfile = async (userId: number, page = 1, limit = 10): Promise<ApiResponse<any>> => {
  return api.post('/api/users/profile', {
    user_id: userId,
    page,
    limit
  });
}; 