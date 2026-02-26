import api from './config';
import type { ApiResponse } from './types';

// 交换信息响应类型
export interface WechatExchangeInfo {
  exists: boolean;
  status: number | null; // 0-待确认，1-已完成，2-已拒绝，3-已过期
  exchangeNo?: string;
  initiatorId?: number;
  receiverId?: number;
  myRole?: 'initiator' | 'receiver';
  waitingFor?: 'me' | 'other' | 'none';
  otherNickname?: string;
  otherAvatar?: string;
  myWechat?: string;
  otherWechat?: string;
  initiatorConfirmedAt?: string;
  receiverConfirmedAt?: string;
  completedAt?: string;
  createdAt?: string;
}

// 发起交换请求参数
export interface CreateExchangeRequest {
  targetUserId: number;
  wechatId: string;
  isUpdate?: boolean;
  subcategoryName?: string;
}

// 发起交换请求响应
export interface CreateExchangeResponse {
  exchangeNo: string;
  status: number;
  notificationSent: boolean;
  isNewRecord: boolean;
}

// 确认交换参数
export interface ConfirmExchangeRequest {
  exchangeNo: string;
  wechatId?: string; // 接受时必填
  action: 'accept' | 'reject';
}

// 确认交换响应
export interface ConfirmExchangeResponse {
  exchangeNo: string;
  status: number;
  otherWechat?: string;
  completedAt?: string;
  notificationSent: boolean;
}

// 获取交换信息
export const getExchangeInfo = async (targetUserId: number): Promise<ApiResponse<WechatExchangeInfo>> => {
  return api.get('/api/wechat-exchange/info', {
    params: { targetUserId }
  });
};

// 发起/更新交换请求
export const createExchangeRequest = async (data: CreateExchangeRequest): Promise<ApiResponse<CreateExchangeResponse>> => {
  return api.post('/api/wechat-exchange/request', data);
};

// 确认交换（接受/拒绝）
export const confirmExchange = async (data: ConfirmExchangeRequest): Promise<ApiResponse<ConfirmExchangeResponse>> => {
  return api.post('/api/wechat-exchange/confirm', data);
};

// 交换记录项
export interface WechatExchangeRecord {
  id: number;
  exchangeNo: string;
  status: number; // 0-待确认，1-已完成，2-已拒绝，3-已过期
  myRole: 'initiator' | 'receiver';
  otherUserId: number;
  otherNickname: string;
  otherAvatar?: string;
  myWechat?: string;
  otherWechat?: string;
  createdAt: string;
  completedAt?: string;
  subcategoryName?: string;
}

// 获取我的交换记录列表参数
export interface GetMyExchangesParams {
  page?: number;
  limit?: number;
  status?: number; // 状态筛选（可选）
}

// 获取我的交换记录列表
export const getMyExchanges = async (params?: GetMyExchangesParams): Promise<ApiResponse<{ list: WechatExchangeRecord[]; pagination: any }>> => {
  return api.get('/api/wechat-exchange/my-exchanges', { params });
};

// 更新微信请求参数
export interface UpdateWechatRequest {
  targetUserId: number;
}

// 更新微信响应
export interface UpdateWechatResponse {
  otherWechat: string;
}

// 更新微信
export const updateWechat = async (data: UpdateWechatRequest): Promise<ApiResponse<UpdateWechatResponse>> => {
  return api.post('/api/wechat-exchange/update-wechat', data);
};

// 查看微信响应
export interface ViewWechatResponse {
  wechatId: string;
}

// 查看微信（首页直接查看帖子作者微信号）
export const viewWechat = async (targetUserId: number): Promise<ApiResponse<ViewWechatResponse>> => {
  return api.post('/api/wechat-exchange/view', { targetUserId });
};

