import api from './config';
import type { 
  ApiResponse, 
  Notification,
  UnreadCountResponse,
  PaginatedResponse,
  NotificationListParams
} from './types';

// 获取通知列表
export const getNotifications = async (params?: NotificationListParams): Promise<ApiResponse<PaginatedResponse<Notification>>> => {
  return api.get('/api/notifications', { params });
};

// 获取未读通知数量
export const getUnreadCount = async (): Promise<ApiResponse<UnreadCountResponse>> => {
  return api.get('/api/notifications/unread-count');
};

// 标记通知为已读
export const markAsRead = async (id: number): Promise<ApiResponse<null>> => {
  return api.put(`/api/notifications/${id}/read`);
};

// 标记所有通知为已读
export const markAllAsRead = async (): Promise<ApiResponse<null>> => {
  return api.put('/api/notifications/read-all');
};

// 删除通知
export const deleteNotification = async (id: number): Promise<ApiResponse<null>> => {
  return api.delete(`/api/notifications/${id}`);
}; 