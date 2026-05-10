import api from './config';
import type {
  ApiResponse,
  PaginatedResponse,
  Feedback,
  AdminFeedback,
  SubmitFeedbackRequest,
  UpdateFeedbackRequest,
  AdminFeedbackListParams,
  PaginationParams,
} from './types';

// 提交反馈（无需登录，携带 Token 则关联用户）
export const submitFeedback = async (
  data: SubmitFeedbackRequest,
): Promise<ApiResponse<{ id: number }>> => {
  return api.post('/api/feedback', data);
};

// 获取我的反馈列表（需登录）
export const getMyFeedbacks = async (
  params?: PaginationParams,
): Promise<ApiResponse<PaginatedResponse<Feedback>>> => {
  return api.get('/api/feedback/mine', { params });
};

// 管理员：获取所有反馈列表
export const adminGetFeedbacks = async (
  params?: AdminFeedbackListParams,
): Promise<ApiResponse<PaginatedResponse<AdminFeedback>>> => {
  return api.get('/api/admin/feedbacks', { params });
};

// 管理员：更新反馈状态及回复
export const adminUpdateFeedback = async (
  id: number,
  data: UpdateFeedbackRequest,
): Promise<ApiResponse<null>> => {
  return api.put(`/api/admin/feedbacks/${id}`, data);
};

// 管理员：删除反馈
export const adminDeleteFeedback = async (
  id: number,
): Promise<ApiResponse<null>> => {
  return api.delete(`/api/admin/feedbacks/${id}`);
};
