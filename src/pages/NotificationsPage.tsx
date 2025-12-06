import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrashIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { Modal, message } from 'antd';
import { API, authUtils } from '../api';
import { getMyExchanges, getExchangeInfo, confirmExchange, updateWechat } from '../api/wechatExchange';
import type { WechatExchangeRecord, WechatExchangeInfo } from '../api/wechatExchange';
import { useNotification } from '../hooks/useNotification';
import type { Notification } from '../api/types';
import { getSubCategoryIcon } from '../utils/categoryIcons';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { unreadCount, decrementUnreadCount, clearUnreadCount, fetchUnreadCount } = useNotification();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [exchangeRecords, setExchangeRecords] = useState<WechatExchangeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [exchangeLoading, setExchangeLoading] = useState(false);
  const [loadingMoreExchanges, setLoadingMoreExchanges] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'comment' | 'wechat'>('comment');
  const [page, setPage] = useState(1);
  const [exchangePage, setExchangePage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [hasMoreExchanges, setHasMoreExchanges] = useState(true);

  // 标记是否已初始化加载
  const initializedRef = useRef(false);

  // 交换弹窗相关状态
  const [exchangeModalVisible, setExchangeModalVisible] = useState(false);
  const [selectedExchangeRecord, setSelectedExchangeRecord] = useState<WechatExchangeRecord | null>(null);
  const [exchangeDetailInfo, setExchangeDetailInfo] = useState<WechatExchangeInfo | null>(null);
  const [exchangeDetailLoading, setExchangeDetailLoading] = useState(false);
  const [confirmingExchange, setConfirmingExchange] = useState(false);
  const [updatingWechat, setUpdatingWechat] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  // 检查登录状态
  useEffect(() => {
    if (!authUtils.isAuthenticated()) {
      navigate('/login');
      return;
    }
  }, [navigate]);

  // 进入页面时刷新未读数量
  useEffect(() => {
    if (authUtils.isAuthenticated()) {
      fetchUnreadCount();
    }
  }, [fetchUnreadCount]);

  // 当页面可见性变化时（用户切换回标签页）刷新未读数量
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && authUtils.isAuthenticated()) {
        fetchUnreadCount();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchUnreadCount]);

  // 获取通知列表
  const fetchNotifications = useCallback(async (pageNum = 1, filterType: 'comment' = 'comment') => {
    try {
      // 第一页使用 loading，后续页面使用 loadingMore
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError('');

      const response = await API.notifications.getNotifications({
        page: pageNum,
        limit: 20,
        type: filterType
      });

      if (response.success) {
        if (pageNum === 1) {
          setNotifications(response.data.list);
        } else {
          setNotifications(prev => [...prev, ...response.data.list]);
        }

        setHasMore(response.data.pagination.page < response.data.pagination.pages);
      }
    } catch (error) {
      console.error('获取通知失败:', error);
      setError('获取通知失败，请刷新重试');
    } finally {
      if (pageNum === 1) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  }, []);

  // 加载更多
  const loadMore = useCallback(() => {
    if (filter === 'wechat' || !hasMore || loading || loadingMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage, 'comment');
  }, [filter, hasMore, loading, loadingMore, page, fetchNotifications]);

  // 标记单个通知为已读
  const markAsRead = async (notificationId: number) => {
    try {
      await API.notifications.markAsRead(notificationId);

      // 更新本地状态
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );

      // 更新全局未读数量
      decrementUnreadCount();
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  };

  // 标记所有通知为已读
  const markAllAsRead = async () => {
    try {
      await API.notifications.markAllAsRead();

      // 更新本地状态
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, is_read: true }))
      );

      // 清空全局未读数量
      clearUnreadCount();
    } catch (error) {
      console.error('标记全部已读失败:', error);
    }
  };

  // 删除通知
  const deleteNotification = async (notificationId: number) => {
    try {
      await API.notifications.deleteNotification(notificationId);

      // 从列表中移除
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('删除通知失败:', error);
    }
  };

  // 格式化时间
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}天前`;
    } else if (hours > 0) {
      return `${hours}小时前`;
    } else if (minutes > 0) {
      return `${minutes}分钟前`;
    } else {
      return '刚刚';
    }
  };

  // 获取微信交换记录
  const fetchExchangeRecords = useCallback(async (pageNum = 1) => {
    try {
      // 第一页使用 exchangeLoading，后续页面使用 loadingMoreExchanges
      if (pageNum === 1) {
        setExchangeLoading(true);
      } else {
        setLoadingMoreExchanges(true);
      }
      const response = await getMyExchanges({
        page: pageNum,
        limit: 20
      });

      if (response.success) {
        if (pageNum === 1) {
          setExchangeRecords(response.data.list);
        } else {
          setExchangeRecords(prev => [...prev, ...response.data.list]);
        }

        setHasMoreExchanges(response.data.pagination.page < response.data.pagination.pages);
      }
    } catch (error) {
      console.error('获取交换记录失败:', error);
    } finally {
      if (pageNum === 1) {
        setExchangeLoading(false);
      } else {
        setLoadingMoreExchanges(false);
      }
    }
  }, []);

  // 初始加载：同时获取通知和交换记录，以便正确显示 count
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      fetchNotifications(1, 'comment');
      fetchExchangeRecords(1);
    }
  }, [fetchNotifications, fetchExchangeRecords]);

  // 筛选变化时重新加载
  useEffect(() => {
    if (!initializedRef.current) return; // 等待初始加载完成

    if (filter === 'wechat') {
      setExchangePage(1);
      fetchExchangeRecords(1);
    } else {
      setPage(1);
      fetchNotifications(1, 'comment');
    }
  }, [filter, fetchNotifications, fetchExchangeRecords]);

  // 加载更多交换记录
  const loadMoreExchanges = useCallback(() => {
    if (!hasMoreExchanges || exchangeLoading || loadingMoreExchanges) return;
    const nextPage = exchangePage + 1;
    setExchangePage(nextPage);
    fetchExchangeRecords(nextPage);
  }, [hasMoreExchanges, exchangeLoading, loadingMoreExchanges, exchangePage, fetchExchangeRecords]);

  // 滚动监听，实现无限滚动
  useEffect(() => {
    const handleScroll = () => {
      // 根据当前筛选类型决定加载哪个列表
      if (filter === 'wechat') {
        if (!hasMoreExchanges || exchangeLoading || loadingMoreExchanges) return;
      } else {
        if (!hasMore || loading || loadingMore) return;
      }

      // 检查是否滚动到页面底部附近
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // 当滚动到底部附近时（距离底部100px以内）触发加载
      if (scrollTop + windowHeight >= documentHeight - 100) {
        if (filter === 'wechat') {
          loadMoreExchanges();
        } else {
          loadMore();
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [filter, hasMore, hasMoreExchanges, loading, loadingMore, exchangeLoading, loadingMoreExchanges, loadMore, loadMoreExchanges]);

  // 获取交换状态文本
  const getExchangeStatusText = (status: number) => {
    switch (status) {
      case 0:
        return '待确认';
      case 1:
        return '已完成';
      case 2:
        return '已拒绝';
      case 3:
        return '已过期';
      default:
        return '未知';
    }
  };

  // 获取交换状态颜色
  const getExchangeStatusColor = (status: number) => {
    switch (status) {
      case 0:
        return 'text-yellow-600 bg-yellow-50';
      case 1:
        return 'text-green-600 bg-green-50';
      case 2:
        return 'text-red-600 bg-red-50';
      case 3:
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  // 处理交换记录点击
  const handleExchangeRecordClick = async (record: WechatExchangeRecord) => {
    setSelectedExchangeRecord(record);
    setExchangeModalVisible(true);

    // 获取交换详细信息
    try {
      setExchangeDetailLoading(true);
      const response = await getExchangeInfo(record.otherUserId);
      if (response.success) {
        setExchangeDetailInfo(response.data);
      }
    } catch (err) {
      console.error('获取交换详情失败:', err);
      messageApi.error('获取交换详情失败');
    } finally {
      setExchangeDetailLoading(false);
    }
  };

  // 确认交换
  const handleConfirmExchange = async () => {
    if (!selectedExchangeRecord || !exchangeDetailInfo?.exchangeNo) return;

    // 检查当前用户是否配置了微信号
    const user = authUtils.getCurrentUser();
    const hasWechat = user && user.wechat_id && user.wechat_id.trim() !== '';

    if (!hasWechat) {
      messageApi.warning('请先配置微信号');
      setExchangeModalVisible(false);
      navigate('/profile');
      return;
    }

    try {
      setConfirmingExchange(true);
      const response = await confirmExchange({
        exchangeNo: exchangeDetailInfo.exchangeNo,
        wechatId: user.wechat_id!,
        action: 'accept'
      });

      if (response.success) {
        messageApi.success('交换成功！');
        // 更新交换详情信息
        if (response.data.otherWechat) {
          setExchangeDetailInfo(prev => prev ? {
            ...prev,
            status: 1,
            otherWechat: response.data.otherWechat,
            completedAt: response.data.completedAt
          } : null);
        }
        // 更新列表中的记录
        setExchangeRecords(prev => prev.map(record =>
          record.id === selectedExchangeRecord.id
            ? { ...record, status: 1, otherWechat: response.data.otherWechat, completedAt: response.data.completedAt }
            : record
        ));
      } else {
        messageApi.error(response.message || '确认交换失败');
      }
    } catch (err) {
      messageApi.error(err instanceof Error ? err.message : '确认交换失败');
    } finally {
      setConfirmingExchange(false);
    }
  };

  // 关闭交换弹窗
  const handleCloseExchangeModal = () => {
    setExchangeModalVisible(false);
    setSelectedExchangeRecord(null);
    setExchangeDetailInfo(null);
  };

  // 检查是否可以发起交换请求（1小时内限制）
  const canInitiateExchange = (targetUserId: number): { allowed: boolean; remainingTime?: number } => {
    const currentUser = authUtils.getCurrentUser();
    if (!currentUser || !currentUser.id) {
      return { allowed: true };
    }

    const currentUserId = currentUser.id.toString();
    const storageKey = `wechat_exchange_${currentUserId}_${targetUserId}`;
    const lastRequestTime = localStorage.getItem(storageKey);

    if (!lastRequestTime) {
      return { allowed: true };
    }

    const lastTime = parseInt(lastRequestTime, 10);
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const timeDiff = now - lastTime;

    if (timeDiff < oneHour) {
      const remainingMs = oneHour - timeDiff;
      const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
      return { allowed: false, remainingTime: remainingMinutes };
    }

    return { allowed: true };
  };

  // 记录交换请求时间戳
  const recordExchangeRequest = (targetUserId: number) => {
    const currentUser = authUtils.getCurrentUser();
    if (!currentUser || !currentUser.id) {
      return;
    }

    const currentUserId = currentUser.id.toString();
    const storageKey = `wechat_exchange_${currentUserId}_${targetUserId}`;
    localStorage.setItem(storageKey, Date.now().toString());
  };

  // 更新微信
  const handleUpdateWechat = async () => {
    if (!selectedExchangeRecord) return;

    const targetUserId = selectedExchangeRecord.otherUserId;

    // 检查1小时内是否已经发起过请求
    const { allowed, remainingTime } = canInitiateExchange(targetUserId);
    if (!allowed) {
      messageApi.warning(`您在一个小时内已经向该用户发起过交换请求，请等待 ${remainingTime} 分钟后再试`);
      return;
    }

    try {
      setUpdatingWechat(true);
      const response = await updateWechat({ targetUserId });

      if (response.success && response.data) {
        // 记录请求时间戳
        recordExchangeRequest(targetUserId);
        // 更新交换信息中的微信号
        setExchangeDetailInfo(prev => prev ? {
          ...prev,
          otherWechat: response.data!.otherWechat
        } : null);
        // 更新列表中的记录
        setExchangeRecords(prev => prev.map(record => 
          record.id === selectedExchangeRecord.id 
            ? { ...record, otherWechat: response.data!.otherWechat }
            : record
        ));
        messageApi.success('微信更新成功');
      } else {
        messageApi.error(response.message || '更新微信失败');
      }
    } catch (err) {
      messageApi.error(err instanceof Error ? err.message : '更新微信失败');
    } finally {
      setUpdatingWechat(false);
    }
  };

  // 跳转到个人信息页管理微信号
  const handleManageWechat = () => {
    setExchangeModalVisible(false);
    setSelectedExchangeRecord(null);
    setExchangeDetailInfo(null);
    navigate('/profile');
  };

  // 处理通知点击
  const handleNotificationClick = async (notification: Notification) => {
    // 如果未读，先标记为已读
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // 根据通知类型跳转
    if (notification.type === 'comment' || notification.type === 'reply') {
      // 跳转到相关帖子
      navigate(`/post/${notification.post_id}`);
    }
  };

  return (
    <>
      {contextHolder}
      <div className="min-h-screen bg-slate-50/50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div>
                <h1 className="text-3xl font-medium text-slate-800 tracking-tight font-sans">消息中心</h1>
                <p className="text-slate-500 text-lg font-normal font-sans leading-relaxed mt-2">
                  {unreadCount > 0 ? `${unreadCount} 条未读消息` : '暂无未读消息'}
                </p>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="bg-slate-100/50 rounded-[2rem] p-1.5 mb-8">
            <div className="flex">
              {[
                { key: 'comment', label: '评论', count: notifications.filter(n => n.type === 'comment').length },
                { key: 'wechat', label: '微信', count: exchangeRecords.length }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key as 'comment' | 'wechat')}
                  className={`flex-1 py-4 px-6 text-base font-medium rounded-[1.5rem] transition-all duration-300 font-sans ${filter === tab.key
                    ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-slate-900'
                    : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
          </div>

          {unreadCount > 0 && (
            <div className="text-end mb-6">
              <button
                onClick={markAllAsRead}
                className="bg-white border border-slate-200 text-slate-700 px-8 py-3 rounded-full hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] hover:scale-[1.02] hover:border-slate-300 transition-all duration-300 font-medium font-sans"
              >
                全部标记已读
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50/80 backdrop-blur-sm border-0 ring-1 ring-red-100 text-red-600/90 px-6 py-4 rounded-[2rem] mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-sans">!</span>
                </div>
                <span className="font-medium font-sans">{error}</span>
                <button
                  onClick={() => {
                    if (filter === 'wechat') {
                      fetchExchangeRecords(1);
                    } else {
                      fetchNotifications(1, 'comment');
                    }
                  }}
                  className="ml-auto bg-white border border-red-200 text-red-600 px-4 py-2 rounded-full hover:shadow-[0_4px_12px_rgba(220,38,38,0.12)] hover:scale-[1.02] transition-all duration-300 text-sm font-medium font-sans"
                >
                  重试
                </button>
              </div>
            </div>
          )}

          {/* Notifications List or Exchange Records */}
          {filter === 'wechat' ? (
            // 微信交换记录列表
            exchangeLoading && exchangeRecords.length === 0 ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-200 border-t-slate-600 mx-auto mb-6"></div>
                <p className="text-slate-600 text-lg font-medium font-sans">加载中...</p>
              </div>
            ) : exchangeRecords.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 rounded-[2rem] bg-slate-100 flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">💬</span>
                </div>
                <h3 className="text-2xl font-medium text-slate-800 mb-3 font-sans">暂无交换记录</h3>
                <p className="text-slate-500 mb-8 max-w-md mx-auto text-lg font-normal font-sans leading-relaxed">
                  您还没有微信交换记录
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {exchangeRecords.map((record) => (
                  <div
                    key={record.id}
                    onClick={() => handleExchangeRecordClick(record)}
                    className="bg-white border border-slate-100 rounded-[2rem] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.04)] p-6 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 cursor-pointer relative group"
                  >
                    {/* 细分类型标签 - 右上角 */}
                    {record.subcategoryName && (
                      <div className="absolute top-4 right-4">
                        <span className="inline-flex items-center gap-1.5 bg-slate-50 text-slate-600 px-3 py-1 rounded-full text-xs font-medium tracking-wide ring-1 ring-slate-100 font-sans">
                          <span>{getSubCategoryIcon(record.subcategoryName)}</span>
                          <span>{record.subcategoryName}</span>
                        </span>
                      </div>
                    )}
                   <div className="flex items-start space-x-4">
                     {/* Avatar */}
                     <div className="flex-shrink-0 mt-1">
                       <div 
                         className="h-12 w-12 rounded-full bg-slate-900 flex items-center justify-center text-white font-medium cursor-pointer hover:bg-slate-800 transition-colors font-sans shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
                         onClick={(e) => {
                           e.stopPropagation();
                           navigate(`/user/${record.otherUserId}`);
                         }}
                       >
                         {record.otherNickname?.charAt(0) || '?'}
                       </div>
                     </div>

                     {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2 flex-wrap">
                              <h4 className="text-lg font-medium text-slate-900 font-sans">
                                {record.myRole === 'initiator' ? '我向' : ''} {record.otherNickname} {record.myRole === 'receiver' ? '向我' : ''}发起交换
                              </h4>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium font-sans ${getExchangeStatusColor(record.status)}`}>
                                {getExchangeStatusText(record.status)}
                              </span>
                            </div>

                            {record.status === 1 && record.otherWechat && (
                              <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-3 mb-2">
                                <p className="text-sm text-slate-600 mb-1 font-normal font-sans">对方的微信号：<span className="text-base font-medium text-slate-900 font-sans">{record.otherWechat}</span></p>
                              </div>
                            )}

                            <p className="text-sm text-slate-400 mt-2 font-normal font-sans">
                              {formatDate(record.createdAt)}
                              {record.completedAt && ` · 完成于 ${formatDate(record.completedAt)}`}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : loading && notifications.length === 0 ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-200 border-t-slate-600 mx-auto mb-6"></div>
              <p className="text-slate-600 text-lg font-medium font-sans">加载中...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 rounded-[2rem] bg-slate-100 flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">🔔</span>
              </div>
              <h3 className="text-2xl font-medium text-slate-800 mb-3 font-sans">暂无通知</h3>
              <p className="text-slate-500 mb-8 max-w-md mx-auto text-lg font-normal font-sans leading-relaxed">
                当有人评论你的帖子时，你会在这里收到通知
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`bg-white border rounded-[2rem] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.04)] p-6 cursor-pointer hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 relative group ${!notification.is_read ? 'border-blue-200 bg-blue-50/30' : 'border-slate-100'
                    }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-4">
                    {/* Icon / Avatar */}
                    <div className="flex-shrink-0 mt-1">
                      <div
                        className="h-12 w-12 rounded-full bg-slate-900 flex items-center justify-center text-white font-medium cursor-pointer hover:bg-slate-800 transition-colors font-sans shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/user/${notification.sender_id}`);
                        }}
                      >
                        {notification.sender_nickname?.charAt(0) || '?'}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className={`text-base mt-2 leading-loose font-normal font-sans ${!notification.is_read ? 'text-slate-700' : 'text-slate-500'}`}>
                            {notification.sender_nickname}评论了你：{notification.content}
                          </p>
                          <p className="text-sm text-slate-400 mt-3 font-normal font-sans">
                            {formatDate(notification.created_at)}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 ml-4">
                          {!notification.is_read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-full transition-all duration-300"
                              title="标记已读"
                            >
                              <CheckIcon className="h-5 w-5" />
                            </button>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-300"
                            title="删除通知"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>

                      {/* Unread indicator */}
                      {!notification.is_read && (
                        <div className="absolute top-6 right-6">
                          <div className="w-3 h-3 bg-blue-500 rounded-full ring-2 ring-white"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 滚动加载提示 - 评论列表 */}
          {filter === 'comment' && loadingMore && notifications.length > 0 && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-t-slate-600 mx-auto"></div>
              <p className="text-slate-500 mt-2 text-sm font-normal font-sans">加载更多...</p>
            </div>
          )}

          {/* 滚动加载提示 - 微信交换记录列表 */}
          {filter === 'wechat' && loadingMoreExchanges && exchangeRecords.length > 0 && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-t-slate-600 mx-auto"></div>
              <p className="text-slate-500 mt-2 text-sm font-normal font-sans">加载更多...</p>
            </div>
          )}
        </div>
      </div>

      {/* 交换详情弹窗 */}
      <Modal
        open={exchangeModalVisible}
        onCancel={handleCloseExchangeModal}
        centered
        width={400}
        footer={null}
        styles={{
          content: {
            borderRadius: '32px',
            padding: '32px',
          },
        }}
      >
        <div className="py-4">
          {exchangeDetailLoading ? (
            // 加载状态
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-slate-600 mx-auto mb-4"></div>
              <p className="text-slate-600 font-normal font-sans">加载中...</p>
            </div>
          ) : exchangeDetailInfo?.exists && exchangeDetailInfo.status === 1 ? (
            // 已经交换成功，显示对方的微信号
            <div>
              <h3 className="text-2xl font-medium text-slate-900 mb-4 text-center font-sans tracking-tight">
                交换成功
              </h3>
              <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 mb-4">
                <p className="text-sm text-slate-600 mb-2 font-normal font-sans">对方的微信号：</p>
                <p className="text-lg font-medium text-slate-900 font-sans">{exchangeDetailInfo.otherWechat || '未设置'}</p>
              </div>
              <p className="text-slate-500 text-xs text-center mb-6 font-normal font-sans leading-relaxed">
                双方确认交换后，可以在通知里看到对方的微信号。
                <button
                  onClick={handleManageWechat}
                  className="text-slate-600 hover:text-slate-800 underline ml-1 transition-colors font-sans"
                >
                  您可前往管理微信号
                </button>
              </p>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={handleUpdateWechat}
                  disabled={updatingWechat}
                  className="px-6 py-2 bg-slate-900 text-white rounded-full hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] hover:scale-[1.02] transition-all duration-300 font-medium font-sans disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updatingWechat ? '更新中...' : '更新微信'}
                </button>
              </div>
            </div>
          ) : exchangeDetailInfo?.exists && exchangeDetailInfo.status === 0 && exchangeDetailInfo.waitingFor === 'me' ? (
            // 等待我确认，可以确认交换
            <div>
              <h3 className="text-2xl font-medium text-slate-900 mb-4 text-center font-sans tracking-tight">
                确认交换微信
              </h3>
              <p className="text-slate-500 text-sm leading-loose text-center mb-6 font-normal font-sans">
                {selectedExchangeRecord?.otherNickname} 向您发起了微信交换请求。
                <br />
                确认后，双方将可以看到对方的微信号。
              </p>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={handleCloseExchangeModal}
                  className="px-6 py-2 bg-white border border-slate-200 text-slate-700 rounded-full hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] hover:scale-[1.02] hover:border-slate-300 transition-all duration-300 font-medium font-sans"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmExchange}
                  disabled={confirmingExchange}
                  className="px-6 py-2 bg-slate-900 text-white rounded-full hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] hover:scale-[1.02] transition-all duration-300 font-medium font-sans disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {confirmingExchange ? '确认中...' : '确认交换'}
                </button>
              </div>
            </div>
          ) : (
            // 其他状态（等待对方确认、已拒绝、已过期等）
            <div>
              <h3 className="text-2xl font-medium text-slate-900 mb-4 text-center font-sans tracking-tight">
                交换详情
              </h3>
              <div className="mb-4">
                <p className="text-sm text-slate-600 mb-2 font-normal font-sans">状态：</p>
                <span className={`px-3 py-1 rounded-full text-xs font-medium inline-block font-sans ${getExchangeStatusColor(selectedExchangeRecord?.status || 0)}`}>
                  {getExchangeStatusText(selectedExchangeRecord?.status || 0)}
                </span>
              </div>
              {selectedExchangeRecord?.status === 0 && exchangeDetailInfo?.waitingFor === 'other' && (
                <p className="text-slate-500 text-sm text-center mb-6 font-normal font-sans leading-relaxed">
                  等待对方确认交换请求
                </p>
              )}
              {selectedExchangeRecord?.status === 2 && (
                <p className="text-slate-500 text-sm text-center mb-6 font-normal font-sans leading-relaxed">
                  对方已拒绝交换请求
                </p>
              )}
              {selectedExchangeRecord?.status === 3 && (
                <p className="text-slate-500 text-sm text-center mb-6 font-normal font-sans leading-relaxed">
                  交换请求已过期
                </p>
              )}
              <div className="flex items-center justify-center">
                <button
                  onClick={handleCloseExchangeModal}
                  className="px-6 py-2 bg-slate-900 text-white rounded-full hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] hover:scale-[1.02] transition-all duration-300 font-medium font-sans"
                >
                  确定
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
} 