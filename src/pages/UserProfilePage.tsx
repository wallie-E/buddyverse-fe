import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeftIcon, MapPinIcon, ChatBubbleLeftIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { message } from 'antd';
import { getUserProfile } from '../api/users';
import { authUtils } from '../api';
import type { User, Post } from '../api/types';

const UserProfilePage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [messageApi, contextHolder] = message.useMessage();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // 获取当前用户
  const currentUser = authUtils.getCurrentUser();
  const isCurrentUser = currentUser && id && currentUser.id?.toString() === id;

  // 获取用户资料
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!id) {
        setError('用户ID不存在');
        setLoading(false);
        return;
      }

      // 如果是当前用户，直接跳转到个人资料页面
      if (isCurrentUser) {
        navigate('/profile');
        return;
      }

      try {
        setLoading(true);
        const response = await getUserProfile(parseInt(id), 1, 10);
        if (response.success) {
          setUser(response.data);
          setPosts(response.data.posts?.list || []);
          setHasMore(response.data.posts?.pagination?.page < response.data.posts?.pagination?.pages);
          setCurrentPage(1);
        } else {
          setError(response.message || '获取用户资料失败');
        }
      } catch (err) {
        console.error('获取用户资料失败:', err);
        setError(err instanceof Error ? err.message : '获取用户资料失败');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [id, navigate, isCurrentUser]);

  // 加载更多帖子
  const loadMorePosts = async () => {
    if (!id || !hasMore || loadingMore) return;

    try {
      setLoadingMore(true);
      const nextPage = currentPage + 1;
      const response = await getUserProfile(parseInt(id), nextPage, 10);
      
      if (response.success) {
        setPosts(prev => [...prev, ...(response.data.posts?.list || [])]);
        setHasMore(response.data.posts?.pagination?.page < response.data.posts?.pagination?.pages);
        setCurrentPage(nextPage);
      }
    } catch (err) {
      console.error('加载更多帖子失败:', err);
      messageApi.error('加载更多帖子失败');
    } finally {
      setLoadingMore(false);
    }
  };

  // 格式化时间
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}天前`;
    } else if (hours > 0) {
      return `${hours}小时前`;
    } else if (minutes > 0) {
      return `${minutes}分钟前`;
    } else {
      return '刚刚';
    }
  };

  // 格式化注册时间
  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // 加载状态
  if (loading) {
    return (
      <>
        {contextHolder}
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">加载中...</p>
          </div>
        </div>
      </>
    );
  }

  // 错误状态
  if (error || !user) {
    return (
      <>
        {contextHolder}
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || '用户不存在'}</p>
            <button
              onClick={() => navigate('/')}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              返回首页
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {contextHolder}
      <div className="min-h-screen bg-gray-50">
        {/* 顶部导航栏 */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeftIcon className="w-6 h-6 text-gray-600" />
            </button>
            <h1 className="text-lg font-medium text-gray-900">用户资料</h1>
            <div className="w-10"></div> {/* 占位符保持居中 */}
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* 用户信息卡片 */}
          <div className="bg-white mx-4 mt-4 rounded-2xl shadow-sm">
            {/* 用户头像和基本信息 */}
            <div className="p-6 text-center">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.nickname}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-2xl">
                    {user.nickname.charAt(0)}
                  </span>
                )}
              </div>
              
              <h2 className="text-xl font-bold text-gray-900 mb-2">{user.nickname || '未知用户'}</h2>
              
              {user.signature && (
                <p className="text-gray-600 mb-4 leading-relaxed">{user.signature}</p>
              )}
              
              <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
                <span>性别: {user.gender === 'male' ? '男' : user.gender === 'female' ? '女' : '其他'}</span>
                <span>加入于 {user.created_at ? formatJoinDate(user.created_at) : '未知'}</span>
              </div>
            </div>
          </div>

          {/* 用户统计信息 */}
          {/* <div className="bg-white mx-4 mt-4 rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">用户统计</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{posts.length}</div>
                <div className="text-sm text-gray-500">发布帖子</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">-</div>
                <div className="text-sm text-gray-500">评论数量</div>
              </div>
            </div>
          </div> */}

          {/* 用户帖子列表 */}
          <div className="mx-4 mt-4">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">发布的帖子</h3>
              
              {posts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📝</div>
                  <p>还没有发布任何帖子</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <div 
                      key={post.id} 
                      className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => navigate(`/post/${post.id}`)}
                    >
                      {/* 帖子头部信息 */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {post.subcategory_name}
                          </span>
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                            {post.category_name}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">{formatDate(post.created_at)}</span>
                      </div>

                      {/* 帖子内容 */}
                      <div className="mb-3">
                        <p className="text-gray-900 leading-relaxed line-clamp-2">{post.content}</p>
                      </div>

                      {/* 位置信息 */}
                      {post.location && (
                        <div className="flex items-center space-x-1 mb-3 text-sm text-gray-500">
                          <MapPinIcon className="h-4 w-4" />
                          <span>{post.location}</span>
                        </div>
                      )}

                      {/* 帖子统计 */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1 text-gray-500">
                            <ChatBubbleLeftIcon className="h-4 w-4" />
                            <span className="text-sm">{post.comment_count} 条评论</span>
                            {post.comment_visibility === 'private' && (
                              <EyeSlashIcon className="h-3 w-3 text-gray-400" title="评论仅作者可见" />
                            )}
                          </div>
                        </div>
                        
                        <span className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                          查看详情
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {/* 加载更多按钮 */}
                  {hasMore && (
                    <div className="text-center pt-4">
                      <button
                        onClick={loadMorePosts}
                        disabled={loadingMore}
                        className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                      >
                        {loadingMore ? '加载中...' : '加载更多'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 底部占位空间 */}
          <div className="h-8"></div>
        </div>
      </div>
    </>
  );
};

export default UserProfilePage;
