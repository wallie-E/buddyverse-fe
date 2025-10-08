import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrashIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { message } from 'antd';
import { API, authUtils } from '../api';
import type { Post } from '../api/types';

export default function MyPostsPage() {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
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
      setLoading(true);
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
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    fetchMyPosts(1);
  }, []);

  // 加载更多
  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchMyPosts(nextPage);
  };

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
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">我的帖子</h1>
              {/* <p className="text-gray-600 mt-1">管理你发布的所有帖子</p> */}
            </div>
          </div>
        </div>

        {/* User Info */}
        {/* {currentUser && (
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">
                  {currentUser.nickname.charAt(0)}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{currentUser.nickname}</h3>
                <p className="text-gray-600">{currentUser.email}</p>
                {currentUser.signature && (
                  <p className="text-sm text-gray-500 mt-1">{currentUser.signature}</p>
                )}
              </div>
            </div>
          </div>
        )} */}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
            {error}
            <button 
              onClick={() => fetchMyPosts(1)}
              className="ml-2 text-red-700 underline"
            >
              重试
            </button>
          </div>
        )}

        {/* Posts List */}
        {loading && posts.length === 0 ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">加载中...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">还没有发布帖子</h3>
            <p className="text-gray-600 mb-4">开始分享你的想法，寻找志同道合的搭子吧！</p>
            <button
              onClick={() => navigate('/create-post')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              发布第一个帖子
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div 
                key={post.id} 
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md hover:border-gray-300 transition-all duration-200"
                onClick={() => navigate(`/post/${post.id}`)}
              >
                {/* Post Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {post.subcategory_name}
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                        {post.category_name}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      发布于 {formatDate(post.created_at)}
                    </p>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2">
                    {/* <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/post/${post.id}`);
                      }}
                      className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                      title="查看详情"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button> */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePost(post.id);
                      }}
                      className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                      title="删除帖子"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Post Content */}
                <div className="mb-4">
                  <p className="text-gray-900 leading-relaxed">{post.content}</p>
                </div>

                {/* Post Meta */}
                {post.location && (
                  <div className="flex items-center text-sm text-gray-500 mb-3">
                    <span>📍 {post.location}</span>
                  </div>
                )}

                {/* Post Stats */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center space-x-1 text-gray-500">
                      <ChatBubbleLeftIcon className="h-4 w-4" />
                      <span className="text-sm">{post.comment_count} 条评论</span>
                    </span>
                    <span className="text-sm text-gray-500">
                      评论可见性: {post.comment_visibility === 'public' ? '公开' : '仅自己可见'}
                    </span>
                  </div>
                  
                 
                </div>
              </div>
            ))}
            
            {/* Load More Button */}
            {hasMore && (
              <div className="text-center pt-6">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  {loading ? '加载中...' : '加载更多'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        {/* <div className="grid grid-cols-2 gap-4 mt-8">
          <button
            onClick={() => navigate('/profile')}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-blue-200 transition-colors"
          >
            <h4 className="font-semibold text-gray-900 mb-2">个人资料</h4>
            <p className="text-sm text-gray-600">编辑你的个人信息</p>
          </button>
          
          <button
            onClick={() => navigate('/notifications')}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-blue-200 transition-colors"
          >
            <h4 className="font-semibold text-gray-900 mb-2">通知中心</h4>
            <p className="text-sm text-gray-600">查看评论和回复消息</p>
          </button>
        </div> */}
      </div>
    </div>
    </>
  );
} 