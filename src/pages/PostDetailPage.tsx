import { useState, useEffect, useCallback } from 'react';
import { ChevronLeftIcon, ShareIcon, ChatBubbleLeftIcon, PaperAirplaneIcon, MapPinIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useNavigate, useParams } from 'react-router-dom';
import { getPostById } from '../api/posts';
import { getPostComments, createComment } from '../api/comments';
import { adaptOrganizedComments } from '../utils/apiAdapter';
import type { Comment, User } from '../types';
import type { Post as ApiPost } from '../api/types';

const PostDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<ApiPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  
  // 分页相关状态
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const COMMENTS_PER_PAGE = 20;

  // 获取当前用户（模拟）
  const getCurrentUser = (): User => {
    const userData = localStorage.getItem('user');
    if (userData) {
      return JSON.parse(userData);
    }
    // 如果没有用户数据，返回默认用户
    return {
      id: 'current-user',
      email: 'user@example.com',
      nickname: '当前用户',
      gender: 'other',
      role: 'user',
      registeredAt: new Date().toISOString(),
      postCount: 0,
      commentCount: 0,
    };
  };

  const currentUser = getCurrentUser();

  // 获取帖子详情
  useEffect(() => {
    const fetchPost = async () => {
      if (!id) {
        setError('帖子ID不存在');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await getPostById(id);
        if (response.success) {
          setPost(response.data);
        } else {
          setError(response.message || '获取帖子失败');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取帖子失败');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  // 获取评论列表（首次加载）
  useEffect(() => {
    const fetchComments = async () => {
      if (!id || !post) return;

      // 检查是否可以查看评论
      const isPostAuthor = currentUser.id?.toString() === post.user_id?.toString();
      const canViewComments = post.comment_visibility !== 'private' || isPostAuthor;

      if (!canViewComments) {
        setComments([]);
        setHasMoreComments(false);
        return;
      }

      try {
        setCommentsLoading(true);
        const response = await getPostComments(id, { page: 1, limit: COMMENTS_PER_PAGE });
        if (response.success) {
          const adaptedComments = adaptOrganizedComments(response.data.list);
          // 只显示顶级评论，过滤掉回复
          const topLevelComments = adaptedComments.filter(comment => !comment.parentId);
          setComments(topLevelComments);
          
          // 检查是否还有更多评论
          const { pagination } = response.data;
          setHasMoreComments(pagination.page < pagination.pages);
          setCurrentPage(1);
        }
      } catch (err) {
        console.error('获取评论失败:', err);
      } finally {
        setCommentsLoading(false);
      }
    };

    fetchComments();
  }, [id, post, currentUser.id]);

  // 检查当前用户是否是帖子作者
  const isPostAuthor = post ? currentUser.id?.toString() === post.user_id?.toString() : false;

  // 检查是否可以查看评论 - 只有非私有评论或者是帖子作者才能查看
  const canViewComments = post ? (post.comment_visibility !== 'private' || isPostAuthor) : false;
  console.log(post, canViewComments, isPostAuthor);

  // 加载更多评论
  const loadMoreComments = useCallback(async () => {
    if (!id || !post || !hasMoreComments || loadingMore) return;

    const isPostAuthor = currentUser.id?.toString() === post.user_id?.toString();
    const canViewComments = post.comment_visibility !== 'private' || isPostAuthor;

    if (!canViewComments) return;

    try {
      setLoadingMore(true);
      const nextPage = currentPage + 1;
      const response = await getPostComments(id, { page: nextPage, limit: COMMENTS_PER_PAGE });
      
      if (response.success) {
        const adaptedComments = adaptOrganizedComments(response.data.list);
        const topLevelComments = adaptedComments.filter(comment => !comment.parentId);
        
        // 追加新评论到现有列表
        setComments(prev => [...prev, ...topLevelComments]);
        
        // 更新分页状态
        const { pagination } = response.data;
        setHasMoreComments(pagination.page < pagination.pages);
        setCurrentPage(nextPage);
      }
    } catch (err) {
      console.error('加载更多评论失败:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [id, post, currentUser.id, hasMoreComments, loadingMore, currentPage]);

  // 页面滚动检测
  useEffect(() => {
    const handleScroll = () => {
      if (!hasMoreComments || loadingMore) return;

      // 检查当前用户是否可以查看评论
      const currentCanViewComments = post ? (post.comment_visibility !== 'private' || (currentUser.id?.toString() === post.user_id?.toString())) : false;
      if (!currentCanViewComments) return;

      // 检查是否滚动到页面底部附近
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // 当滚动到底部附近时（距离底部100px以内）触发加载
      if (scrollTop + windowHeight >= documentHeight - 100) {
        loadMoreComments();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMoreComments, hasMoreComments, loadingMore, post, currentUser.id]);

  // 检查是否可以添加评论 - 所有人都可以添加评论
  const canAddComments = post ? true : false;

  // 处理时间显示
  const getTimeAgo = (date: string) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffHours = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60));

    if (diffHours < 1) return '刚刚';
    if (diffHours < 24) return `${diffHours}小时前`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}天前`;
    return postDate.toLocaleDateString('zh-CN');
  };

  // 发送评论
  const handleSendComment = async () => {
    if (!newComment.trim() || !canAddComments || !post || submitLoading) return;

    try {
      setSubmitLoading(true);
      const response = await createComment({
        post_id: post.id,
        content: newComment,
        // 移除回复相关参数，只支持顶级评论
      });

      if (canViewComments) {
        if (response.success) {
          // 重新获取第一页评论列表（包含新评论）
          const commentsResponse = await getPostComments(post.id.toString(), { page: 1, limit: COMMENTS_PER_PAGE });
          if (commentsResponse.success) {
            const adaptedComments = adaptOrganizedComments(commentsResponse.data.list);
            // 只显示顶级评论
            const topLevelComments = adaptedComments.filter(comment => !comment.parentId);
            setComments(topLevelComments);
            
            // 重置分页状态
            const { pagination } = commentsResponse.data;
            setHasMoreComments(pagination.page < pagination.pages);
            setCurrentPage(1);
          }

          // 更新帖子的评论数量
          setPost(prev => prev ? { ...prev, comment_count: prev.comment_count + 1 } : null);
        } else {
          alert(response.message || '发送评论失败');
        }
      }else{
        if(response.success){
          alert('评论发送成功');
        }else{
          alert(response.message || '发送评论失败');
        }
      }

    } catch (err) {
      alert(err instanceof Error ? err.message : '发送评论失败');
    } finally {
      setNewComment('');
      setSubmitLoading(false);
    }
  };

  // 获取用户头像
  const getUserAvatar = (user: User) => {
    return user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nickname)}&background=random&color=fff`;
  };

  // 获取帖子作者头像
  const getPostAuthorAvatar = (authorName: string) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=random&color=fff`;
  };

  // 渲染单个评论
  const renderComment = (comment: Comment) => (
    <div key={comment.id} className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex space-x-3">
        <img
          src={getUserAvatar(comment.author)}
          alt={comment.author.nickname}
          className="w-10 h-10 rounded-full flex-shrink-0"
        />
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-medium text-gray-900">{comment.author.nickname}</span>
            {post && comment.authorId === post.user_id?.toString() && (
              <span className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
            )}
          </div>
          <p className="text-gray-900 text-sm leading-relaxed mb-2">
            {comment.content}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">{getTimeAgo(comment.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  // 加载状态
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || '帖子不存在'}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeftIcon className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-lg font-medium text-gray-900">帖子详情</h1>
          <button className="p-2 -mr-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ShareIcon className="w-6 h-6 text-gray-600" />
          </button>
        </div>
        <div className="text-center text-sm text-gray-500 pb-2">
          参与讨论，结识新朋友
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* 帖子内容 */}
        <div className="bg-white mx-4 mt-4 rounded-2xl shadow-sm">
          {/* 用户信息 */}
          <div className="flex items-center justify-between p-4 pb-3">
            <div className="flex items-center space-x-3">
              <img
                src={getPostAuthorAvatar(post.author_name)}
                alt={post.author_name}
                className="w-12 h-12 rounded-full"
              />
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">{post.author_name}</span>
                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <span className="text-sm text-gray-500">{getTimeAgo(post.created_at)}</span>
              </div>
            </div>
            <button className="bg-blue-500 text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-blue-600 transition-colors">
              {post.subcategory_name}
            </button>
          </div>

          {/* 帖子内容 */}
          <div className="px-4 pb-3">
            <p className="text-gray-900 text-base leading-relaxed">
              {post.content}
            </p>
          </div>

          {/* 位置信息 */}
          {post.location && (
            <div className="px-4 pb-4">
              <div className="flex items-center space-x-1 text-gray-600">
                <MapPinIcon className="w-4 h-4" />
                <span className="text-sm">{post.location}</span>
              </div>
            </div>
          )}

          {/* 互动区域 */}
          <div className="border-t border-gray-100 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1 text-gray-600">
                <ChatBubbleLeftIcon className="w-5 h-5" />
                <span className="text-sm">{post.comment_count} 条评论</span>
                {post.comment_visibility === 'private' && (
                  <EyeSlashIcon className="w-4 h-4 text-gray-400" />
                )}
              </div>
              <button className="flex items-center space-x-1 text-gray-600 hover:text-blue-500 transition-colors">
                <ShareIcon className="w-5 h-5" />
                <span className="text-sm">分享</span>
              </button>
            </div>
          </div>
        </div>

        {/* 评论可见性提示 */}
        {post.comment_visibility === 'private' && !isPostAuthor && (
          <div className="mx-4 mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <div className="flex items-center space-x-3">
              <EyeSlashIcon className="w-5 h-5 text-amber-600" />
              <div>
                <h3 className="text-sm font-medium text-amber-800">评论仅作者可见</h3>
                <p className="text-sm text-amber-700">此帖子的评论设置为仅作者可见，但你仍然可以添加评论给作者。</p>
              </div>
            </div>
          </div>
        )}

        {/* 评论区域 */}
        {canViewComments && (
          <div className="mx-4 mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              评论 ({post?.comment_count || 0})
            </h3>
            <div className="text-sm text-gray-500 mb-4">
              参与讨论，分享你的想法
            </div>

            {/* 评论加载状态 */}
            {commentsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p className="text-gray-600">加载评论中...</p>
              </div>
            ) : (
              // 评论列表
              <div className="space-y-4">
                {comments.map(comment => renderComment(comment))}
                
                {/* 空状态 */}
                {comments.length === 0 && !loadingMore && (
                  <div className="text-center py-8 text-gray-500">
                    还没有评论，来发表第一条评论吧！
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 私有评论提示区域 - 当评论私有且用户不是作者时显示 */}
        {post.comment_visibility === 'private' && !isPostAuthor && canAddComments && (
          <div className="mx-4 mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              评论区域
            </h3>
            <div className="text-sm text-gray-500 mb-4">
              你可以给作者留言，但只有作者可以看到评论
            </div>
            <div className="text-center py-8 text-gray-500">
              评论仅作者可见，你的评论将直接发送给作者
            </div>
          </div>
        )}

        {/* 评论输入框 */}
        {canAddComments && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center space-x-3">
                <img
                  src={getUserAvatar(currentUser)}
                  alt={currentUser.nickname}
                  className="w-8 h-8 rounded-full flex-shrink-0"
                />
                <div className="flex-1 flex items-center space-x-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="写下你的评论，参与讨论..."
                    className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    onKeyPress={(e) => e.key === 'Enter' && !submitLoading && handleSendComment()}
                    disabled={submitLoading}
                  />
                  <button
                    onClick={handleSendComment}
                    disabled={!newComment.trim() || submitLoading}
                    className="p-2 text-white bg-blue-500 rounded-full hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitLoading ? (
                      <div className="w-4 h-4 animate-spin border-b border-white rounded-full"></div>
                    ) : (
                      <PaperAirplaneIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 加载更多评论的状态显示在页面底部 */}
        {canViewComments && loadingMore && (
          <div className="mx-4 mt-6 mb-4">
            <div className="text-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
              <p className="text-gray-600">加载更多评论...</p>
            </div>
          </div>
        )}

        {/* 没有更多评论的提示 */}
        {canViewComments && !hasMoreComments && comments.length > 0 && !loadingMore && (
          <div className="mx-4 mt-6 mb-4">
            <div className="text-center py-4 text-gray-500">
              没有更多评论了
            </div>
          </div>
        )}

        {/* 底部占位空间 */}
        <div className="h-20"></div>
      </div>
    </div>
  );
};

export default PostDetailPage; 