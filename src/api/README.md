# API 接口使用说明

这个目录包含了完整的后端API接口封装，基于axios实现，支持TypeScript类型检查。

## 文件结构

```
src/api/
├── config.ts          # axios配置文件
├── types.ts           # TypeScript类型定义
├── auth.ts            # 认证相关接口
├── users.ts           # 用户管理接口
├── posts.ts           # 帖子管理接口
├── comments.ts        # 评论管理接口
├── categories.ts      # 分类管理接口
├── notifications.ts   # 通知管理接口
├── admin.ts           # 管理员接口
├── index.ts           # 统一导出文件
├── example.ts         # 使用示例
└── README.md          # 说明文档
```

## 基础配置

### 服务器地址
- **Base URL**: `https://buddyverse.ns-kuoqmx4b.svc.cluster.local:3000`
- **认证方式**: Bearer Token (JWT)
- **数据格式**: JSON

### 自动处理功能

1. **自动添加认证Token**: 请求拦截器会自动从localStorage获取token并添加到请求头
2. **统一错误处理**: 响应拦截器会统一处理401错误（自动清除token并跳转登录页）
3. **超时设置**: 10秒请求超时
4. **类型安全**: 完整的TypeScript类型定义

## 快速开始

### 1. 导入API

```typescript
import { API, authUtils } from '../api';
// 或者按需导入
import { login, register } from '../api';
```

### 2. 认证相关

```typescript
// 用户注册
const handleRegister = async () => {
  try {
    const response = await API.auth.register({
      email: 'user@example.com',
      password: 'password123',
      nickname: '用户昵称'
    });
    
    if (response.success) {
      // 保存登录信息
      authUtils.saveAuth(response.data.token, response.data.user);
    }
  } catch (error) {
    console.error('注册失败:', error);
  }
};

// 用户登录
const handleLogin = async () => {
  try {
    const response = await API.auth.login({
      email: 'user@example.com',
      password: 'password123'
    });
    
    if (response.success) {
      authUtils.saveAuth(response.data.token, response.data.user);
    }
  } catch (error) {
    console.error('登录失败:', error);
  }
};

// 获取当前用户信息
const currentUser = authUtils.getCurrentUser();
const isLoggedIn = authUtils.isAuthenticated();
const isAdmin = authUtils.isAdmin();

// 退出登录
authUtils.logout();
```

### 3. 帖子相关

```typescript
// 获取帖子列表
const fetchPosts = async () => {
  try {
    const response = await API.posts.getPosts({
      page: 1,
      limit: 10,
      category_id: 1 // 可选的分类筛选
    });
    
    if (response.success) {
      console.log('帖子列表:', response.data.list);
      console.log('分页信息:', response.data.pagination);
    }
  } catch (error) {
    console.error('获取帖子失败:', error);
  }
};

// 创建帖子
const createPost = async () => {
  try {
    const response = await API.posts.createPost({
      content: '帖子内容',
      location: '发布位置',
      category_id: 1,
      subcategory_id: 1,
      comment_visibility: 'public'
    });
    
    if (response.success) {
      console.log('帖子创建成功:', response.data);
    }
  } catch (error) {
    console.error('创建帖子失败:', error);
  }
};

// 获取帖子详情
const getPostDetail = async (postId: number) => {
  try {
    const response = await API.posts.getPostById(postId);
    if (response.success) {
      console.log('帖子详情:', response.data);
    }
  } catch (error) {
    console.error('获取帖子详情失败:', error);
  }
};
```

### 4. 评论相关

```typescript
// 获取帖子评论
const fetchComments = async (postId: number) => {
  try {
    const response = await API.comments.getPostComments(postId, {
      page: 1,
      limit: 10
    });
    
    if (response.success) {
      console.log('评论列表:', response.data.list);
    }
  } catch (error) {
    console.error('获取评论失败:', error);
  }
};

// 创建评论
const createComment = async (postId: number) => {
  try {
    const response = await API.comments.createComment({
      post_id: postId,
      content: '评论内容'
    });
    
    if (response.success) {
      console.log('评论创建成功:', response.data);
    }
  } catch (error) {
    console.error('创建评论失败:', error);
  }
};
```

### 5. 通知相关

```typescript
// 获取通知列表
const fetchNotifications = async () => {
  try {
    const response = await API.notifications.getNotifications({
      page: 1,
      limit: 20,
      type: 'comment' // 可选的类型筛选: comment/reply/system
    });
    
    if (response.success) {
      console.log('通知列表:', response.data.list);
    }
  } catch (error) {
    console.error('获取通知失败:', error);
  }
};

// 获取未读通知数量
const getUnreadCount = async () => {
  try {
    const response = await API.notifications.getUnreadCount();
    if (response.success) {
      console.log('未读数量:', response.data.count);
    }
  } catch (error) {
    console.error('获取未读数量失败:', error);
  }
};

// 标记通知为已读
const markAsRead = async (notificationId: number) => {
  try {
    await API.notifications.markAsRead(notificationId);
  } catch (error) {
    console.error('标记已读失败:', error);
  }
};
```

### 6. 分类相关

```typescript
// 获取所有分类
const fetchCategories = async () => {
  try {
    const response = await API.categories.getCategories();
    if (response.success) {
      console.log('分类列表:', response.data);
    }
  } catch (error) {
    console.error('获取分类失败:', error);
  }
};

// 获取指定分类的细分类型
const fetchSubcategories = async (categoryId: number) => {
  try {
    const response = await API.categories.getSubcategories(categoryId);
    if (response.success) {
      console.log('细分类型:', response.data.subcategories);
    }
  } catch (error) {
    console.error('获取细分类型失败:', error);
  }
};
```

### 7. 管理员相关

```typescript
// 检查管理员权限
if (!authUtils.isAdmin()) {
  console.error('需要管理员权限');
  return;
}

// 获取统计数据
const fetchStats = async () => {
  try {
    const response = await API.admin.getStats();
    if (response.success) {
      console.log('统计数据:', response.data);
    }
  } catch (error) {
    console.error('获取统计数据失败:', error);
  }
};

// 管理用户
const manageUsers = async () => {
  // 获取用户列表
  const usersResponse = await API.admin.adminUsers.list({
    page: 1,
    limit: 20,
    status: 'active'
  });

  // 修改用户状态
  await API.admin.adminUsers.updateStatus(userId, { status: 'banned' });

  // 删除用户
  await API.admin.adminUsers.delete(userId);
};
```

## React组件中的使用示例

```typescript
import { useState, useEffect } from 'react';
import { API, authUtils } from '../api';
import type { Post } from '../api/types';

export const PostList = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const response = await API.posts.getPosts({ page: 1, limit: 10 });
        if (response.success) {
          setPosts(response.data.list);
        }
      } catch (error) {
        console.error('获取帖子失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) return <div>加载中...</div>;

  return (
    <div>
      {posts.map(post => (
        <div key={post.id}>
          <h3>{post.content}</h3>
          <p>作者: {post.author_name}</p>
          <p>分类: {post.category_name} - {post.subcategory_name}</p>
          <p>发布时间: {new Date(post.created_at).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
};
```

## 错误处理

所有API调用都应该包装在try-catch块中进行错误处理：

```typescript
try {
  const response = await API.posts.getPosts();
  if (response.success) {
    // 处理成功响应
  }
} catch (error) {
  // 错误已经被axios拦截器处理，这里可以进行UI层面的错误提示
  console.error('操作失败:', error.message);
  // 显示错误提示给用户
}
```

## 常见错误码

- `200` - 请求成功
- `201` - 创建成功
- `400` - 请求参数错误
- `401` - 未认证或认证失败（会自动跳转登录页）
- `403` - 权限不足
- `404` - 资源不存在
- `409` - 资源冲突
- `500` - 服务器内部错误

## 注意事项

1. **认证**: 大部分接口需要登录认证，确保在调用前用户已登录
2. **权限**: 管理员接口需要管理员权限，使用前请检查 `authUtils.isAdmin()`
3. **类型安全**: 使用TypeScript类型定义确保类型安全
4. **错误处理**: 所有API调用都要进行适当的错误处理
5. **分页**: 列表接口支持分页，注意处理分页逻辑

## 默认管理员账户

- 邮箱: `admin@example.com`
- 密码: `password`
- 角色: `admin`

**注意**: 生产环境请及时修改默认密码！ 