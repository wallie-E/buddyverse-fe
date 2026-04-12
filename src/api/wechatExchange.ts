import api from './config';
import type { ApiResponse } from './types';

// 查看联系方式响应（字段名以后端为准；qqId 为部分接口 camelCase 兼容）
export interface ViewWechatResponse {
  wechatId?: string;
  qq_id?: string;
  qqId?: string;
}

/** 从 view 接口 data 中解析微信与 QQ（trim 后字符串，缺省为空） */
export function extractViewContact(data: ViewWechatResponse | null | undefined): { wechat: string; qq: string } {
  if (!data) return { wechat: '', qq: '' };
  const wechat = typeof data.wechatId === 'string' ? data.wechatId.trim() : '';
  const qqRaw = data.qq_id ?? data.qqId;
  const qq = typeof qqRaw === 'string' ? qqRaw.trim() : '';
  return { wechat, qq };
}

// 查看联系方式（帖子作者 / 他人资料）
export const viewWechat = async (targetUserId: number): Promise<ApiResponse<ViewWechatResponse>> => {
  return api.post('/api/wechat-exchange/view', { targetUserId });
};
