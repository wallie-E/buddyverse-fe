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
    <div className="min-h-screen bg-gray-50">
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
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">暂无帖子</p>
              <button
                onClick={handleCreateFirstPost}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                发布第一个帖子
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
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
        </div>
       
      </div>
    </div>
  );
}
