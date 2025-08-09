import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeftIcon, MapPinIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { API } from '../api';
import type { Category, CreatePostRequest } from '../api/types';

const CreatePostPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CreatePostRequest>({
    content: '',
    location: '',
    category_id: 0,
    subcategory_id: 0,
    comment_visibility: 'public'
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  // 获取分类列表
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const response = await API.categories.getCategories();
        if (response.success) {
          setCategories(response.data);
          // 设置默认分类
          if (response.data.length > 0) {
            setFormData(prev => ({
              ...prev,
              category_id: response.data[0].id,
              subcategory_id: response.data[0].subcategories.length > 0 ? response.data[0].subcategories[0].id : 0
            }));
          }
        }
      } catch (error) {
        console.error('获取分类失败:', error);
        setError('获取分类失败，请刷新重试');
      } finally {
        setIsLoadingCategories(false);
      }
    };
    
    fetchCategories();
  }, []);

  // 获取当前主分类的子分类
  const currentCategory = categories.find(cat => cat.id === formData.category_id);
  const currentSubCategories = currentCategory?.subcategories || [];

  const handleChange = (field: keyof CreatePostRequest, value: string | number | boolean) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      
      // 如果改变了主分类，重置子分类
      if (field === 'category_id') {
        const selectedCategory = categories.find(cat => cat.id === value);
        newData.subcategory_id = selectedCategory?.subcategories && selectedCategory.subcategories.length > 0 ? selectedCategory.subcategories[0].id : 0;
      }
      
      return newData;
    });
    
    // 清除错误信息
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 表单验证
    if (!formData.content.trim()) {
      setError('请输入帖子内容');
      return;
    }
    
    if (!formData.location || !formData.location.trim()) {
      setError('请输入发布位置');
      return;
    }
    
    if (!formData.category_id || !formData.subcategory_id) {
      setError('请选择分类');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await API.posts.createPost(formData);
      
      if (response.success) {
        // 发布成功后返回首页
        navigate('/');
      }
    } catch (error: unknown) {
      console.error('发布帖子失败:', error);
      setError(error instanceof Error ? error.message : '发布失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = formData.content.trim() && 
                     formData.location && formData.location.trim() && 
                     formData.category_id && 
                     formData.subcategory_id;

  if (isLoadingCategories) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ChevronLeftIcon className="h-5 w-5 mr-1" />
            返回
          </button>
          <h1 className="text-lg font-semibold text-gray-900">发布帖子</h1>
          <div className="w-12"></div> {/* 占位符保持居中 */}
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 错误提示 */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* 帖子内容 */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              帖子内容 *
            </label>
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleChange('content', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="分享你的想法，寻找志同道合的搭子..."
              rows={6}
              maxLength={150}
              required
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-500">最多150字</span>
              <span className={`text-xs ${formData.content.length > 140 ? 'text-red-500' : 'text-gray-500'}`}>
                {formData.content.length}/150
              </span>
            </div>
          </div>

          {/* 发布位置 */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              发布位置 *
            </label>
            <div className="relative">
              <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="location"
                type="text"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="输入你的位置，如：北京市朝阳区"
                maxLength={200}
                required
              />
            </div>
          </div>

          {/* 分类选择 */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              选择分类 *
            </label>
            
            {/* 主分类 */}
            <div className="mb-4">
              <label htmlFor="category" className="block text-sm text-gray-600 mb-2">主分类</label>
              <select
                id="category"
                value={formData.category_id}
                onChange={(e) => handleChange('category_id', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 细分类型 */}
            {currentSubCategories.length > 0 && (
              <div>
                <label htmlFor="subcategory" className="block text-sm text-gray-600 mb-2">细分类型</label>
                <select
                  id="subcategory"
                  value={formData.subcategory_id}
                  onChange={(e) => handleChange('subcategory_id', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {currentSubCategories.map((subCategory) => (
                    <option key={subCategory.id} value={subCategory.id}>
                      {subCategory.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 评论可见性设置 */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              评论设置
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="commentVisibility"
                  value="public"
                  checked={formData.comment_visibility === 'public'}
                  onChange={(e) => handleChange('comment_visibility', e.target.value)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 flex items-center">
                  <EyeIcon className="h-4 w-4 mr-1" />
                  公开评论 - 所有人都可以看到评论
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="commentVisibility"
                  value="private"
                  checked={formData.comment_visibility === 'private'}
                  onChange={(e) => handleChange('comment_visibility', e.target.value)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 flex items-center">
                  <EyeSlashIcon className="h-4 w-4 mr-1" />
                  仅我可见 - 只有你能看到别人的评论
                </span>
              </label>
            </div>
          </div>

          {/* 提交按钮 */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <button
              type="submit"
              disabled={!isFormValid || isLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '发布中...' : '发布帖子'}
            </button>
            
            {!isFormValid && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                请完善所有必填信息后发布
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostPage; 