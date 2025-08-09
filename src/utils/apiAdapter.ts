import type { Post as ApiPost, Comment as ApiComment, OrganizedComment } from '../api/types';
import type { Post, Comment, User, MainCategory } from '../types';

// 转换API用户数据为项目User类型
export const adaptApiUser = (authorName: string, authorEmail?: string): User => {
  return {
    id: authorEmail || authorName, // 使用email作为ID，没有email就用name
    email: authorEmail || `${authorName}@example.com`,
    nickname: authorName,
    gender: 'other' as const,
    role: 'user' as const,
    registeredAt: new Date().toISOString(),
    postCount: 0,
    commentCount: 0,
  };
};

// 根据分类名称映射到主分类
export const mapCategoryNameToMainCategory = (categoryName: string): MainCategory => {
  const categoryMap: Record<string, MainCategory> = {
    '干饭搭子': 'food',
    '学习伙伴': 'study',
    '运动搭子': 'sports',
    '游戏搭子': 'game',
    '追番搭子': 'anime',
    '旅行搭子': 'travel',
  };
  
  return categoryMap[categoryName] || 'food';
};

// 转换API帖子数据为项目Post类型
export const adaptApiPost = (apiPost: ApiPost): Post => {
  const author = adaptApiUser(apiPost.author_name, apiPost.author_email);
  
  return {
    id: apiPost.id.toString(),
    content: apiPost.content,
    location: apiPost.location || '',
    mainCategory: mapCategoryNameToMainCategory(apiPost.category_name),
    subCategory: apiPost.subcategory_name,
    isPrivateComments: apiPost.comment_visibility === 'private',
    authorId: author.id,
    author,
    createdAt: apiPost.created_at,
    commentCount: apiPost.comment_count,
    comments: [], // 评论单独获取
  };
};

// 转换API评论数据为项目Comment类型
export const adaptApiComment = (apiComment: ApiComment): Comment => {
  const author = adaptApiUser(apiComment.author_name, apiComment.author_email);
  
  return {
    id: apiComment.id.toString(),
    content: apiComment.content,
    postId: apiComment.post_id?.toString() || '',
    authorId: author.id,
    author,
    parentId: apiComment.parent_id?.toString(),
    createdAt: apiComment.created_at,
  };
};

// 转换组织化评论数据
export const adaptOrganizedComments = (apiComments: OrganizedComment[]): Comment[] => {
  return apiComments.map(comment => {
    const adaptedComment = adaptApiComment(comment);
    if (comment.replies && comment.replies.length > 0) {
      adaptedComment.replies = comment.replies.map(reply => adaptApiComment(reply));
    }
    return adaptedComment;
  });
}; 