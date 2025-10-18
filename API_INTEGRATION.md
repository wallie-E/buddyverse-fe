# 帖子详情页API接入实现说明

## 概述

本次实现完成了帖子详情页的接口接入，包括：
1. 获取帖子详情接口
2. 获取评论列表接口
3. 发表评论接口

## 文件变更

### 1. API配置更新 (`src/api/config.ts`)
- 修复了BASE_URL配置，使用正确的HTTPS协议
- 确保axios实例使用正确的baseURL

### 2. API类型定义 (`src/api/types.ts`)
- 添加了`OrganizedComment`接口，用于处理带有回复的评论结构
- 确保所有类型定义与接口文档保持一致

### 3. API服务更新
- `src/api/posts.ts`: 更新`getPostById`函数支持字符串ID
- `src/api/comments.ts`: 更新`getPostComments`函数返回组织化评论结构

### 4. 数据适配器 (`src/utils/apiAdapter.ts`)
- 创建了适配器函数，将API响应数据转换为项目内部类型
- 包含用户、帖子、评论的数据转换逻辑
- 支持分类名称到主分类的映射

### 5. 帖子详情页重构 (`src/pages/PostDetailPage.tsx`)
- 完全重写组件以使用真实API接口
- 添加加载状态、错误处理、提交状态管理
- 支持评论的获取、发表和回复功能
- 正确处理评论可见性权限

## 核心功能

### 1. 帖子详情获取
```typescript
// 通过ID获取帖子详情
const response = await getPostById(id);
const post = adaptApiPost(response.data);
```

### 2. 评论列表获取
```typescript
// 获取帖子的评论列表（已包含回复结构）
const response = await getPostComments(postId);
const comments = adaptOrganizedComments(response.data.list);
```

### 3. 发表评论
```typescript
// 发表新评论或回复
await createComment({
  post_id: parseInt(postId),
  content: commentText,
});
```

## 权限处理

- 正确处理评论可见性（`comment_visibility`）
- 仅帖子作者可以查看私有评论
- 非授权用户无法查看或发表私有评论

## 错误处理

- 网络错误统一处理
- 401错误自动重定向到登录页
- 用户友好的错误提示信息
- 加载状态和提交状态管理

## 数据流

1. **获取帖子**: API响应 → `adaptApiPost` → 组件状态
2. **获取评论**: API响应 → `adaptOrganizedComments` → 组件状态
3. **发表评论**: 用户输入 → API请求 → 重新获取评论列表

## 注意事项

- API使用数字ID，但项目内部使用字符串ID，需要类型转换
- 评论结构已在API层面组织好，无需前端再次组织
- 分类映射需要根据后端分类数据更新
- 当前用户信息从localStorage获取，生产环境需要完善认证逻辑

## 测试

创建了`src/test/postDetail.test.ts`文件，包含API适配器的单元测试。

## 后续优化

1. 添加分页支持
2. 优化错误边界处理
3. 添加评论删除功能
4. 实现实时评论更新
5. 添加图片上传支持 