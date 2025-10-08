import { useState, useEffect } from 'react';
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
  const fetchNotifications = async (pageNum = 1, filterType = filter) => {
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
  };

  // 筛选变化时重新加载
  useEffect(() => {
    setPage(1);
    fetchNotifications(1, filter);
  }, [filter]);

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
        return <ChatBubbleLeftIcon className="h-5 w-5 text-blue-600" />;
      case 'reply':
        return <ChatBubbleLeftIcon className="h-5 w-5 text-green-600" />;
      case 'system':
        return <BellIcon className="h-5 w-5 text-purple-600" />;
      default:
        return <BellIcon className="h-5 w-5 text-gray-600" />;
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">通知中心</h1>
              <p className="text-gray-600 mt-1">
                {unreadCount > 0 ? `${unreadCount} 条未读消息` : '暂无未读消息'}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                全部标记已读
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            {[
              { key: 'all', label: '全部', count: notifications.length },
              // { key: 'comment', label: '帖子评论', count: notifications.filter(n => n.type === 'comment').length },
              // // { key: 'reply', label: '评论回复', count: notifications.filter(n => n.type === 'reply').length },
              // { key: 'system', label: '系统通知', count: notifications.filter(n => n.type === 'system').length }
            ].map((tab) => (
              <button
                key={tab.key}
                                 onClick={() => setFilter(tab.key as 'all' | 'comment' | 'reply' | 'system')}
                className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                  filter === tab.key
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
            {error}
            <button 
              onClick={() => fetchNotifications(1)}
              className="ml-2 text-red-700 underline"
            >
              重试
            </button>
          </div>
        )}

        {/* Notifications List */}
        {loading && notifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">加载中...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔔</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无通知</h3>
            <p className="text-gray-600 mb-4">当有人评论或回复你的帖子时，你会在这里收到通知</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-all ${
                  !notification.is_read ? 'border-blue-200 bg-blue-50' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start space-x-3">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className={`text-sm font-medium ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </h4>
                        <p className={`text-sm mt-1 ${!notification.is_read ? 'text-gray-700' : 'text-gray-500'}`}>
                          {notification.content}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
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
                            className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                            title="标记已读"
                          >
                            <CheckIcon className="h-4 w-4" />
                          </button>
                        )}
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="删除通知"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Unread indicator */}
                    {!notification.is_read && (
                      <div className="absolute top-4 right-4">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Load More Button */}
            {hasMore && (
              <div className="text-center pt-6">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  {loading ? '加载中...' : '加载更多'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        {/* <div className="grid grid-cols-2 gap-4 mt-8">
          <button
            onClick={() => navigate('/my-posts')}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-blue-200 transition-colors"
          >
            <h4 className="font-semibold text-gray-900 mb-2">我的帖子</h4>
            <p className="text-sm text-gray-600">查看我发布的所有帖子</p>
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-blue-200 transition-colors"
          >
            <h4 className="font-semibold text-gray-900 mb-2">浏览帖子</h4>
            <p className="text-sm text-gray-600">发现更多有趣的内容</p>
          </button>
        </div> */}
      </div>
    </div>
  );
} 