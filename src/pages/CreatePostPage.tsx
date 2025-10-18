import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeftIcon, MapPinIcon, EyeIcon, EyeSlashIcon, PencilIcon } from '@heroicons/react/24/outline';
import { Form, Input, Select, Radio, Button, message } from 'antd';
import { API } from '../api';
import type { Category, CreatePostRequest } from '../api/types';

const CreatePostPage = () => {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();
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


  const handleSubmit = async (values: CreatePostRequest) => {
    setIsLoading(true);

    try {
      const response = await API.posts.createPost(values);
      
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-r from-slate-200 to-slate-300 flex items-center justify-center mx-auto mb-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          <p className="text-slate-600 text-lg font-medium">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {contextHolder}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/50 sticky top-0 z-10">
          <div className="flex items-center justify-between px-4 py-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ChevronLeftIcon className="h-5 w-5 mr-1" />
              返回
            </button>
            <h1 className="text-lg font-semibold text-slate-900">发布帖子</h1>
            <div className="w-12"></div> {/* 占位符保持居中 */}
          </div>
        </div>

        {/* Form */}
        <div className="max-w-2xl mx-auto p-6">
          <Form
            form={form}
            onFinish={handleSubmit}
            initialValues={formData}
            layout="vertical"
            className="space-y-6"
          >
           

          {/* 帖子内容 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200/50">
            <Form.Item
              name="content"
              label={<span className="text-slate-700 font-medium text-base">帖子内容</span>}
              rules={[
                { required: true, message: '请输入帖子内容' },
                { max: 150, message: '最多150字' }
              ]}
            >
              <Input.TextArea
                placeholder="分享你的想法，寻找志同道合的搭子..."
                rows={6}
                maxLength={150}
                showCount
                className="rounded-xl border-slate-200 focus:border-blue-500 focus:shadow-sm"
                style={{ resize: 'none' }}
              />
            </Form.Item>
          </div>

          {/* 发布位置 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200/50">
            <Form.Item
              name="location"
              label={<span className="text-slate-700 font-medium text-base">发布位置</span>}
              rules={[
                { required: true, message: '请输入发布位置' },
                { max: 200, message: '最多200字' }
              ]}
            >
              <Input
                placeholder="输入你的位置，如：北京市朝阳区"
                maxLength={200}
                prefix={<MapPinIcon className="h-4 w-4 text-slate-400" />}
                className="rounded-xl border-slate-200 focus:border-blue-500 focus:shadow-sm"
              />
            </Form.Item>
          </div>

          {/* 分类选择 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200/50">
            <Form.Item
              name="category_id"
              label={<span className="text-slate-700 font-medium text-base">主分类</span>}
              rules={[{ required: true, message: '请选择主分类' }]}
            >
              <Select
                placeholder="请选择主分类"
                className="rounded-xl"
                onChange={(value) => {
                  setSelectedCategoryId(value);
                  const selectedCategory = categories.find(cat => cat.id === value);
                  if (selectedCategory?.subcategories && selectedCategory.subcategories.length > 0) {
                    form.setFieldsValue({ subcategory_id: selectedCategory.subcategories[0].id });
                  } else {
                    form.setFieldsValue({ subcategory_id: 0 });
                  }
                }}
              >
                {categories.map((category) => (
                  <Select.Option key={category.id} value={category.id}>
                    {category.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            {/* 细分类型 */}
            {currentSubCategories.length > 0 && (
              <Form.Item
                name="subcategory_id"
                label={<span className="text-slate-700 font-medium text-base">细分类型</span>}
                rules={[{ required: true, message: '请选择细分类型' }]}
              >
                <Select placeholder="请选择细分类型" className="rounded-xl">
                  {currentSubCategories.map((subCategory) => (
                    <Select.Option key={subCategory.id} value={subCategory.id}>
                      {subCategory.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            )}
          </div>

          {/* 评论可见性设置 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200/50">
            <Form.Item
              name="comment_visibility"
              label={<span className="text-slate-700 font-medium text-base">评论设置</span>}
              rules={[{ required: true, message: '请选择评论可见性' }]}
            >
              <Radio.Group>
                <div className="space-y-4">
                  <Radio value="public" className="w-full">
                    <span className="flex items-center text-slate-700">
                      <EyeIcon className="h-5 w-5 mr-3 text-green-500" />
                      <div>
                        <div className="font-medium">公开评论</div>
                        <div className="text-sm text-slate-500">所有人都可以看到评论</div>
                      </div>
                    </span>
                  </Radio>
                  <Radio value="private" className="w-full">
                    <span className="flex items-center text-slate-700">
                      <EyeSlashIcon className="h-5 w-5 mr-3 text-orange-500" />
                      <div>
                        <div className="font-medium">仅我可见</div>
                        <div className="text-sm text-slate-500">只有你能看到别人的评论</div>
                      </div>
                    </span>
                  </Radio>
                </div>
              </Radio.Group>
            </Form.Item>
          </div>

          {/* 提交按钮 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200/50">
            <Form.Item>
              <Button
                htmlType="submit"
                loading={isLoading}
                size="large"
                className="w-full h-12 !bg-gradient-to-r !from-blue-500 !to-purple-600 hover:!from-blue-600 hover:!to-purple-700 !text-white !rounded-lg !font-medium !transition-all !duration-200 !flex !items-center !justify-center !space-x-2 !border-0"
                style={{
                  background: 'linear-gradient(to right, #3b82f6, #9333ea)',
                  border: 'none',
                  color: 'white'
                }}
              >
                <PencilIcon className="h-4 w-4" />
                <span>{isLoading ? '发布中...' : '发布帖子'}</span>
              </Button>
            </Form.Item>
          </div>
          </Form>
        </div>
      </div>
    </>
  );
};

export default CreatePostPage; 