import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapPinIcon, ChatBubbleLeftIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { message } from 'antd';
import { getUserProfile } from '../api/users';
import { authUtils } from '../api';
import { getSubCategoryIcon } from '../utils/categoryIcons';
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-6"></div>
            <p className="text-gray-600 text-lg font-medium">加载中...</p>
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-r from-red-200 to-pink-200 flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">😞</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3">出错了</h3>
            <p className="text-red-600 mb-8 text-lg">{error || '用户不存在'}</p>
            <button
              onClick={() => navigate('/')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        {/* 顶部导航栏 */}

        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* 用户信息卡片 */}
          <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
            {/* 用户头像和基本信息 */}
            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.nickname}
                    className="w-32 h-32 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-4xl">
                    {user.nickname.charAt(0)}
                  </span>
                )}
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-3">{user.nickname || '未知用户'}</h2>
              
              <p className="text-gray-600 mb-6 leading-relaxed text-lg max-w-2xl mx-auto">
                {user.signature || '该用户暂无介绍'}
              </p>
              
              <div className="flex items-center justify-center space-x-8 text-base text-gray-500">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">
                    {user.gender === 'male' ? '👨' : user.gender === 'female' ? '👩' : '🤖'}
                  </span>
                  <span className="font-medium">
                    {user.gender === 'male' ? '男' : user.gender === 'female' ? '女' : '其他'}
                  </span>
                </div>
                {/* <div className="flex items-center space-x-2">
                  <span className="font-medium">
                    加入于 {user.created_at ? formatJoinDate(user.created_at) : '未知'}
                  </span>
                </div> */}
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
          <div className="bg-white rounded-2xl shadow-sm p-8">

            {posts.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-r from-slate-200 to-slate-300 flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">📝</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-3">还没有发布任何帖子</h3>
                <p className="text-slate-600 text-lg">这个用户还没有发布任何内容</p>
              </div>
            ) : (
              <div className="space-y-6">
                {posts.map((post) => (
                  <div 
                    key={post.id} 
                    className="bg-gray-50 rounded-2xl p-6 hover:bg-gray-100 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                    onClick={() => navigate(`/post/${post.id}`)}
                  >
                    {/* 帖子头部信息 */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <span className="inline-flex items-center px-4 py-2 rounded-2xl text-sm font-semibold bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border border-blue-200">
                          <span className="mr-2">{getSubCategoryIcon(post.subcategory_name)}</span>
                          {post.subcategory_name}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500 font-medium">{formatDate(post.created_at)}</span>
                    </div>

                    {/* 帖子内容 */}
                    <div className="mb-4">
                      <p className="text-gray-900 leading-relaxed text-lg line-clamp-2">{post.content}</p>
                    </div>

                    {/* 位置信息 */}
                    {post.location && (
                      <div className="flex items-center space-x-2 mb-4 text-sm py-2 text-gray-600">
                        <MapPinIcon className="h-4 w-4" />
                        <span className="text-sm font-medium max-w-[90%] truncate">{post.location}</span>
                      </div>
                    )}

                    {/* 帖子统计 */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-2 text-gray-500">
                          <ChatBubbleLeftIcon className="h-5 w-5" />
                          <span className="text-sm font-medium">{post.comment_count} 条评论</span>
                          {post.comment_visibility === 'private' && (
                            <EyeSlashIcon className="h-4 w-4 text-gray-400" title="评论仅作者可见" />
                          )}
                        </div>
                      </div>
                      
                      <span className="text-sm text-blue-600 hover:text-blue-800 font-semibold group-hover:text-blue-800 transition-colors">
                        查看详情 →
                      </span>
                    </div>
                  </div>
                ))}
                
                {/* 加载更多按钮 */}
                {hasMore && (
                  <div className="text-center pt-8">
                    <button
                      onClick={loadMorePosts}
                      disabled={loadingMore}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-2xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 disabled:opacity-50 font-medium shadow-lg hover:shadow-xl"
                    >
                      {loadingMore ? '加载中...' : '加载更多'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default UserProfilePage;
