import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrashIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { message } from 'antd';
import { API, authUtils } from '../api';
import type { Post } from '../api/types';

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

export default function MyPostsPage() {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (!authUtils.isAuthenticated()) navigate('/login');
  }, [navigate]);

  const fetchMyPosts = async (pageNum = 1) => {
    try {
      if (pageNum === 1) { setLoading(true); } else { setLoadingMore(true); }
      setError('');
      const response = await API.users.getUserPosts({ page: pageNum, limit: 10 });
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
      if (pageNum === 1) { setLoading(false); } else { setLoadingMore(false); }
    }
  };

  useEffect(() => { fetchMyPosts(1); }, []);

  const loadMore = useCallback(() => {
    if (!hasMore || loading || loadingMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchMyPosts(nextPage);
  }, [hasMore, loading, loadingMore, page]);

  useEffect(() => {
    const handleScroll = () => {
      if (!hasMore || loading || loadingMore) return;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      if (scrollTop + windowHeight >= documentHeight - 100) loadMore();
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, loading, loadingMore, loadMore]);

  const handleDeletePost = async (postId: number) => {
    if (!confirm('确定要删除这个帖子吗？删除后无法恢复。')) return;
    try {
      await API.posts.deletePost(postId);
      setPosts(prev => prev.filter(post => post.id !== postId));
    } catch (error) {
      console.error('删除帖子失败:', error);
      messageApi.error('删除失败，请重试');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <>
      {contextHolder}
      <div className="min-h-screen" style={{ backgroundColor: '#0e0e0f' }}>
        <div className="max-w-4xl mx-auto px-4 py-12">

          {/* Page title */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-white"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '-0.02em' }}>
              我的帖子
            </h1>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center justify-between px-5 py-4 rounded-2xl mb-6 text-sm"
              style={{ backgroundColor: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.15)', color: '#ff6b6b' }}>
              <span>{error}</span>
              <button onClick={() => fetchMyPosts(1)}
                className="ml-4 px-4 py-1.5 rounded-full text-xs font-semibold transition-all hover:opacity-80"
                style={{ backgroundColor: 'rgba(255,59,48,0.12)', color: '#ff6b6b', border: '1px solid rgba(255,59,48,0.2)' }}>
                重试
              </button>
            </div>
          )}

          {/* Posts */}
          {loading && posts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-8 h-8 mx-auto mb-4 rounded-full border-2 border-transparent animate-spin"
                style={{ borderTopColor: '#8ff5ff', borderRightColor: 'rgba(143,245,255,0.15)', borderBottomColor: 'rgba(143,245,255,0.15)', borderLeftColor: 'rgba(143,245,255,0.15)' }}
              />
              <p className="text-sm" style={{ color: '#6e6e73' }}>加载中...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"
                style={{ background: 'linear-gradient(135deg, rgba(143,245,255,0.1), rgba(213,117,255,0.1))' }}>
                <span className="text-4xl">📝</span>
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ color: '#e0e0e3', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                还没有发布帖子
              </h3>
              <p className="mb-8 text-sm leading-relaxed max-w-xs mx-auto" style={{ color: '#6e6e73' }}>
                开始分享你的想法，寻找志同道合的搭子吧！
              </p>
              <button onClick={() => navigate('/create-post')}
                className="px-8 py-3 rounded-full font-semibold text-sm transition-all hover:opacity-90 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #8ff5ff, #5bc8d4)', color: '#0e0e0f' }}>
                发布第一个帖子 ✨
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {posts.map((post) => {
                const catColor = hashColor(post.category_name || '', 0);
                const subColor = hashColor(post.subcategory_name || '', 3);
                return (
                  <div key={post.id} className="overflow-hidden flex flex-col" style={card}>
                    <div className="p-5 flex-1">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
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
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeletePost(post.id); }}
                          className="p-1.5 rounded-lg transition-all flex-shrink-0"
                          style={{ color: '#4e4e53' }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#ff6b6b'; e.currentTarget.style.backgroundColor = 'rgba(255,59,48,0.08)'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = '#4e4e53'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                          title="删除帖子"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Content */}
                      <p className="text-sm leading-relaxed line-clamp-5 mb-4" style={{ color: '#c4c4c8' }}>
                        {post.content}
                      </p>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-3"
                        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: '#6e6e73' }}>
                          <MapPinIcon className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate max-w-[140px]">{post.location || '未设置位置'}</span>
                        </div>
                        <span className="text-xs" style={{ color: '#4e4e53' }}>{formatDate(post.created_at)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Load more spinner */}
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
    </>
  );
}
