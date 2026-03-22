import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../api';
import type { Post, Category } from '../api/types';
import { redirectToLoginIfNeeded } from '../utils/auth';
import { useGenderFilter } from '../contexts/GenderFilterContext';

// Components
import CategoryFilter from '../components/CategoryFilter';
import PostCard from '../components/PostCard';

export default function HomePage() {
  const navigate = useNavigate();
  const { selectedGender } = useGenderFilter();
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<number | null>(null);
  const [location, setLocation] = useState<string>('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const SCROLL_THRESHOLD = 400;
    const handleScrollVisibility = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setShowBackToTop(scrollTop > SCROLL_THRESHOLD);
    };
    window.addEventListener('scroll', handleScrollVisibility, { passive: true });
    handleScrollVisibility();
    return () => window.removeEventListener('scroll', handleScrollVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await API.categories.getCategories();
        if (response.success) {
          setCategories(response.data);
        }
      } catch (error) {
        console.error('获取分类失败:', error);
      }
    };
    fetchCategories();
  }, []);

  const fetchPosts = async (pageNum = 1, categoryId?: number, subCategoryId?: number, locationParam?: string, genderParam?: 'male' | 'female' | null) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
        setPosts([]);
      } else {
        setLoadingMore(true);
      }
      setError('');

      const response = await API.posts.getPosts({
        page: pageNum,
        limit: 10,
        category_id: categoryId || undefined,
        subcategory_id: subCategoryId || undefined,
        location: locationParam || undefined,
        gender: genderParam || undefined,
      });
      console.log('response.data.list', posts);
      if (response.success) {
        if (pageNum === 1) {
          setPosts(response.data.list);
        } else {
          setPosts(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newPosts = response.data.list.filter(p => !existingIds.has(p.id));
            return [...prev, ...newPosts];
          });
        }
        setHasMore(response.data.pagination.page < response.data.pagination.pages);
      }
    } catch (error) {
      console.error('获取帖子列表失败:', error);
      setError('获取帖子列表失败，请刷新重试');
    } finally {
      if (pageNum === 1) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  };

  useEffect(() => {
    setPage(1);
    fetchPosts(1, selectedCategoryId || undefined, selectedSubCategoryId || undefined, location || undefined, selectedGender || undefined);
  }, [selectedCategoryId, selectedSubCategoryId, selectedGender]);

  const loadMore = useCallback(() => {
    if (!hasMore || loading || loadingMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(nextPage, selectedCategoryId || undefined, selectedSubCategoryId || undefined, location || undefined, selectedGender || undefined);
  }, [hasMore, loading, loadingMore, page, selectedCategoryId, selectedSubCategoryId, location, selectedGender]);

  const handleCategoryChange = (categoryId: number | null) => {
    setSelectedCategoryId(categoryId);
    setSelectedSubCategoryId(null);
  };

  const handleSubCategoryChange = (subCategoryId: number | null) => {
    setSelectedSubCategoryId(subCategoryId);
  };

  const handleLocationSearch = () => {
    setPage(1);
    fetchPosts(1, selectedCategoryId || undefined, selectedSubCategoryId || undefined, location || undefined, selectedGender || undefined);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleLocationSearch();
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (!hasMore || loading || loadingMore) return;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      if (scrollTop + windowHeight >= documentHeight - 100) {
        loadMore();
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, loading, loadingMore, loadMore]);

  const handleCreateFirstPost = () => {
    if (redirectToLoginIfNeeded(navigate)) return;
    navigate('/create-post');
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0e0e0f' }}>
      <div className="max-w-4xl mx-auto px-4 py-12">

        {/* Hero Section */}
        <div className="text-center mb-10">
          <h2
            className="text-3xl sm:text-4xl font-bold mb-4 text-white"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '-0.02em' }}
          >
            今天想找什么搭子？
          </h2>
          <p className="font-normal text-base leading-relaxed" style={{ color: '#8e8e93' }}>
            在这里发现有趣的人，开始美好的连接
          </p>
        </div>

        {/* Location Search */}
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <svg className="h-5 w-5" style={{ color: '#6e6e73' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="搜索位置，如：北京、三里屯..."
              className="block w-full pl-14 pr-28 py-4 rounded-2xl focus:outline-none transition-all duration-200 text-sm"
              style={{
                backgroundColor: '#131314',
                color: '#e0e0e3',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
              onFocus={e => {
                e.currentTarget.style.backgroundColor = '#201f21';
                e.currentTarget.style.border = '1px solid rgba(143,245,255,0.2)';
              }}
              onBlur={e => {
                e.currentTarget.style.backgroundColor = '#131314';
                e.currentTarget.style.border = '1px solid rgba(255,255,255,0.06)';
              }}
            />
            {/* Placeholder color */}
            <style>{`input::placeholder { color: #4e4e53; }`}</style>
            <div className="absolute inset-y-0 right-0 flex items-center pr-1.5 gap-1">
              {location && (
                <button
                  onClick={() => setLocation('')}
                  className="p-2 rounded-full transition-colors"
                  style={{ color: '#6e6e73' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#e0e0e3'}
                  onMouseLeave={e => e.currentTarget.style.color = '#6e6e73'}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              <button
                onClick={handleLocationSearch}
                className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 hover:opacity-90 active:scale-95 m-1"
                style={{
                  background: 'linear-gradient(135deg, #8ff5ff, #5bc8d4)',
                  color: '#0e0e0f',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                搜索
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <CategoryFilter
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          selectedSubCategoryId={selectedSubCategoryId}
          onCategoryChange={handleCategoryChange}
          onSubCategoryChange={handleSubCategoryChange}
        />

        {/* Error Message */}
        {error && (
          <div
            className="px-6 py-4 rounded-2xl mb-8 text-center text-sm"
            style={{ backgroundColor: 'rgba(255,59,48,0.08)', color: '#ff6b6b', border: '1px solid rgba(255,59,48,0.15)' }}
          >
            {error}
            <button
              onClick={() => fetchPosts(1, selectedCategoryId || undefined, selectedSubCategoryId || undefined, location || undefined, selectedGender || undefined)}
              className="ml-2 font-medium underline underline-offset-2 hover:opacity-80 transition-opacity"
            >
              重试
            </button>
          </div>
        )}

        {/* Posts Section */}
        <div className="space-y-5">
          {loading && posts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-8 h-8 mx-auto mb-4 rounded-full border-2 border-transparent animate-spin"
                style={{ borderTopColor: '#8ff5ff', borderRightColor: 'rgba(143,245,255,0.2)', borderBottomColor: 'rgba(143,245,255,0.2)', borderLeftColor: 'rgba(143,245,255,0.2)' }}
              />
              <p className="text-sm" style={{ color: '#6e6e73' }}>加载中...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20">
              <div
                className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"
                style={{ background: 'linear-gradient(135deg, rgba(143,245,255,0.1), rgba(213,117,255,0.1))' }}
              >
                <span className="text-4xl">🔍</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                暂无相关帖子
              </h3>
              <p className="mb-8 max-w-md mx-auto text-sm leading-relaxed" style={{ color: '#6e6e73' }}>
                {selectedCategoryId
                  ? `还没有人发布${categories.find(c => c.id === selectedCategoryId)?.name}相关的帖子，快来做第一个吧！`
                  : '没有找到匹配的帖子，试试其他关键词吧～'}
              </p>
              <button
                onClick={handleCreateFirstPost}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-full font-semibold text-sm transition-all duration-300 hover:opacity-90 active:scale-95 group"
                style={{ background: 'linear-gradient(135deg, #8ff5ff, #5bc8d4)', color: '#0e0e0f' }}
              >
                <span>发布第一篇帖子</span>
                <span className="group-hover:rotate-12 transition-transform">✨</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}

          {loadingMore && posts.length > 0 && (
            <div className="text-center py-6">
              <div className="w-6 h-6 mx-auto mb-2 rounded-full border-2 border-transparent animate-spin"
                style={{ borderTopColor: '#8ff5ff', borderRightColor: 'rgba(143,245,255,0.2)', borderBottomColor: 'rgba(143,245,255,0.2)', borderLeftColor: 'rgba(143,245,255,0.2)' }}
              />
              <p className="text-sm" style={{ color: '#6e6e73' }}>加载更多...</p>
            </div>
          )}
        </div>
      </div>

      {/* Back to top */}
      {showBackToTop && (
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="回到顶部"
          className="fixed bottom-8 right-6 z-50 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            backgroundColor: 'rgba(143,245,255,0.12)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(143,245,255,0.2)',
            color: '#8ff5ff',
          }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}
    </div>
  );
}
