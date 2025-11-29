import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrashIcon, ChatBubbleLeftIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { message } from 'antd';
import { API, authUtils } from '../api';
import type { Post } from '../api/types';

export default function MyPostsPage() {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // 检查登录状态
  useEffect(() => {
    if (!authUtils.isAuthenticated()) {
      navigate('/login');
      return;
    }
  }, [navigate]);

  // 获取用户帖子
  const fetchMyPosts = async (pageNum = 1) => {
    try {
      // 第一页使用 loading，后续页面使用 loadingMore
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError('');
      
      const response = await API.users.getUserPosts({
        page: pageNum,
        limit: 10
      });
      
      if (response.success) {
        if (pageNum === 1) {
          setPosts(response.data.list);
        } else {
          setPosts(prev => [...prev, ...response.data.list]);
        }
        
        setHasMore(response.data.pagination.page < response.data.pagination.pages);
      }
    } catch (error) {
      console.error('获取我的帖子失败:', error);
      setError('获取帖子失败，请刷新重试');
    } finally {
      if (pageNum === 1) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  };

  // 初始加载
  useEffect(() => {
    fetchMyPosts(1);
  }, []);

  // 加载更多
  const loadMore = useCallback(() => {
    if (!hasMore || loading || loadingMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchMyPosts(nextPage);
  }, [hasMore, loading, loadingMore, page]);

  // 滚动监听，实现无限滚动
  useEffect(() => {
    const handleScroll = () => {
      if (!hasMore || loading || loadingMore) return;

      // 检查是否滚动到页面底部附近
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // 当滚动到底部附近时（距离底部100px以内）触发加载
      if (scrollTop + windowHeight >= documentHeight - 100) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, loading, loadingMore, loadMore]);

  // 删除帖子
  const handleDeletePost = async (postId: number) => {
    if (!confirm('确定要删除这个帖子吗？删除后无法恢复。')) {
      return;
    }

    try {
      await API.posts.deletePost(postId);
      
      // 从列表中移除已删除的帖子
      setPosts(prev => prev.filter(post => post.id !== postId));
    } catch (error) {
      console.error('删除帖子失败:', error);
      messageApi.error('删除失败，请重试');
    }
  };

  // 格式化时间
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // const currentUser = authUtils.getCurrentUser();

  return (
    <>
      {contextHolder}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">我的帖子</h1>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50/80 backdrop-blur-sm border border-red-200/50 text-red-600 px-6 py-4 rounded-2xl mb-6 shadow-lg">
            <div className="flex items-center justify-between">
              <span>{error}</span>
              <button 
                onClick={() => fetchMyPosts(1)}
                className="ml-4 text-red-700 underline hover:text-red-800 transition-colors"
              >
                重试
              </button>
            </div>
          </div>
        )}

        {/* Posts List */}
        {loading && posts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-r from-slate-200 to-slate-300 flex items-center justify-center mx-auto mb-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
            <p className="text-slate-600 text-lg font-medium">加载中...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-r from-slate-200 to-slate-300 flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">📝</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3">还没有发布帖子</h3>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">开始分享你的想法，寻找志同道合的搭子吧！</p>
            <button
              onClick={() => navigate('/create-post')}
              className="h-12 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 font-medium text-white"
            >
              发布第一个帖子 ✨
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {posts.map((post) => (
              <div 
                key={post.id} 
                className="group hover:shadow-2xl transition-all duration-500 border-0 bg-white/80 backdrop-blur-sm rounded-3xl overflow-hidden shadow-lg cursor-pointer"
                onClick={() => navigate(`/post/${post.id}`)}
              >
                <div className="p-6 pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center gap-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 shadow-lg px-3 py-1 rounded-full text-sm">
                          <span>{post.subcategory_name}</span>
                        </span>
                        <span className="text-sm text-slate-500">
                          {formatDate(post.created_at)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePost(post.id);
                        }}
                        className="p-2 text-slate-500 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                        title="删除帖子"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="px-6 pb-6">
                  <p className="text-slate-800 mb-6 leading-relaxed text-base group-hover:text-slate-900 transition-colors">
                    {post.content}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <MapPinIcon className="h-4 w-4" />
                      <span className="text-sm font-medium max-w-32 sm:max-w-60 truncate">{post.location || '未设置位置'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500">
                      <ChatBubbleLeftIcon className="h-4 w-4" />
                      <span className="font-medium">{post.comment_count} 条评论</span>
                      <span className="text-xs text-slate-400 ml-2">
                        {post.comment_visibility === 'public' ? '公开' : '私密'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 滚动加载提示 */}
        {loadingMore && posts.length > 0 && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2 text-sm">加载更多...</p>
          </div>
        )}

      </div>
    </div>
    </>
  );
} 