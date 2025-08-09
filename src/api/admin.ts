import api from './config';
import type { 
  ApiResponse, 
  AdminStats,
  User,
  Post,
  Comment,
  UpdateUserStatusRequest,
  PaginatedResponse,
  AdminUserListParams,
  AdminPostListParams,
  AdminCommentListParams
} from './types';

// 获取统计数据
export const getStats = async (): Promise<ApiResponse<AdminStats>> => {
  return api.get('/api/admin/stats');
};

// 用户管理
export const adminUsers = {
  // 获取用户列表
  list: async (params?: AdminUserListParams): Promise<ApiResponse<PaginatedResponse<User>>> => {
    return api.get('/api/admin/users', { params });
  },

  // 删除用户
  delete: async (id: number): Promise<ApiResponse<null>> => {
    return api.delete(`/api/admin/users/${id}`);
  },

  // 修改用户状态
  updateStatus: async (id: number, data: UpdateUserStatusRequest): Promise<ApiResponse<null>> => {
    return api.put(`/api/admin/users/${id}/status`, data);
  }
};

// 帖子管理
export const adminPosts = {
  // 获取帖子列表
  list: async (params?: AdminPostListParams): Promise<ApiResponse<PaginatedResponse<Post>>> => {
    return api.get('/api/admin/posts', { params });
  },

  // 删除帖子
  delete: async (id: number): Promise<ApiResponse<null>> => {
    return api.delete(`/api/admin/posts/${id}`);
  }
};

// 评论管理
export const adminComments = {
  // 获取评论列表
  list: async (params?: AdminCommentListParams): Promise<ApiResponse<PaginatedResponse<Comment>>> => {
    return api.get('/api/admin/comments', { params });
  },

  // 删除评论
  delete: async (id: number): Promise<ApiResponse<null>> => {
    return api.delete(`/api/admin/comments/${id}`);
  }
}; 