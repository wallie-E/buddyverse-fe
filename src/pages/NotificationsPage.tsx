import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BellIcon,
  ChatBubbleLeftIcon,
  TrashIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { API, authUtils } from '../api';
import { useNotification } from '../hooks/useNotification';
import type { Notification } from '../api/types';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { unreadCount, decrementUnreadCount, clearUnreadCount } = useNotification();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'comment' | 'reply' | 'system'>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // 检查登录状态
  useEffect(() => {
    if (!authUtils.isAuthenticated()) {
      navigate('/login');
      return;
    }
  }, [navigate]);

  // 获取通知列表
  const fetchNotifications = useCallback(async (pageNum = 1, filterType = filter) => {
    try {
      setLoading(true);
      setError('');

      const response = await API.notifications.getNotifications({
        page: pageNum,
        limit: 20,
        type: filterType === 'all' ? undefined : filterType
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
      setLoading(false);
    }
  }, [filter]);

  // 筛选变化时重新加载
  useEffect(() => {
    setPage(1);
    fetchNotifications(1, filter);
  }, [filter, fetchNotifications]);

  // 加载更多
  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage, filter);
  };

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

  // 获取通知图标
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'comment':
        return <ChatBubbleLeftIcon className="h-6 w-6 text-blue-600" />;
      case 'reply':
        return <ChatBubbleLeftIcon className="h-6 w-6 text-green-600" />;
      case 'system':
        return <BellIcon className="h-6 w-6 text-purple-600" />;
      default:
        return <BellIcon className="h-6 w-6 text-gray-600" />;
    }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="flex items-center justify-center space-x-4 mb-4">
            {/* <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <BellIcon className="h-8 w-8 text-white" />
            </div> */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">通知中心</h1>
              <p className="text-gray-600 text-lg">
                {unreadCount > 0 ? `${unreadCount} 条未读消息` : '暂无未读消息'}
              </p>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-2xl shadow-sm mb-8">
          <div className="flex">
            {[
              { key: 'all', label: '全部', count: notifications.length },
              { key: 'comment', label: '评论', count: notifications.filter(n => n.type === 'comment').length },
              // // { key: 'reply', label: '评论回复', count: notifications.filter(n => n.type === 'reply').length },
              { key: 'system', label: '通知', count: notifications.filter(n => n.type === 'system').length }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as 'all' | 'comment' | 'reply' | 'system')}
                className={`flex-1 py-4 px-6 text-base font-semibold rounded-2xl m-2 transition-all duration-300 ${filter === tab.key
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {unreadCount > 0 && (
          <div className="text-end mb-4">
            <button
              onClick={markAllAsRead}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
            >
              全部标记已读
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-600 px-6 py-4 rounded-2xl mb-6 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">!</span>
              </div>
              <span className="font-medium">{error}</span>
              <button
                onClick={() => fetchNotifications(1)}
                className="ml-auto bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition-colors text-sm font-medium"
              >
                重试
              </button>
            </div>
          </div>
        )}

        {/* Notifications List */}
        {loading && notifications.length === 0 ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-6"></div>
            <p className="text-gray-600 text-lg font-medium">加载中...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-r from-slate-200 to-slate-300 flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🔔</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3">暂无通知</h3>
            <p className="text-slate-600 mb-8 max-w-md mx-auto text-lg">
              当有人评论你的帖子时，你会在这里收到通知
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-2xl shadow-sm p-6 cursor-pointer hover:shadow-lg transition-all duration-300 ${!notification.is_read ? 'border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50' : 'border border-gray-100'
                  }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start space-x-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${notification.type === 'comment' ? 'bg-gradient-to-r from-blue-100 to-blue-200' :
                        notification.type === 'reply' ? 'bg-gradient-to-r from-green-100 to-green-200' :
                          notification.type === 'system' ? 'bg-gradient-to-r from-purple-100 to-purple-200' :
                            'bg-gradient-to-r from-gray-100 to-gray-200'
                      }`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className={`text-lg font-semibold ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </h4>
                        <p className={`text-base mt-2 leading-relaxed ${!notification.is_read ? 'text-gray-700' : 'text-gray-500'}`}>
                          {notification.content}
                        </p>
                        <p className="text-sm text-gray-500 mt-3 font-medium">
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
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-xl transition-all duration-300"
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
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-xl transition-all duration-300"
                          title="删除通知"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    {/* Unread indicator */}
                    {!notification.is_read && (
                      <div className="absolute top-6 right-6">
                        <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full shadow-sm"></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center pt-8">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-2xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 disabled:opacity-50 font-medium shadow-lg hover:shadow-xl"
                >
                  {loading ? '加载中...' : '加载更多'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 