import { useState, useEffect } from 'react';
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
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
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
  const fetchPosts = async (pageNum = 1, categoryId?: number, subCategoryId?: number) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await API.posts.getPosts({
        page: pageNum,
        limit: 10,
        category_id: categoryId || undefined,
        subcategory_id: subCategoryId || undefined,
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
      setLoading(false);
    }
  };

  // 初始加载和筛选
  useEffect(() => {
    setPage(1);
    fetchPosts(1, selectedCategoryId || undefined, selectedSubCategoryId || undefined);
  }, [selectedCategoryId, selectedSubCategoryId]);

  // 加载更多
  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(nextPage, selectedCategoryId || undefined, selectedSubCategoryId || undefined);
  };

  const handleCategoryChange = (categoryId: number | null) => {
    setSelectedCategoryId(categoryId);
    setSelectedSubCategoryId(null); // 重置子分类
  };

  const handleSubCategoryChange = (subCategoryId: number | null) => {
    setSelectedSubCategoryId(subCategoryId);
  };

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
            寻找你的搭子
          </h2>
          <p className="text-gray-600 mb-6">
            在这里发现志同道合的伙伴，一起探索生活的美好
          </p>
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
              onClick={() => fetchPosts(1, selectedCategoryId || undefined, selectedSubCategoryId || undefined)}
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
          
          {/* Load More Button */}
          {hasMore && posts.length > 0 && (
            <div className="text-center pt-8">
              <button
                onClick={loadMore}
                disabled={loading}
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-3 rounded-full hover:from-blue-600 hover:to-purple-600 transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-xl"
              >
                {loading ? '加载中...' : '加载更多'}
              </button>
            </div>
          )}
        </div>
       
      </div>
    </div>
  );
}
