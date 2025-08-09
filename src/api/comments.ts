import api from './config';
import type { 
  ApiResponse, 
  Comment,
  OrganizedComment,
  CreateCommentRequest,
  PaginatedResponse,
  PaginationParams
} from './types';

// 创建评论
export const createComment = async (data: CreateCommentRequest): Promise<ApiResponse<Comment>> => {
  return api.post('/api/comments', data);
};

// 获取帖子评论列表
export const getPostComments = async (
  postId: string | number, 
  params?: PaginationParams
): Promise<ApiResponse<PaginatedResponse<OrganizedComment>>> => {
  return api.get(`/api/comments/post/${postId}`, { params });
};

// 删除评论
export const deleteComment = async (id: number): Promise<ApiResponse<null>> => {
  return api.delete(`/api/comments/${id}`);
}; 