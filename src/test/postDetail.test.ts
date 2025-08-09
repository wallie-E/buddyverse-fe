import { adaptApiPost, adaptApiComment, adaptOrganizedComments, mapCategoryNameToMainCategory } from '../utils/apiAdapter';
import type { Post as ApiPost, Comment as ApiComment, OrganizedComment } from '../api/types';

// 测试API适配器功能
export const testApiAdapters = () => {
  console.log('Testing API Adapters...');

  // 测试分类映射
  const testCategory = mapCategoryNameToMainCategory('干饭搭子');
  console.assert(testCategory === 'food', 'Category mapping failed');
  console.log('✓ Category mapping test passed');

  // 测试帖子适配
  const mockApiPost: ApiPost = {
    id: 1,
    content: '测试帖子内容',
    location: '测试位置',
    comment_visibility: 'public',
    comment_count: 5,
    created_at: '2024-01-01T00:00:00.000Z',
    user_id: 1,
    author_name: '测试用户',
    author_email: 'test@example.com',
    category_name: '干饭搭子',
    subcategory_name: '火锅',
    status: 'active'
  };

  const adaptedPost = adaptApiPost(mockApiPost);
  console.assert(adaptedPost.id === '1', 'Post ID adaptation failed');
  console.assert(adaptedPost.mainCategory === 'food', 'Post category adaptation failed');
  console.assert(adaptedPost.isPrivateComments === false, 'Post comment visibility adaptation failed');
  console.log('✓ Post adaptation test passed');

  // 测试评论适配
  const mockApiComment: ApiComment = {
    id: 1,
    content: '测试评论',
    created_at: '2024-01-01T00:00:00.000Z',
    author_name: '评论用户',
    author_email: 'commenter@example.com',
    post_id: 1,
    status: 'active'
  };

  const adaptedComment = adaptApiComment(mockApiComment);
  console.assert(adaptedComment.id === '1', 'Comment ID adaptation failed');
  console.assert(adaptedComment.postId === '1', 'Comment post ID adaptation failed');
  console.log('✓ Comment adaptation test passed');

  // 测试组织化评论适配
  const mockOrganizedComments: OrganizedComment[] = [
    {
      ...mockApiComment,
      replies: [
        {
          id: 2,
          content: '回复评论',
          created_at: '2024-01-01T01:00:00.000Z',
          author_name: '回复用户',
          parent_id: 1,
          post_id: 1,
          status: 'active'
        }
      ]
    }
  ];

  const adaptedOrganizedComments = adaptOrganizedComments(mockOrganizedComments);
  console.assert(adaptedOrganizedComments.length === 1, 'Organized comments length failed');
  console.assert(adaptedOrganizedComments[0].replies?.length === 1, 'Organized comments replies failed');
  console.log('✓ Organized comments adaptation test passed');

  console.log('All API adapter tests passed! 🎉');
}; 