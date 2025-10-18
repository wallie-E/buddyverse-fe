import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PencilIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Select, Input } from 'antd';
import { API, authUtils } from '../api';
import type { User, UpdateProfileRequest } from '../api/types';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editForm, setEditForm] = useState<UpdateProfileRequest>({
    nickname: '',
    gender: 'other',
    signature: ''
  });

  // 检查登录状态
  useEffect(() => {
    if (!authUtils.isAuthenticated()) {
      navigate('/login');
      return;
    }
  }, [navigate]);

  // 获取用户信息
  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await API.auth.getProfile();
      if (response.success) {
        setUser(response.data);
        setEditForm({
          nickname: response.data.nickname,
          gender: response.data.gender,
          signature: response.data.signature || ''
        });
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      setError('获取用户信息失败，请刷新重试');
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    fetchUserProfile();
  }, []);

  // 开始编辑
  const startEditing = () => {
    if (user) {
      setEditForm({
        nickname: user.nickname,
        gender: user.gender,
        signature: user.signature || ''
      });
      setIsEditing(true);
    }
  };

  // 取消编辑
  const cancelEditing = () => {
    setIsEditing(false);
    setError('');
  };

  // 保存修改
  const saveProfile = async () => {
    if (!editForm.nickname || !editForm.nickname.trim()) {
      setError('昵称不能为空');
      return;
    }

    if (editForm.nickname.length < 2 || editForm.nickname.length > 20) {
      setError('昵称长度应在2-20字符之间');
      return;
    }

    try {
      setIsUpdating(true);
      setError('');

      const updateData: UpdateProfileRequest = {
        nickname: editForm.nickname.trim(),
        gender: editForm.gender,
        signature: editForm.signature?.trim() || undefined
      };

      const response = await API.users.updateProfile(updateData);
      
      if (response.success) {
        setUser(response.data);
        setIsEditing(false);
        
        // 更新本地存储的用户信息
        authUtils.saveAuth(authUtils.getToken()!, response.data);
      }
    } catch (error) {
      console.error('更新用户信息失败:', error);
      setError(error instanceof Error ? error.message : '更新失败，请重试');
    } finally {
      setIsUpdating(false);
    }
  };

  // 退出登录
  const handleLogout = () => {
    if (confirm('确定要退出登录吗？')) {
      authUtils.logout();
      navigate('/login');
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg font-medium">加载中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-r from-red-200 to-pink-200 flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">😞</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-3">未找到用户信息</h3>
          <p className="text-gray-600 mb-8 text-lg">请重新登录</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
          >
            重新登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">个人资料</h1>
          <p className="text-gray-600">管理你的个人信息和账户设置</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-600 px-6 py-4 rounded-2xl mb-6 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">!</span>
              </div>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
          {/* Avatar and Basic Info */}
          <div className="flex items-center space-x-8 mb-8">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-3xl">
                {user.nickname.charAt(0)}
              </span>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-4">
                <h2 className="text-2xl font-bold text-gray-900">{user.nickname}</h2>
                {user.role === 'admin' && (
                  <span className="inline-flex items-center px-4 py-2 rounded-2xl text-sm font-medium bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border border-purple-200">
                    👑 管理员
                  </span>
                )}
              </div>
              <p className="text-gray-600 mt-2 text-lg">{user.email}</p>
            </div>

            {!isEditing && (
              <button
                onClick={startEditing}
                className="p-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all duration-300"
                title="编辑资料"
              >
                <PencilIcon className="h-6 w-6" />
              </button>
            )}
          </div>

          {/* Profile Details */}
          {isEditing ? (
            // 编辑表单
            <div className="space-y-6">
              <div>
                <label htmlFor="nickname" className="block text-lg font-semibold text-gray-900 mb-3">
                  昵称 *
                </label>
                <Input
                  id="nickname"
                  value={editForm.nickname}
                  onChange={(e) => setEditForm(prev => ({ ...prev, nickname: e.target.value }))}
                  className="w-full h-12 text-lg"
                  size="large"
                  placeholder="请输入昵称"
                  maxLength={20}
                  showCount
                />
                <p className="text-sm text-gray-500 mt-2">2-20字符</p>
              </div>

              <div>
                <label htmlFor="gender" className="block text-lg font-semibold text-gray-900 mb-3">
                  性别
                </label>
                <Select
                  id="gender"
                  value={editForm.gender}
                  onChange={(value) => setEditForm(prev => ({ ...prev, gender: value as 'male' | 'female' }))}
                  className="w-full h-12"
                  size="large"
                  options={[
                    { value: 'male', label: '男' },
                    { value: 'female', label: '女' },
                  ]}
                />
              </div>

              <div>
                <label htmlFor="signature" className="block text-lg font-semibold text-gray-900 mb-3">
                  个人签名
                </label>
                <Input.TextArea
                  id="signature"
                  value={editForm.signature}
                  onChange={(e) => setEditForm(prev => ({ ...prev, signature: e.target.value }))}
                  className="w-full text-lg"
                  size="large"
                  placeholder="写点什么介绍一下自己吧..."
                  rows={4}
                  maxLength={200}
                  showCount
                />
                <p className="text-sm text-gray-500 mt-2">最多200字符</p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-4 pt-6">
                <button
                  onClick={saveProfile}
                  disabled={isUpdating}
                  className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 font-medium shadow-lg hover:shadow-xl"
                >
                  <CheckIcon className="h-5 w-5" />
                  <span>{isUpdating ? '保存中...' : '保存'}</span>
                </button>
                
                <button
                  onClick={cancelEditing}
                  disabled={isUpdating}
                  className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-8 py-3 rounded-2xl hover:bg-gray-200 transition-all duration-300 disabled:opacity-50 font-medium"
                >
                  <XMarkIcon className="h-5 w-5" />
                  <span>取消</span>
                </button>
              </div>
            </div>
          ) : (
            // 显示资料
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-2xl p-6">
                  <label className="block text-sm font-semibold text-gray-600 mb-2">性别</label>
                  <p className="text-xl font-medium text-gray-900">
                    {user.gender === 'male' ? '👨 男' : user.gender === 'female' ? '👩 女' : '🤖 其他'}
                  </p>
                </div>
                
                <div className="bg-gray-50 rounded-2xl p-6">
                  <label className="block text-sm font-semibold text-gray-600 mb-2">角色</label>
                  <p className="text-xl font-medium text-gray-900">
                    {user.role === 'admin' ? '👑 管理员' : '👤 普通用户'}
                  </p>
                </div>
              </div>

              {user.signature && (
                <div className="bg-gray-50 rounded-2xl p-6">
                  <label className="block text-sm font-semibold text-gray-600 mb-3">个人签名</label>
                  <p className="text-lg text-gray-900 leading-relaxed">{user.signature}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={() => navigate('/my-posts')}
            className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 text-left group"
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <span className="text-2xl">📝</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">我的帖子</h3>
            </div>
            <p className="text-gray-600">查看和管理我发布的帖子</p>
          </button>
          
          <button
            onClick={() => navigate('/notifications')}
            className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 text-left group"
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl flex items-center justify-center">
                <span className="text-2xl">🔔</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">通知中心</h3>
            </div>
            <p className="text-gray-600">查看评论和回复消息</p>
          </button>
        </div>

        {/* Admin Panel */}
        {user.role === 'admin' && (
          <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center">
                <span className="text-2xl">👑</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">管理员功能</h3>
            </div>
            <button
              onClick={() => navigate('/admin')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
            >
              进入管理后台
            </button>
          </div>
        )}

        {/* Logout */}
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="flex items-center space-x-4 mb-6">
            <h3 className="text-2xl font-bold text-gray-900">账户操作</h3>
          </div>
          <button
            onClick={handleLogout}
            className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-8 py-4 rounded-2xl hover:from-red-700 hover:to-pink-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
          >
            退出登录
          </button>
        </div>
      </div>
    </div>
  );
} 