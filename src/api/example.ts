/**
 * API 使用示例
 * 
 * 这个文件展示了如何在React组件中使用各种API接口
 */

import { API, authUtils } from './index';
import type { 
  RegisterRequest, 
  LoginRequest, 
  CreatePostRequest, 
} from './types';

// ======================== 认证示例 ========================

// 注册示例
export const handleRegister = async (formData: RegisterRequest) => {
  try {
    const response = await API.auth.register(formData);
    if (response.success) {
      // 保存登录信息
      authUtils.saveAuth(response.data.token, response.data.user);
      console.log('注册成功:', response.data.user);
    }
  } catch (error) {
    console.error('注册失败:', error);
  }
};

// 登录示例
export const handleLogin = async (formData: LoginRequest) => {
  try {
    const response = await API.auth.login(formData);
    if (response.success) {
      // 保存登录信息
      authUtils.saveAuth(response.data.token, response.data.user);
      console.log('登录成功:', response.data.user);
    }
  } catch (error) {
    console.error('登录失败:', error);
  }
};

// 获取用户信息示例
export const handleGetProfile = async () => {
  try {
    const response = await API.auth.getProfile();
    if (response.success) {
      console.log('用户信息:', response.data);
    }
  } catch (error) {
    console.error('获取用户信息失败:', error);
  }
};

// ======================== 帖子示例 ========================

// 创建帖子示例
export const handleCreatePost = async (postData: CreatePostRequest) => {
  try {
    const response = await API.posts.createPost(postData);
    if (response.success) {
      console.log('帖子创建成功:', response.data);
    }
  } catch (error) {
    console.error('创建帖子失败:', error);
  }
};

// 获取帖子列表示例
export const handleGetPosts = async (page = 1, categoryId?: number) => {
  try {
    const response = await API.posts.getPosts({ 
      page, 
      limit: 10, 
      category_id: categoryId 
    });
    if (response.success) {
      console.log('帖子列表:', response.data.list);
      console.log('分页信息:', response.data.pagination);
    }
  } catch (error) {
    console.error('获取帖子列表失败:', error);
  }
};


// ======================== 通知示例 ========================

// 获取通知列表示例
export const handleGetNotifications = async (page = 1) => {
  try {
    const response = await API.notifications.getNotifications({ page, limit: 20 });
    if (response.success) {
      console.log('通知列表:', response.data.list);
    }
  } catch (error) {
    console.error('获取通知失败:', error);
  }
};

// 获取未读通知数量示例
export const handleGetUnreadCount = async () => {
  try {
    const response = await API.notifications.getUnreadCount();
    if (response.success) {
      console.log('未读通知数量:', response.data.count);
    }
  } catch (error) {
    console.error('获取未读通知数量失败:', error);
  }
};

// ======================== 分类示例 ========================

// 获取分类列表示例
export const handleGetCategories = async () => {
  try {
    const response = await API.categories.getCategories();
    if (response.success) {
      console.log('分类列表:', response.data);
    }
  } catch (error) {
    console.error('获取分类失败:', error);
  }
};

// ======================== 管理员示例 ========================

// 获取统计数据示例
export const handleGetAdminStats = async () => {
  try {
    // 检查是否是管理员
    if (!authUtils.isAdmin()) {
      console.error('需要管理员权限');
      return;
    }

    const response = await API.admin.getStats();
    if (response.success) {
      console.log('统计数据:', response.data);
    }
  } catch (error) {
    console.error('获取统计数据失败:', error);
  }
};

// ======================== 在React组件中使用示例 ========================

/*
// 在React组件中使用的示例代码:

import { useState, useEffect } from 'react';
import { API, authUtils } from '../api';
import type { Post, User } from '../api/types';

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
          <p>发布时间: {post.created_at}</p>
        </div>
      ))}
    </div>
  );
};

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await API.auth.login({ email, password });
      if (response.success) {
        authUtils.saveAuth(response.data.token, response.data.user);
        // 跳转到首页或其他页面
      }
    } catch (error) {
      console.error('登录失败:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="邮箱"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="密码"
      />
      <button type="submit">登录</button>
    </form>
  );
};
*/ 