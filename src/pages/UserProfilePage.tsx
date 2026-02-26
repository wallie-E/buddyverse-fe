import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapPinIcon } from '@heroicons/react/24/outline';
import { Copy, Check } from 'lucide-react';
import { message, Modal } from 'antd';
import { getUserProfile } from '../api/users';
import { authUtils } from '../api';
import { viewWechat } from '../api/wechatExchange';
import { getSubCategoryIcon } from '../utils/categoryIcons';
import { redirectToLoginIfNeeded } from '../utils/auth';
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
  const [viewingWechat, setViewingWechat] = useState(false);
  const [wechatModalOpen, setWechatModalOpen] = useState(false);
  const [wechatIdInModal, setWechatIdInModal] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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
  const loadMorePosts = useCallback(async () => {
    if (!id || !hasMore || loading || loadingMore) return;

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
  }, [id, hasMore, loading, loadingMore, currentPage, messageApi]);

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
        loadMorePosts();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, loading, loadingMore, loadMorePosts]);

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

  // 查看微信
  const handleViewWechat = async () => {
    if (!user?.id) return;
    if (redirectToLoginIfNeeded(navigate)) return;
    setViewingWechat(true);
    try {
      const res = await viewWechat(Number(user.id));
      if (res.success && res.data?.wechatId) {
        setWechatIdInModal(res.data.wechatId);
        setWechatModalOpen(true);
        setCopied(false);
      } else {
        messageApi.error('该用户账号异常，无法查看微信号');
      }
    } catch (err) {
      messageApi.error('该用户账号异常，无法查看微信号');
    } finally {
      setViewingWechat(false);
    }
  };

  const handleCopyWechat = async () => {
    if (!wechatIdInModal) return;
    try {
      await navigator.clipboard.writeText(wechatIdInModal);
      setCopied(true);
      messageApi.success('微信号已复制');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      messageApi.error('复制失败');
    }
  };

  // 加载状态
  if (loading) {
    return (
      <>
        {contextHolder}
        <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-200 border-t-slate-600 mx-auto mb-6"></div>
            <p className="text-slate-600 text-lg font-medium font-sans">加载中...</p>
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
        <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-24 h-24 rounded-[2rem] bg-slate-100 flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">😞</span>
            </div>
            <h3 className="text-2xl font-medium text-slate-800 mb-3 font-sans">出错了</h3>
            <p className="text-red-600 mb-8 text-lg font-normal font-sans leading-relaxed">{error || '用户不存在'}</p>
            <button
              onClick={() => navigate('/')}
              className="bg-slate-900 text-white px-8 py-3 rounded-full hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] hover:scale-[1.02] transition-all duration-300 font-medium font-sans"
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
      <div className="min-h-screen bg-slate-50/50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* 用户信息卡片 */}
          <div className="bg-white border border-slate-100 rounded-[2rem] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.04)] p-8 mb-8">
            {/* 用户头像和基本信息 */}
            <div className="text-center">
              <div className="w-32 h-32 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.nickname}
                    className="w-32 h-32 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white font-medium text-4xl font-sans">
                    {user.nickname.charAt(0)}
                  </span>
                )}
              </div>
              
              <h2 className="text-3xl font-medium text-slate-900 mb-3 font-sans tracking-tight">{user.nickname || '未知用户'}</h2>
              
              <p className="text-slate-500 mb-6 leading-loose text-lg max-w-2xl mx-auto font-normal font-sans">
                {user.signature || '该用户暂无介绍'}
              </p>
              
              <div className="flex items-center justify-center space-x-8 text-base text-slate-500">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">
                    {user.gender === 'male' ? '👨' : user.gender === 'female' ? '👩' : '🤖'}
                  </span>
                  <span className="font-medium font-sans">
                    {user.gender === 'male' ? '男' : user.gender === 'female' ? '女' : '其他'}
                  </span>
                </div>
              </div>

              {/* 查看微信 */}
              <div className="mt-6 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleViewWechat}
                  disabled={viewingWechat}
                  className="inline-flex items-center gap-2 text-slate-600 text-sm font-sans px-4 py-2 rounded-full bg-slate-50 border border-slate-100 hover:bg-slate-100 disabled:opacity-60 transition-colors"
                >
                  {viewingWechat ? '查看中...' : '查看微信'}
                </button>
              </div>
            </div>
          </div>

          {/* 用户帖子列表 */}
          <div className="bg-white border border-slate-100 rounded-[2rem] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.04)] p-8">

            {posts.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 rounded-[2rem] bg-slate-100 flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">📝</span>
                </div>
                <h3 className="text-2xl font-medium text-slate-800 mb-3 font-sans">还没有发布任何帖子</h3>
                <p className="text-slate-500 text-lg font-normal font-sans leading-relaxed">这个用户还没有发布任何内容</p>
              </div>
            ) : (
              <div className="space-y-6">
                {posts.map((post) => (
                  <div 
                    key={post.id} 
                    className="bg-slate-50/50 border border-slate-100 rounded-[2rem] p-6"
                    // onClick={() => navigate(`/post/${post.id}`)}
                  >
                    {/* 帖子头部信息 */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <span className="inline-flex items-center gap-1.5 bg-slate-50 text-slate-600 px-3 py-1 rounded-full text-xs font-medium tracking-wide ring-1 ring-slate-100 font-sans">
                          <span>{getSubCategoryIcon(post.subcategory_name)}</span>
                          <span>{post.subcategory_name}</span>
                        </span>
                      </div>
                      <span className="text-sm text-slate-400 font-normal font-sans">{formatDate(post.created_at)}</span>
                    </div>

                    {/* 帖子内容 */}
                    <div className="mb-4">
                      <p className="text-slate-900 leading-loose text-lg line-clamp-2 font-normal font-sans">{post.content}</p>
                    </div>

                    {/* 位置信息 */}
                    {post.location && (
                      <div className="flex items-center space-x-2 mb-4 text-sm py-2 text-slate-500">
                        <MapPinIcon className="h-4 w-4" />
                        <span className="text-sm font-normal max-w-[90%] truncate font-sans">{post.location}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 滚动加载提示 */}
            {loadingMore && posts.length > 0 && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-t-slate-600 mx-auto"></div>
                <p className="text-slate-500 mt-2 text-sm font-normal font-sans">加载更多...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 微信号弹窗 */}
      <Modal
        title="微信号"
        open={wechatModalOpen}
        onCancel={() => setWechatModalOpen(false)}
        footer={null}
        centered
        destroyOnHidden
      >
        {wechatIdInModal && (
          <div className="flex items-center justify-between gap-4 py-2 px-4 mt-2 rounded-xl bg-green-50 border border-green-100">
            <span className="text-green-700 font-medium text-lg font-sans truncate">{wechatIdInModal}</span>
            <button
              type="button"
              onClick={handleCopyWechat}
              className="flex-shrink-0 p-2 hover:bg-green-100 rounded-lg transition-colors"
              title="复制微信号"
            >
              {copied ? (
                <Check className="h-5 w-5 text-green-600" />
              ) : (
                <Copy className="h-5 w-5 text-green-600" />
              )}
            </button>
          </div>
        )}
      </Modal>
    </>
  );
};

export default UserProfilePage;
