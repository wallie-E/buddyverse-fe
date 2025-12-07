import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeftIcon, MapPinIcon, EyeIcon, EyeSlashIcon, PencilIcon, ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Radio, message } from 'antd';
import { API } from '../api';
import type { Category, CreatePostRequest } from '../api/types';

const CreatePostPage = () => {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [formData, setFormData] = useState<CreatePostRequest>({
    content: '',
    location: '',
    category_id: 0,
    subcategory_id: 0,
    comment_visibility: 'public'
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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
            const firstCategory = response.data[0];
            setSelectedCategoryId(firstCategory.id);
            setFormData(prev => ({
              ...prev,
              category_id: firstCategory.id,
              subcategory_id: firstCategory.subcategories.length > 0 ? firstCategory.subcategories[0].id : 0
            }));
          }
        }
      } catch (error) {
        console.error('获取分类失败:', error);
        messageApi.error('获取分类失败，请刷新重试');
      } finally {
        setIsLoadingCategories(false);
      }
    };
    
    fetchCategories();
  }, [messageApi]);

  // 获取当前主分类的子分类
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(0);
  const currentCategory = categories.find(cat => cat.id === selectedCategoryId);
  const currentSubCategories = currentCategory?.subcategories || [];

  // 下拉菜单状态
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isSubCategoryDropdownOpen, setIsSubCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const subCategoryDropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
      if (subCategoryDropdownRef.current && !subCategoryDropdownRef.current.contains(event.target as Node)) {
        setIsSubCategoryDropdownOpen(false);
      }
    };

    if (isCategoryDropdownOpen || isSubCategoryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCategoryDropdownOpen, isSubCategoryDropdownOpen]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 表单验证
    if (!formData.content.trim()) {
      messageApi.error('请输入帖子内容');
      return;
    }
    if (formData.content.length > 150) {
      messageApi.error('帖子内容最多150字');
      return;
    }
    if (!formData.location || !formData.location.trim()) {
      messageApi.error('请输入发布位置');
      return;
    }
    if (formData.location.length > 200) {
      messageApi.error('发布位置最多200字');
      return;
    }
    if (!formData.category_id) {
      messageApi.error('请选择主分类');
      return;
    }
    if (currentSubCategories.length > 0 && !formData.subcategory_id) {
      messageApi.error('请选择细分类型');
      return;
    }

    setIsLoading(true);

    try {
      const response = await API.posts.createPost(formData);
      
      if (response.success) {
        messageApi.success('帖子发布成功！');
        // 发布成功后返回首页
        navigate('/');
      } else {
        messageApi.error(response.message || '发布失败，请重试');
      }
    } catch (error: unknown) {
      console.error('发布帖子失败:', error);
      messageApi.error(error instanceof Error ? error.message : '发布失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };


  if (isLoadingCategories) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-[2rem] bg-slate-100 flex items-center justify-center mx-auto mb-6">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-slate-600"></div>
          </div>
          <p className="text-slate-600 text-lg font-medium font-sans">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {contextHolder}
      <div className="min-h-screen bg-slate-50/50">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-10">
          <div className="flex items-center justify-between px-4 py-4 max-w-2xl mx-auto">
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-slate-600 hover:text-slate-900 transition-colors font-sans"
            >
              <ChevronLeftIcon className="h-5 w-5 mr-1" />
              返回
            </button>
            <h1 className="text-lg font-medium text-slate-900 font-sans">发布帖子</h1>
            <div className="w-12"></div> {/* 占位符保持居中 */}
          </div>
        </div>

        {/* Form */}
        <div className="max-w-2xl mx-auto px-4 py-12">
          <form onSubmit={handleSubmit} className="space-y-6">
           

          {/* 帖子内容 */}
          <div className="bg-white border border-slate-100 rounded-[2rem] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.04)] p-8">
            <label htmlFor="content" className="block text-slate-900 font-medium text-lg mb-3 font-sans">
              帖子内容
            </label>
            <div className="relative">
              <textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="分享你的想法，寻找志同道合的搭子..."
                rows={6}
                maxLength={150}
                className="w-full px-6 py-4 rounded-2xl border-0 ring-1 ring-slate-100 focus:ring-1 focus:ring-slate-100 focus:bg-white focus:outline-none transition-all duration-200 text-lg caret-slate-600 font-sans resize-none"
              />
              <div className="text-right mt-2 text-sm text-slate-400 font-sans">
                {formData.content.length}/150
              </div>
            </div>
          </div>

          {/* 发布位置 */}
          <div className="bg-white border border-slate-100 rounded-[2rem] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.04)] p-8">
            <label htmlFor="location" className="block text-slate-900 font-medium text-lg mb-3 font-sans">
              发布位置
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MapPinIcon className="h-5 w-5 text-slate-400" />
              </div>
              <input
                id="location"
                type="text"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="输入你的位置，如：北京市朝阳区"
                maxLength={200}
                className="w-full pl-12 pr-6 py-4 rounded-full border-0 ring-1 ring-slate-100 focus:ring-1 focus:ring-slate-100 focus:bg-white focus:outline-none transition-all duration-200 text-lg h-12 caret-slate-600 font-sans"
              />
            </div>
          </div>

          {/* 分类选择 */}
          <div className="bg-white border border-slate-100 rounded-[2rem] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.04)] p-8">
            <label htmlFor="category_id" className="block text-slate-900 font-medium text-lg mb-3 font-sans">
              主分类
            </label>
            <div className="relative" ref={categoryDropdownRef}>
              <button
                type="button"
                onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                className="w-full flex items-center justify-between px-6 py-4 rounded-full border-0 ring-1 ring-slate-100 focus:ring-1 focus:ring-slate-100 focus:bg-white focus:outline-none transition-all duration-200 text-lg text-slate-600 font-sans text-left"
              >
                <span>
                  {formData.category_id 
                    ? categories.find(cat => cat.id === formData.category_id)?.name || '请选择主分类'
                    : '请选择主分类'
                  }
                </span>
                <ChevronDownIcon className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isCategoryDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border-0 ring-1 ring-slate-100 rounded-[1.5rem] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] z-20 overflow-hidden">
                  <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-100 p-1.5">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => {
                          setSelectedCategoryId(category.id);
                          const selectedCategory = categories.find(cat => cat.id === category.id);
                          setFormData(prev => ({
                            ...prev,
                            category_id: category.id,
                            subcategory_id: selectedCategory?.subcategories && selectedCategory.subcategories.length > 0 
                              ? selectedCategory.subcategories[0].id 
                              : 0
                          }));
                          setIsCategoryDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 rounded-xl flex items-center justify-between transition-colors text-slate-600 font-sans"
                      >
                        <span>{category.name}</span>
                        {formData.category_id === category.id && (
                          <CheckIcon className="h-4 w-4 text-slate-800" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 细分类型 */}
            {currentSubCategories.length > 0 && (
              <div className="mt-6">
                <label htmlFor="subcategory_id" className="block text-slate-900 font-medium text-lg mb-3 font-sans">
                  细分类型
                </label>
                <div className="relative" ref={subCategoryDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsSubCategoryDropdownOpen(!isSubCategoryDropdownOpen)}
                    className="w-full flex items-center justify-between px-6 py-4 rounded-full border-0 ring-1 ring-slate-100 focus:ring-1 focus:ring-slate-100 focus:bg-white focus:outline-none transition-all duration-200 text-lg text-slate-600 font-sans text-left"
                  >
                    <span>
                      {formData.subcategory_id 
                        ? currentSubCategories.find(sub => sub.id === formData.subcategory_id)?.name || '请选择细分类型'
                        : '请选择细分类型'
                      }
                    </span>
                    <ChevronDownIcon className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${isSubCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isSubCategoryDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border-0 ring-1 ring-slate-100 rounded-[1.5rem] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] z-20 overflow-hidden">
                      <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-100 p-1.5">
                        {currentSubCategories.map((subCategory) => (
                          <button
                            key={subCategory.id}
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, subcategory_id: subCategory.id }));
                              setIsSubCategoryDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 rounded-xl flex items-center justify-between transition-colors text-slate-600 font-sans"
                          >
                            <span>{subCategory.name}</span>
                            {formData.subcategory_id === subCategory.id && (
                              <CheckIcon className="h-4 w-4 text-slate-800" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 评论可见性设置 */}
          <div className="bg-white border border-slate-100 rounded-[2rem] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.04)] p-8">
            <label className="block text-slate-900 font-medium text-lg mb-3 font-sans">
              评论设置
            </label>
            <Radio.Group 
              value={formData.comment_visibility}
              onChange={(e) => setFormData(prev => ({ ...prev, comment_visibility: e.target.value }))}
            >
              <div className="space-y-4">
                <Radio value="public" className="w-full">
                  <span className="flex items-center text-slate-700 font-sans">
                    <EyeIcon className="h-5 w-5 mr-3 text-green-500" />
                    <div>
                      <div className="font-medium font-sans">公开评论</div>
                      <div className="text-sm text-slate-500 font-normal font-sans leading-relaxed">所有人都可以看到评论</div>
                    </div>
                  </span>
                </Radio>
                <div></div>
                <Radio value="private" className="w-full">
                  <span className="flex items-center text-slate-700 font-sans">
                    <EyeSlashIcon className="h-5 w-5 mr-3 text-orange-500" />
                    <div>
                      <div className="font-medium font-sans">仅我可见</div>
                      <div className="text-sm text-slate-500 font-normal font-sans leading-relaxed">只有你能看到别人的评论</div>
                    </div>
                  </span>
                </Radio>
              </div>
            </Radio.Group>
          </div>

          {/* 提交按钮 */}
          <div className="bg-white border border-slate-100 rounded-[2rem] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.04)] p-8">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-slate-900 text-white rounded-full font-medium transition-all duration-300 flex items-center justify-center space-x-2 border-0 hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed font-sans"
            >
              <PencilIcon className="h-4 w-4" />
              <span>{isLoading ? '发布中...' : '发布帖子'}</span>
            </button>
          </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default CreatePostPage; 