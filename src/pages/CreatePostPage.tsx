import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeftIcon, MapPinIcon, PencilIcon, ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';
import { message, Modal } from 'antd';
import { API, authUtils } from '../api';
import type { Category, CreatePostRequest } from '../api/types';

const card = {
  backgroundColor: '#1c1b1e',
  borderRadius: '1.25rem',
  border: '1px solid rgba(255,255,255,0.05)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(143,245,255,0.04)',
} as const;

const inputBase: React.CSSProperties = {
  backgroundColor: '#131314',
  color: '#e0e0e3',
  border: '1px solid rgba(255,255,255,0.06)',
  outline: 'none',
  transition: 'all 0.2s',
  width: '100%',
  padding: '0.75rem 1.25rem',
  borderRadius: '0.75rem',
  fontSize: '0.9375rem',
};

const CreatePostPage = () => {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [formData, setFormData] = useState<CreatePostRequest>({
    content: '',
    location: '',
    category_id: 0,
    subcategory_id: 0
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(0);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isSubCategoryDropdownOpen, setIsSubCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const subCategoryDropdownRef = useRef<HTMLDivElement>(null);

  const currentCategory = categories.find(cat => cat.id === selectedCategoryId);
  const currentSubCategories = currentCategory?.subcategories || [];

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const response = await API.categories.getCategories();
        if (response.success) {
          setCategories(response.data);
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
    return () => { document.removeEventListener('mousedown', handleClickOutside); };
  }, [isCategoryDropdownOpen, isSubCategoryDropdownOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = authUtils.getCurrentUser();
    const hasWechat = user && user.wechat_id && user.wechat_id.trim() !== '';

    if (!hasWechat) {
      Modal.confirm({
        title: '请先设置微信号',
        content: '发布帖子前需要先填写微信号，这样其他用户才能与您联系。是否现在前往个人资料页进行设置？',
        okText: '去设置',
        cancelText: '取消',
        onOk: () => { navigate('/profile'); },
        centered: true,
        className: 'modern-confirm-modal',
        styles: {
          body: { padding: '32px 32px 24px' },
          header: { padding: '0', marginBottom: '16px' },
          content: { borderRadius: '24px', overflow: 'hidden' },
          footer: { marginTop: '24px', padding: '0' },
        },
        okButtonProps: {
          style: {
            height: '44px', borderRadius: '22px',
            background: 'linear-gradient(135deg, #8ff5ff, #5bc8d4)',
            border: 'none', color: '#0e0e0f',
            fontSize: '14px', fontWeight: 600,
          },
        },
        cancelButtonProps: {
          style: {
            height: '44px', borderRadius: '22px',
            border: '1px solid rgba(255,255,255,0.08)',
            fontSize: '14px', fontWeight: 500,
            color: '#c4c4c8',
            backgroundColor: '#131314',
          },
        },
      });
      return;
    }

    if (!formData.content.trim()) { messageApi.error('请输入帖子内容'); return; }
    if (formData.content.length > 150) { messageApi.error('帖子内容最多150字'); return; }
    if (!formData.location?.trim()) { messageApi.error('请输入发布位置'); return; }
    if ((formData.location?.length ?? 0) > 200) { messageApi.error('发布位置最多200字'); return; }
    if (!formData.category_id) { messageApi.error('请选择主分类'); return; }
    if (currentSubCategories.length > 0 && !formData.subcategory_id) { messageApi.error('请选择细分类型'); return; }

    setIsLoading(true);
    try {
      const response = await API.posts.createPost(formData);
      if (response.success) {
        messageApi.success('帖子发布成功！');
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

  const dropdownListStyle: React.CSSProperties = {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    left: 0,
    right: 0,
    backgroundColor: '#1c1b1e',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '0.75rem',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
    zIndex: 20,
    overflow: 'hidden',
    padding: '0.375rem',
  };

  if (isLoadingCategories) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0e0e0f' }}>
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-4 rounded-full border-2 border-transparent animate-spin"
            style={{ borderTopColor: '#8ff5ff', borderRightColor: 'rgba(143,245,255,0.15)', borderBottomColor: 'rgba(143,245,255,0.15)', borderLeftColor: 'rgba(143,245,255,0.15)' }}
          />
          <p className="text-sm" style={{ color: '#6e6e73' }}>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {contextHolder}
      <div className="min-h-screen" style={{ backgroundColor: '#0e0e0f' }}>

        {/* Sub-header nav */}
        <div className="sticky top-16 z-10" style={{ backgroundColor: 'rgba(14,14,15,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center justify-between px-4 py-3.5 max-w-2xl mx-auto">
            <button onClick={() => navigate('/')}
              className="flex items-center gap-1.5 text-sm font-medium transition-colors"
              style={{ color: '#8e8e93' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#e0e0e3')}
              onMouseLeave={e => (e.currentTarget.style.color = '#8e8e93')}>
              <ChevronLeftIcon className="h-4 w-4" />
              返回
            </button>
            <h1 className="text-base font-bold" style={{ color: '#e0e0e3', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>发布帖子</h1>
            <div className="w-12" />
          </div>
        </div>

        {/* Form */}
        <div className="max-w-2xl mx-auto px-4 py-8">
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Content */}
            <div className="p-6" style={card}>
              <label htmlFor="content" className="block text-sm font-semibold mb-3"
                style={{ color: '#e0e0e3', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                帖子内容
              </label>
              <textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="找个小伙伴周末一起吃火锅～"
                rows={6}
                maxLength={150}
                className="resize-none"
                style={{ ...inputBase, borderRadius: '0.75rem' }}
                onFocus={e => Object.assign(e.currentTarget.style, { backgroundColor: '#201f21', border: '1px solid rgba(143,245,255,0.2)' })}
                onBlur={e => Object.assign(e.currentTarget.style, { backgroundColor: '#131314', border: '1px solid rgba(255,255,255,0.06)' })}
              />
              <style>{`textarea::placeholder, input::placeholder { color: #4e4e53; }`}</style>
              <div className="flex justify-end mt-2">
                <span className="text-xs" style={{ color: formData.content.length > 130 ? '#ffb347' : '#4e4e53' }}>
                  {formData.content.length}/150
                </span>
              </div>
            </div>

            {/* Location */}
            <div className="p-6" style={card}>
              <label htmlFor="location" className="block text-sm font-semibold mb-3"
                style={{ color: '#e0e0e3', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                当前位置
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <MapPinIcon className="h-4 w-4" style={{ color: '#6e6e73' }} />
                </div>
                <input
                  id="location"
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="北京市朝阳区"
                  maxLength={200}
                  style={{ ...inputBase, paddingLeft: '2.5rem' }}
                  onFocus={e => Object.assign(e.currentTarget.style, { backgroundColor: '#201f21', border: '1px solid rgba(143,245,255,0.2)' })}
                  onBlur={e => Object.assign(e.currentTarget.style, { backgroundColor: '#131314', border: '1px solid rgba(255,255,255,0.06)' })}
                />
              </div>
            </div>

            {/* Category */}
            <div className="p-6" style={card}>
              <label className="block text-sm font-semibold mb-3"
                style={{ color: '#e0e0e3', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                主分类
              </label>
              <div className="relative" ref={categoryDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                  className="w-full flex items-center justify-between px-5 py-3 rounded-xl text-sm transition-all"
                  style={{ backgroundColor: '#131314', color: '#c4c4c8', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span>{formData.category_id ? categories.find(cat => cat.id === formData.category_id)?.name || '请选择主分类' : '请选择主分类'}</span>
                  <ChevronDownIcon className="h-4 w-4 transition-transform duration-300" style={{ color: '#6e6e73', transform: isCategoryDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                </button>
                {isCategoryDropdownOpen && (
                  <div style={dropdownListStyle}>
                    <div className="max-h-52 overflow-y-auto">
                      {categories.map((category) => (
                        <button key={category.id} type="button"
                          onClick={() => {
                            setSelectedCategoryId(category.id);
                            const sel = categories.find(cat => cat.id === category.id);
                            setFormData(prev => ({
                              ...prev,
                              category_id: category.id,
                              subcategory_id: sel?.subcategories?.length ? sel.subcategories[0].id : 0
                            }));
                            setIsCategoryDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 text-sm rounded-lg flex items-center justify-between transition-colors"
                          style={{ color: '#c4c4c8' }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)')}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                          <span>{category.name}</span>
                          {formData.category_id === category.id && <CheckIcon className="h-4 w-4" style={{ color: '#8ff5ff' }} />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Subcategory */}
              {currentSubCategories.length > 0 && (
                <div className="mt-4">
                  <label className="block text-sm font-semibold mb-3"
                    style={{ color: '#e0e0e3', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    细分类型
                  </label>
                  <div className="relative" ref={subCategoryDropdownRef}>
                    <button type="button"
                      onClick={() => setIsSubCategoryDropdownOpen(!isSubCategoryDropdownOpen)}
                      className="w-full flex items-center justify-between px-5 py-3 rounded-xl text-sm transition-all"
                      style={{ backgroundColor: '#131314', color: '#c4c4c8', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <span>{formData.subcategory_id ? currentSubCategories.find(sub => sub.id === formData.subcategory_id)?.name || '请选择细分类型' : '请选择细分类型'}</span>
                      <ChevronDownIcon className="h-4 w-4 transition-transform duration-300" style={{ color: '#6e6e73', transform: isSubCategoryDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                    </button>
                    {isSubCategoryDropdownOpen && (
                      <div style={dropdownListStyle}>
                        <div className="max-h-52 overflow-y-auto">
                          {currentSubCategories.map((subCategory) => (
                            <button key={subCategory.id} type="button"
                              onClick={() => { setFormData(prev => ({ ...prev, subcategory_id: subCategory.id })); setIsSubCategoryDropdownOpen(false); }}
                              className="w-full text-left px-4 py-3 text-sm rounded-lg flex items-center justify-between transition-colors"
                              style={{ color: '#c4c4c8' }}
                              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)')}
                              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                              <span>{subCategory.name}</span>
                              {formData.subcategory_id === subCategory.id && <CheckIcon className="h-4 w-4" style={{ color: '#8ff5ff' }} />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #8ff5ff, #5bc8d4)', color: '#0e0e0f', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              <PencilIcon className="h-4 w-4" />
              {isLoading ? '发布中...' : '发布帖子'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default CreatePostPage;
