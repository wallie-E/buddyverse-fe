import { useState, useEffect, type ReactNode } from 'react';
import { API, authUtils } from '../api';
import { NotificationContext, type NotificationContextType } from './NotificationContext';

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  // 获取未读通知数量
  const fetchUnreadCount = async () => {
    // 检查用户是否已登录
    if (!authUtils.isAuthenticated()) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await API.notifications.getUnreadCount();
      if (response.success) {
        setUnreadCount(response.data.count);
      }
    } catch (error) {
      console.error('获取未读通知数量失败:', error);
      setUnreadCount(0);
    }
  };

  // 减少未读数量（标记单个通知为已读时使用）
  const decrementUnreadCount = () => {
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // 清空未读数量（标记所有通知为已读时使用）
  const clearUnreadCount = () => {
    setUnreadCount(0);
  };

  // 组件挂载时获取未读通知数量
  useEffect(() => {
    fetchUnreadCount();

    // 监听localStorage变化，当登录状态改变时重新获取未读通知数量
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' || e.key === 'user') {
        fetchUnreadCount();
      }
    };

    // 监听其他标签页的localStorage变化
    window.addEventListener('storage', handleStorageChange);

    // 监听当前页面的localStorage变化（通过自定义事件）
    const handleCustomStorageChange = () => {
      fetchUnreadCount();
    };

    // 创建自定义事件监听器
    window.addEventListener('authStateChanged', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authStateChanged', handleCustomStorageChange);
    };
  }, []);

  const value: NotificationContextType = {
    unreadCount,
    setUnreadCount,
    fetchUnreadCount,
    decrementUnreadCount,
    clearUnreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}; 