// 通用响应格式
export interface ApiResponse<T = unknown> {
  success: boolean;
  code: number;
  message: string;
  data: T;
  timestamp: string;
}

// 分页信息
export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// 分页响应
export interface PaginatedResponse<T> {
  list: T[];
  pagination: Pagination;
}

// 用户相关类型
export interface User {
  id: number;
  email: string;
  nickname: string;
  gender: 'male' | 'female' | 'other';
  avatar?: string;
  signature?: string;
  wechat_id?: string;
  qq_id?: string;
  role: 'user' | 'admin';
  status?: 'active' | 'inactive' | 'banned';
  created_at?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  nickname: string;
  gender: 'male' | 'female';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UpdateProfileRequest {
  nickname?: string;
  gender?: 'male' | 'female' | 'other';
  signature?: string;
  wechat_id?: string;
  qq_id?: string;
}

// 帖子相关类型
export interface Post {
  id: number;
  content: string;
  location?: string;
  comment_visibility?: 'public' | 'private';
  comment_count: number;
  created_at: string;
  user_id?: number;
  author_name: string;
  author_email?: string;
  author_gender?: 'male' | 'female' | 'other';
  category_name: string;
  subcategory_name: string;
  status?: 'active' | 'deleted';
}

export interface CreatePostRequest {
  content: string;
  location?: string;
  category_id: number;
  subcategory_id: number;
  comment_visibility?: 'public' | 'private';
}

// 评论相关类型
export interface Comment {
  id: number;
  content: string;
  created_at: string;
  author_name: string;
  author_email?: string;
  post_id?: number;
  post_content?: string;
  status?: 'active' | 'deleted';
  replies?: Comment[];
}

// 用于评论列表的组织化格式
export interface OrganizedComment extends Comment {
  replies: Comment[];
}

export interface CreateCommentRequest {
  post_id: number;
  content: string;
}

// 分类相关类型
export interface Subcategory {
  id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  sort_order: number;
  subcategories: Subcategory[];
}

export interface SubcategoriesResponse {
  category: {
    id: number;
    name: string;
  };
  subcategories: Subcategory[];
}

// 通知相关类型
export interface Notification {
  id: number;
  type: 'comment' | 'reply' | 'system' | 'wechat_exchange_request' | 'wechat_exchange_confirmed';
  title: string;
  content: string;
  post_id: number;
  related_id: number;
  related_type: string;
  is_read: boolean;
  created_at: string;
  sender_id?: number;
  sender_nickname?: string;
}

export interface UnreadCountResponse {
  count: number;
}

// 管理员相关类型
export interface AdminStats {
  users: {
    total_users: number;
    active_users: number;
    admin_users: number;
  };
  posts: {
    total_posts: number;
    active_posts: number;
    today_posts: number;
  };
  comments: {
    total_comments: number;
    active_comments: number;
    today_comments: number;
  };
}

export interface UpdateUserStatusRequest {
  status: 'active' | 'inactive' | 'banned';
}

// 查询参数类型
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PostListParams extends PaginationParams {
  category_id?: number;
  subcategory_id?: number;
  location?: string;
  gender?: 'male' | 'female';
}

export interface NotificationListParams extends PaginationParams {
  type?: 'comment' | 'reply' | 'system' | 'wechat_exchange_request' | 'wechat_exchange_confirmed';
}

export interface AdminUserListParams extends PaginationParams {
  status?: 'active' | 'inactive' | 'banned';
  role?: 'user' | 'admin';
}

export interface AdminPostListParams extends PaginationParams {
  status?: 'active' | 'deleted';
  category_id?: number;
  user_id?: number;
}

// 管理员获取用户帖子响应类型
export interface AdminUserPostsResponse {
  user: User;
  posts: {
    list: Post[];
    pagination: Pagination;
  };
}

export interface AdminCommentListParams extends PaginationParams {
  status?: 'active' | 'deleted';
  post_id?: number;
} 