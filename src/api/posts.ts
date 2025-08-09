import api from './config';
import type { 
  ApiResponse, 
  Post,
  CreatePostRequest,
  PaginatedResponse,
  PostListParams
} from './types';

// 创建帖子
export const createPost = async (data: CreatePostRequest): Promise<ApiResponse<Post>> => {
  return api.post('/api/posts', data);
};

// 获取帖子列表
export const getPosts = async (params?: PostListParams): Promise<ApiResponse<PaginatedResponse<Post>>> => {
  return api.get('/api/posts', { params });
};

// 获取帖子详情
export const getPostById = async (id: string | number): Promise<ApiResponse<Post>> => {
  return api.get(`/api/posts/${id}`);
};

// 删除帖子
export const deletePost = async (id: number): Promise<ApiResponse<null>> => {
  return api.delete(`/api/posts/${id}`);
}; 