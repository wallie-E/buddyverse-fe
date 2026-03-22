import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapPinIcon } from '@heroicons/react/24/outline';
import { Copy, Check, MessageCircle } from 'lucide-react';
import { message, Modal } from 'antd';
import { getUserProfile } from '../api/users';
import { authUtils } from '../api';
import { viewWechat } from '../api/wechatExchange';
import { redirectToLoginIfNeeded } from '../utils/auth';
import type { User, Post } from '../api/types';

const card = {
  backgroundColor: '#1c1b1e',
  borderRadius: '1.25rem',
  border: '1px solid rgba(255,255,255,0.05)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(143,245,255,0.04)',
} as const;

const TAG_PALETTE = [
  { bg: 'rgba(143,245,255,0.12)', color: '#8ff5ff' },
  { bg: 'rgba(213,117,255,0.12)', color: '#d575ff' },
  { bg: 'rgba(170,255,220,0.12)', color: '#aaffdc' },
  { bg: 'rgba(255,143,171,0.12)', color: '#ff8fab' },
  { bg: 'rgba(255,179,71,0.12)',  color: '#ffb347' },
  { bg: 'rgba(135,206,235,0.12)', color: '#87ceeb' },
];
const hashColor = (name: string, offset = 0) => {
  let h = offset;
  for (let i = 0; i < name.length; i++) h += name.charCodeAt(i);
  return TAG_PALETTE[h % TAG_PALETTE.length];
};

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

  const currentUser = authUtils.getCurrentUser();
  const isCurrentUser = currentUser && id && currentUser.id?.toString() === id;

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!id) { setError('用户ID不存在'); setLoading(false); return; }
      if (isCurrentUser) { navigate('/profile'); return; }
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
        setError(err instanceof Error ? err.message : '获取用户资料失败');
      } finally {
        setLoading(false);
      }
    };
    fetchUserProfile();
  }, [id, navigate, isCurrentUser]);

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

  useEffect(() => {
    const handleScroll = () => {
      if (!hasMore || loading || loadingMore) return;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      if (scrollTop + windowHeight >= documentHeight - 100) loadMorePosts();
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, loading, loadingMore, loadMorePosts]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}天前`;
    if (hours > 0) return `${hours}小时前`;
    if (minutes > 0) return `${minutes}分钟前`;
    return '刚刚';
  };

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
    } catch {
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
    } catch {
      messageApi.error('复制失败');
    }
  };

  if (loading) {
    return (
      <>
        {contextHolder}
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0e0e0f' }}>
          <div className="text-center">
            <div className="w-8 h-8 mx-auto mb-4 rounded-full border-2 border-transparent animate-spin"
              style={{ borderTopColor: '#8ff5ff', borderRightColor: 'rgba(143,245,255,0.15)', borderBottomColor: 'rgba(143,245,255,0.15)', borderLeftColor: 'rgba(143,245,255,0.15)' }}
            />
            <p className="text-sm" style={{ color: '#6e6e73' }}>加载中...</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !user) {
    return (
      <>
        {contextHolder}
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0e0e0f' }}>
          <div className="text-center">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"
              style={{ background: 'linear-gradient(135deg, rgba(255,59,48,0.1), rgba(213,117,255,0.1))' }}>
              <span className="text-4xl">😞</span>
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: '#e0e0e3', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>出错了</h3>
            <p className="mb-6 text-sm" style={{ color: '#ff6b6b' }}>{error || '用户不存在'}</p>
            <button onClick={() => navigate('/')}
              className="px-6 py-2.5 rounded-full text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #8ff5ff, #5bc8d4)', color: '#0e0e0f' }}>
              返回首页
            </button>
          </div>
        </div>
      </>
    );
  }

  const avatarColor = hashColor(user.nickname || '', 0);

  return (
    <>
      {contextHolder}
      <div className="min-h-screen" style={{ backgroundColor: '#0e0e0f' }}>
        <div className="max-w-4xl mx-auto px-4 py-12">

          {/* User info card */}
          <div className="p-8 mb-6 text-center" style={card}>
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-5 font-bold text-4xl"
              style={{
                background: `linear-gradient(135deg, ${avatarColor.bg.replace('0.12', '0.35')}, rgba(213,117,255,0.2))`,
                color: avatarColor.color,
                border: `2px solid ${avatarColor.bg}`,
              }}>
              {user.avatar ? (
                <img src={user.avatar} alt={user.nickname} className="w-24 h-24 rounded-full object-cover" />
              ) : user.nickname.charAt(0)}
            </div>

            <h2 className="text-2xl font-bold mb-2" style={{ color: '#e0e0e3', fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '-0.02em' }}>
              {user.nickname || '未知用户'}
            </h2>
            <p className="text-sm leading-relaxed mb-5 max-w-sm mx-auto" style={{ color: '#8e8e93' }}>
              {user.signature || '该用户暂无介绍'}
            </p>

            {/* Gender */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="text-lg">
                {user.gender === 'male' ? '👨' : user.gender === 'female' ? '👩' : '🤖'}
              </span>
              <span className="text-sm font-medium" style={{ color: '#8e8e93' }}>
                {user.gender === 'male' ? '男' : user.gender === 'female' ? '女' : '其他'}
              </span>
            </div>

            {/* WeChat button */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
              <button type="button" onClick={handleViewWechat} disabled={viewingWechat}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                style={{ backgroundColor: 'rgba(143,245,255,0.08)', color: '#8ff5ff', border: '1px solid rgba(143,245,255,0.15)' }}>
                <MessageCircle className="h-4 w-4" strokeWidth={2} />
                {viewingWechat ? '查看中...' : '查看微信'}
              </button>
            </div>
          </div>

          {/* Posts section */}
          <div className="p-6" style={card}>
            <h3 className="text-base font-bold mb-5" style={{ color: '#e0e0e3', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Ta 的帖子
            </h3>

            {posts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'linear-gradient(135deg, rgba(143,245,255,0.08), rgba(213,117,255,0.08))' }}>
                  <span className="text-3xl">📝</span>
                </div>
                <h4 className="text-base font-semibold mb-2" style={{ color: '#c4c4c8' }}>还没有发布任何帖子</h4>
                <p className="text-sm" style={{ color: '#6e6e73' }}>这个用户还没有发布任何内容</p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => {
                  const catColor = hashColor(post.category_name || '', 0);
                  const subColor = hashColor(post.subcategory_name || '', 3);
                  return (
                    <div key={post.id} className="p-5 rounded-xl"
                      style={{ backgroundColor: '#131314', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {post.category_name && (
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                              style={{ backgroundColor: catColor.bg, color: catColor.color }}>
                              {post.category_name.replace('搭子', '')}
                            </span>
                          )}
                          {post.subcategory_name && (
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                              style={{ backgroundColor: subColor.bg, color: subColor.color }}>
                              {post.subcategory_name}
                            </span>
                          )}
                        </div>
                        <span className="text-xs flex-shrink-0" style={{ color: '#4e4e53' }}>{formatDate(post.created_at)}</span>
                      </div>
                      <p className="text-sm leading-relaxed line-clamp-3 mb-3" style={{ color: '#c4c4c8' }}>
                        {post.content}
                      </p>
                      {post.location && (
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: '#6e6e73' }}>
                          <MapPinIcon className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate max-w-xs">{post.location}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {loadingMore && posts.length > 0 && (
              <div className="text-center py-6">
                <div className="w-6 h-6 mx-auto mb-2 rounded-full border-2 border-transparent animate-spin"
                  style={{ borderTopColor: '#8ff5ff', borderRightColor: 'rgba(143,245,255,0.15)', borderBottomColor: 'rgba(143,245,255,0.15)', borderLeftColor: 'rgba(143,245,255,0.15)' }}
                />
                <p className="text-xs" style={{ color: '#6e6e73' }}>加载更多...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* WeChat modal */}
      <Modal title="微信号" open={wechatModalOpen} onCancel={() => setWechatModalOpen(false)} footer={null} centered destroyOnHidden>
        {wechatIdInModal && (
          <div className="flex items-center justify-between gap-4 py-3 px-4 mt-2 rounded-xl"
            style={{ backgroundColor: 'rgba(143,245,255,0.06)', border: '1px solid rgba(143,245,255,0.12)' }}>
            <span className="font-semibold text-base truncate" style={{ color: '#8ff5ff' }}>{wechatIdInModal}</span>
            <button type="button" onClick={handleCopyWechat}
              className="flex-shrink-0 p-2 rounded-lg transition-colors"
              style={{ color: '#8ff5ff' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(143,245,255,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              title="复制微信号">
              {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
            </button>
          </div>
        )}
      </Modal>
    </>
  );
};

export default UserProfilePage;
