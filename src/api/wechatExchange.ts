import api from './config';
import type { ApiResponse } from './types';

// 查看微信响应
export interface ViewWechatResponse {
  wechatId: string;
}

// 查看微信（直接查看帖子作者微信号）
export const viewWechat = async (targetUserId: number): Promise<ApiResponse<ViewWechatResponse>> => {
  return api.post('/api/wechat-exchange/view', { targetUserId });
};
