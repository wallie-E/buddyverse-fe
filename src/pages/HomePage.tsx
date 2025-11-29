import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../api';
import type { Post, Category } from '../api/types';
import { redirectToLoginIfNeeded } from '../utils/auth';

// Components
import CategoryFilter from '../components/CategoryFilter';
import PostCard from '../components/PostCard';

export default function HomePage() {
  const navigate = useNavigate();
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

  // 获取分类列表
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

  // 获取帖子列表
  const fetchPosts = async (pageNum = 1, categoryId?: number, subCategoryId?: number, locationParam?: string) => {
    try {
      // 第一页使用 loading，后续页面使用 loadingMore
      if (pageNum === 1) {
        setLoading(true);
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

  // 统一处理筛选条件变化（位置搜索防抖，分类切换即时）
  useEffect(() => {
    // 有搜索词时防抖 500ms，无搜索词时（如初始加载或仅切换分类）几乎立即执行
    const timeoutId = setTimeout(() => {
      setPage(1);
      fetchPosts(1, selectedCategoryId || undefined, selectedSubCategoryId || undefined, location || undefined);
    }, location ? 500 : 0);

    return () => clearTimeout(timeoutId);
  }, [location, selectedCategoryId, selectedSubCategoryId]);

  // 加载更多
  const loadMore = useCallback(() => {
    if (!hasMore || loading || loadingMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(nextPage, selectedCategoryId || undefined, selectedSubCategoryId || undefined, location || undefined);
  }, [hasMore, loading, loadingMore, page, selectedCategoryId, selectedSubCategoryId, location]);

  const handleCategoryChange = (categoryId: number | null) => {
    setSelectedCategoryId(categoryId);
    setSelectedSubCategoryId(null); // 重置子分类
  };

  const handleSubCategoryChange = (subCategoryId: number | null) => {
    setSelectedSubCategoryId(subCategoryId);
  };

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

  // 处理发布第一个帖子点击事件
  const handleCreateFirstPost = () => {
    // 检查用户是否已登录，如果未登录则跳转到登录页
    if (redirectToLoginIfNeeded(navigate)) {
      return;
    }
    // 用户已登录，跳转到发布帖子页面
    navigate('/create-post');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            今天想找什么搭子？
          </h2>
          <p className="text-gray-600 mb-6">
            在这里发现有趣的人，开始美好的连接
          </p>
        </div>


        {/* Location Search */}
        <div className="mb-6">
          <div className="relative max-w-md mx-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="搜索位置如：北京、朝阳区、三里屯..."
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
            />
            {location && (
              <button
                onClick={() => setLocation('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
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
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
            {error}
            <button
              onClick={() => fetchPosts(1, selectedCategoryId || undefined, selectedSubCategoryId || undefined, location || undefined)}
              className="ml-2 text-red-700 underline"
            >
              重试
            </button>
          </div>
        )}


        {/* Posts Section */}
        <div className="space-y-6">
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {selectedCategoryId
                ? `${categories.find(c => c.id === selectedCategoryId)?.name || ''}帖子`
                : '最新帖子'
              }
            </h3>
          </div>

          {/* Posts List */}
          {loading && posts.length === 0 ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">加载中...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-r from-slate-200 to-slate-300 flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">🔍</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3">暂无相关帖子</h3>
              <p className="text-slate-600 mb-8 max-w-md mx-auto">
                {selectedCategoryId
                  ? `还没有人发布${categories.find(c => c.id === selectedCategoryId)?.name}相关的帖子，快来做第一个吧！`
                  : "没有找到匹配的帖子，试试其他关键词吧～"}
              </p>
              <button
                onClick={handleCreateFirstPost}
                className="h-12 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 font-medium text-white"
              >
                发布第一篇帖子 ✨
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
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
    </div>
  );
}
