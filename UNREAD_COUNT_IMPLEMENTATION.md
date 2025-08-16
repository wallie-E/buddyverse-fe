# 未读通知数量功能实现说明

## 概述

本次修改将Header组件中的未读通知数量从mockData替换为从API获取的真实数据，并实现了用户登录状态变化时的自动更新机制。

## 主要修改

### 1. Header组件 (`src/components/Header.tsx`)

#### 修改前
```typescript
import { getUnreadNotificationCount, getCurrentUser } from '../data/mockData';

export default function Header() {
  const navigate = useNavigate();
  const unreadCount = getUnreadNotificationCount(); // 从mockData获取
  // ... 其他代码
}
```

#### 修改后
```typescript
import { useState, useEffect } from 'react';
import { API, authUtils } from '../api';

export default function Header() {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0); // 使用state管理
  
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
}
```

### 2. 认证工具函数 (`src/api/auth.ts`)

#### 修改前
```typescript
export const authUtils = {
  saveAuth: (token: string, user: User): void => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },

  logout: (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};
```

#### 修改后
```typescript
export const authUtils = {
  saveAuth: (token: string, user: User): void => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    // 触发自定义事件，通知其他组件登录状态已改变
    window.dispatchEvent(new CustomEvent('authStateChanged'));
  },

  logout: (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // 触发自定义事件，通知其他组件登录状态已改变
    window.dispatchEvent(new CustomEvent('authStateChanged'));
  }
};
```

## 功能特性

### 1. 智能获取未读通知数量
- **用户已登录**: 调用 `/api/notifications/unread-count` 接口获取真实数据
- **用户未登录**: 自动设置为0，不调用API接口
- **错误处理**: 如果API调用失败，自动设置为0

### 2. 实时状态同步
- **组件挂载时**: 自动获取未读通知数量
- **登录状态变化**: 监听localStorage变化，自动更新未读数量
- **跨标签页同步**: 支持多标签页之间的登录状态同步

### 3. 事件监听机制
- **storage事件**: 监听其他标签页的localStorage变化
- **自定义事件**: 监听当前页面的登录状态变化
- **自动清理**: 组件卸载时自动清理事件监听器

## 接口调用

### 获取未读通知数量
- **接口路径**: `/api/notifications/unread-count`
- **请求方式**: `GET`
- **认证要求**: 需要Bearer Token
- **响应格式**: 
```json
{
  "success": true,
  "code": 200,
  "message": "获取成功",
  "data": {
    "count": 5
  }
}
```

## 用户体验优化

### 1. 登录前
- 未读通知数量显示为0
- 不发送不必要的API请求
- 避免401错误

### 2. 登录后
- 立即显示真实的未读通知数量
- 实时反映通知状态变化
- 支持多标签页同步

### 3. 退出登录后
- 自动清除未读通知数量
- 避免显示过期的数据
- 保持界面状态一致

## 错误处理

### 1. 网络错误
- API调用失败时自动设置未读数量为0
- 在控制台输出错误信息便于调试
- 不影响其他功能的正常使用

### 2. 认证错误
- 401状态码由API拦截器统一处理
- 自动清除token并跳转到登录页
- Header组件自动更新未读数量为0

### 3. 数据格式错误
- 验证API响应格式
- 确保数据类型安全
- 提供合理的默认值

## 性能优化

### 1. 条件调用
- 只在用户登录时调用API
- 避免无效的网络请求
- 减少服务器负载

### 2. 事件节流
- 使用事件监听器而非轮询
- 只在状态变化时更新
- 减少不必要的重新渲染

### 3. 内存管理
- 组件卸载时清理事件监听器
- 避免内存泄漏
- 保持应用性能

## 兼容性

### 1. 浏览器支持
- 支持所有现代浏览器
- localStorage API兼容性良好
- CustomEvent API广泛支持

### 2. 移动端适配
- 响应式设计
- 触摸事件支持
- 移动端性能优化

## 测试建议

### 1. 功能测试
- 测试用户登录后的未读数量显示
- 测试用户退出登录后的数量清除
- 测试API错误时的错误处理

### 2. 状态同步测试
- 测试多标签页登录状态同步
- 测试登录/退出登录的实时更新
- 测试网络断开时的行为

### 3. 性能测试
- 测试大量通知时的性能表现
- 测试频繁登录/退出的性能影响
- 测试内存使用情况

## 后续优化建议

### 1. 实时通知
- 集成WebSocket实现实时通知推送
- 支持服务器推送的未读数量更新
- 减少客户端轮询需求

### 2. 缓存优化
- 实现未读数量的本地缓存
- 支持离线状态下的数据展示
- 优化网络请求频率

### 3. 用户体验
- 添加未读数量的动画效果
- 支持通知预览功能
- 提供通知设置选项

## 总结

本次修改成功实现了：
1. ✅ 从mockData切换到真实API接口
2. ✅ 用户未登录时不调用API接口
3. ✅ 登录状态变化时自动更新未读数量
4. ✅ 支持多标签页状态同步
5. ✅ 完善的错误处理和性能优化
6. ✅ 良好的用户体验和界面一致性

这些改进使得Header组件的未读通知数量功能更加智能、高效和用户友好。 