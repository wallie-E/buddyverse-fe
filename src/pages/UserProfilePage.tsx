import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapPinIcon } from '@heroicons/react/24/outline';
import { Copy, Check, MessageCircle, X, FilePlus } from 'lucide-react';
import { message, Modal, Popover } from 'antd';
import { getUserProfile, getUserPosts } from '../api/users';
import { authUtils } from '../api';
import { viewWechat, extractViewContact } from '../api/wechatExchange';
import { redirectToLoginIfNeeded } from '../utils/auth';
import { postCheckCache } from '../utils/postCheckCache';
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
  const [qqIdInModal, setQqIdInModal] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedLocationId, setCopiedLocationId] = useState<number | null>(null);
  const [needPostModalOpen, setNeedPostModalOpen] = useState(false);

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
    if (!postCheckCache.get()) {
      try {
        const postsRes = await getUserPosts({ page: 1, limit: 1 });
        if (postsRes.success) {
          if (postsRes.data.pagination.total === 0) {
            setNeedPostModalOpen(true);
            return;
          } else {
            postCheckCache.setTrue();
          }
        }
      } catch {
        // fail open
      }
    }
    setViewingWechat(true);
    try {
      const res = await viewWechat(Number(user.id));
      const { wechat, qq } = extractViewContact(res.data);
      if (res.success && (wechat || qq)) {
        setWechatIdInModal(wechat || null);
        setQqIdInModal(qq || null);
        setWechatModalOpen(true);
        setCopied(false);
      } else {
        messageApi.error('暂无联系方式');
      }
    } catch {
      messageApi.error('暂无联系方式');
    } finally {
      setViewingWechat(false);
    }
  };

  const handleCopyLocation = async (e: React.MouseEvent, post: Post) => {
    e.stopPropagation();
    if (!post.location) return;
    try {
      await navigator.clipboard.writeText(post.location);
      setCopiedLocationId(post.id);
      setTimeout(() => setCopiedLocationId(null), 2000);
    } catch {
      messageApi.error('复制失败');
    }
  };

  const handleCopyWechat = async () => {
    const lines: string[] = [];
    if (wechatIdInModal) lines.push(`微信号：${wechatIdInModal}`);
    if (qqIdInModal) lines.push(`QQ：${qqIdInModal}`);
    if (!lines.length) return;
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      messageApi.success('联系方式已复制');
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
                {viewingWechat ? '查看中...' : '查看联系方式'}
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
                      <p className="text-sm leading-relaxed mb-5 whitespace-pre-wrap break-words" style={{ color: '#c4c4c8' }}>
                        {post.content}
                      </p>
                      {post.location && (
                        <Popover
                          trigger="click"
                          placement="topLeft"
                          arrow={false}
                          overlayStyle={{ paddingBottom: 6 }}
                          overlayInnerStyle={{
                            backgroundColor: '#1c1b1e',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '0.875rem',
                            padding: '0.875rem 1rem',
                            boxShadow: '0 12px 40px rgba(0,0,0,0.55)',
                          }}
                          content={
                            <div style={{ minWidth: 180, maxWidth: 260 }} onClick={e => e.stopPropagation()}>
                              <div style={{ color: '#e0e0e3', fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.5, marginBottom: '0.75rem', wordBreak: 'break-all' }}>
                                {post.location}
                              </div>
                              <button
                                type="button"
                                onClick={e => handleCopyLocation(e, post)}
                                style={{
                                  width: '100%', padding: '0.5rem', borderRadius: '0.625rem', cursor: 'pointer',
                                  background: copiedLocationId === post.id
                                    ? 'linear-gradient(135deg, rgba(7,193,96,0.15), rgba(7,193,96,0.07))'
                                    : 'linear-gradient(135deg, rgba(143,245,255,0.1), rgba(143,245,255,0.04))',
                                  border: `1px solid ${copiedLocationId === post.id ? 'rgba(7,193,96,0.28)' : 'rgba(143,245,255,0.16)'}`,
                                  color: copiedLocationId === post.id ? '#4ade80' : '#8ff5ff',
                                  fontWeight: 600, fontSize: '0.8125rem',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem',
                                  transition: 'all 0.2s',
                                }}
                              >
                                {copiedLocationId === post.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                {copiedLocationId === post.id ? '已复制' : '复制地址'}
                              </button>
                            </div>
                          }
                        >
                          <div
                            className="flex items-center gap-1.5 text-xs"
                            style={{ color: '#6e6e73', cursor: 'pointer' }}
                            onClick={e => e.stopPropagation()}
                          >
                            <MapPinIcon className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="font-medium w-45 sm:w-100 truncate">
                              {post.location}
                            </span>
                          </div>
                        </Popover>
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
      <Modal
        open={wechatModalOpen}
        onCancel={() => setWechatModalOpen(false)}
        footer={null}
        centered
        destroyOnHidden
        width={360}
        closable={false}
        styles={{
          content: {
            backgroundColor: '#1c1b1e',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '1.5rem',
            padding: 0,
            overflow: 'hidden',
            boxShadow: '0 24px 64px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04)',
          },
          body: { padding: 0 },
          mask: { backdropFilter: 'blur(6px)', backgroundColor: 'rgba(0,0,0,0.65)' },
        }}
      >
        <div style={{ padding: '1.75rem' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              <div style={{
                width: '2.75rem', height: '2.75rem', borderRadius: '0.875rem',
                background: 'linear-gradient(135deg, rgba(7,193,96,0.18), rgba(7,193,96,0.06))',
                border: '1px solid rgba(7,193,96,0.22)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <MessageCircle style={{ width: '1.25rem', height: '1.25rem', color: '#07C160' }} strokeWidth={2} />
              </div>
              <div>
                <div style={{ color: '#e0e0e3', fontWeight: 700, fontSize: '1rem', lineHeight: 1.3 }}>联系方式</div>
                <div style={{ color: '#6e6e73', fontSize: '0.75rem', marginTop: '0.125rem' }}>微信号与 QQ（如有）</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setWechatModalOpen(false)}
              style={{
                width: '2rem', height: '2rem', borderRadius: '0.5rem', flexShrink: 0,
                backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                color: '#6e6e73', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#a0a0a8'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#6e6e73'; }}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {(wechatIdInModal || qqIdInModal) && (
            <>
              {wechatIdInModal && (
                <div style={{
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '0.875rem',
                  padding: '0.875rem 1.125rem',
                  marginBottom: '0.625rem',
                }}>
                  <div style={{ color: '#4e4e53', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.375rem' }}>
                    微信号
                  </div>
                  <div style={{ color: '#e0e0e3', fontWeight: 600, fontSize: '1.0625rem', letterSpacing: '0.03em', fontFamily: 'ui-monospace, "SF Mono", monospace' }}>
                    {wechatIdInModal}
                  </div>
                </div>
              )}
              {qqIdInModal && (
                <div style={{
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '0.875rem',
                  padding: '0.875rem 1.125rem',
                  marginBottom: '0.875rem',
                }}>
                  <div style={{ color: '#4e4e53', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.375rem' }}>
                    QQ 号
                  </div>
                  <div style={{ color: '#e0e0e3', fontWeight: 600, fontSize: '1.0625rem', letterSpacing: '0.03em', fontFamily: 'ui-monospace, "SF Mono", monospace' }}>
                    {qqIdInModal}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleCopyWechat}
                style={{
                  width: '100%', padding: '0.8125rem', borderRadius: '0.875rem', cursor: 'pointer',
                  background: copied
                    ? 'linear-gradient(135deg, rgba(7,193,96,0.15), rgba(7,193,96,0.07))'
                    : 'linear-gradient(135deg, rgba(143,245,255,0.1), rgba(143,245,255,0.04))',
                  border: `1px solid ${copied ? 'rgba(7,193,96,0.28)' : 'rgba(143,245,255,0.16)'}`,
                  color: copied ? '#4ade80' : '#8ff5ff',
                  fontWeight: 600, fontSize: '0.9375rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? '已复制' : '复制联系方式'}
              </button>
            </>
          )}
        </div>
      </Modal>

      {/* 需先发帖提示 — 与帖子卡片同一套深色样式 */}
      <Modal
        open={needPostModalOpen}
        onCancel={() => setNeedPostModalOpen(false)}
        footer={null}
        centered
        destroyOnHidden
        width={360}
        closable={false}
        styles={{
          content: {
            backgroundColor: '#1c1b1e',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '1.5rem',
            padding: 0,
            overflow: 'hidden',
            boxShadow: '0 24px 64px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04)',
          },
          body: { padding: 0 },
          mask: { backdropFilter: 'blur(6px)', backgroundColor: 'rgba(0,0,0,0.65)' },
        }}
      >
        <div style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              <div style={{
                width: '2.75rem', height: '2.75rem', borderRadius: '0.875rem',
                background: 'linear-gradient(135deg, rgba(143,245,255,0.18), rgba(143,245,255,0.06))',
                border: '1px solid rgba(143,245,255,0.22)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <FilePlus style={{ width: '1.25rem', height: '1.25rem', color: '#8ff5ff' }} strokeWidth={2} />
              </div>
              <div>
                <div style={{ color: '#e0e0e3', fontWeight: 700, fontSize: '1rem', lineHeight: 1.3 }}>请先发布帖子</div>
                <div style={{ color: '#6e6e73', fontSize: '0.8125rem', marginTop: '0.375rem', lineHeight: 1.5 }}>
                  查看他人联系方式前，需要先发布至少一个帖子。
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setNeedPostModalOpen(false)}
              style={{
                width: '2rem', height: '2rem', borderRadius: '0.5rem', flexShrink: 0,
                backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                color: '#6e6e73', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#a0a0a8'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#6e6e73'; }}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => setNeedPostModalOpen(false)}
              style={{
                flex: 1, padding: '0.75rem', borderRadius: '0.875rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem',
                backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#a0a0a8',
              }}
            >
              取消
            </button>
            <button
              type="button"
              onClick={() => {
                setNeedPostModalOpen(false);
                navigate('/create-post');
              }}
              style={{
                flex: 1, padding: '0.75rem', borderRadius: '0.875rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem',
                background: 'linear-gradient(135deg, rgba(143,245,255,0.14), rgba(143,245,255,0.06))',
                border: '1px solid rgba(143,245,255,0.22)', color: '#8ff5ff',
              }}
            >
              去发布
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default UserProfilePage;
