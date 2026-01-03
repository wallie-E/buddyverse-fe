// 用户类型
export interface User {
  id: string;
  email: string;
  nickname: string;
  avatar?: string;
  gender: 'male' | 'female' | 'other';
  signature?: string;
  role: 'user' | 'admin';
  registeredAt: string;
  postCount: number;
  commentCount: number;
}

// 帖子主分类
export type MainCategory = 'food' | 'study' | 'sports' | 'game' | 'anime' | 'travel';

// 细分类型
export interface SubCategory {
  id: string;
  name: string;
  icon: string;
  mainCategory: MainCategory;
}

// 帖子类型
export interface Post {
  id: string;
  content: string;
  location: string;
  mainCategory: MainCategory;
  subCategory: string;
  isPrivateComments: boolean;
  authorId: string;
  author: User;
  createdAt: string;
  commentCount: number;
  comments: Comment[];
}

// 评论类型
export interface Comment {
  id: string;
  content: string;
  postId: string;
  authorId: string;
  author: User;
  parentId?: string; // 二级回复的父评论ID
  createdAt: string;
  replies?: Comment[];
  user_id: string;
}

// 通知类型
export interface Notification {
  id: string;
  type: 'comment' | 'reply';
  postId: string;
  commentId?: string;
  fromUserId: string;
  fromUser: User;
  toUserId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

// 表单类型
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  nickname: string;
  gender: 'male' | 'female';
}

export interface PostForm {
  content: string;
  location: string;
  mainCategory: MainCategory;
  subCategory: string;
  isPrivateComments: boolean;
} 