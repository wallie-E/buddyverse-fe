// 导出所有API接口
export * from './auth';
export * from './users';
export * from './posts';
export * from './comments';
export * from './categories';
export * from './notifications';
export * from './admin';

// 导出类型定义
export * from './types';

// 导出配置
export { default as api, BASE_URL } from './config';

// 常用的API集合
import * as authAPI from './auth';
import * as usersAPI from './users';
import * as postsAPI from './posts';
import * as commentsAPI from './comments';
import * as categoriesAPI from './categories';
import * as notificationsAPI from './notifications';
import * as adminAPI from './admin';

export const API = {
  auth: authAPI,
  users: usersAPI,
  posts: postsAPI,
  comments: commentsAPI,
  categories: categoriesAPI,
  notifications: notificationsAPI,
  admin: adminAPI
};

export default API; 