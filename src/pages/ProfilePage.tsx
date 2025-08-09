import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PencilIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
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

  // 格式化注册时间
  const formatJoinDate = (dateString?: string) => {
    if (!dateString) return '未知';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">加载中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">未找到用户信息</p>
          <button
            onClick={() => navigate('/login')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            重新登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">个人资料</h1>
          <p className="text-gray-600 mt-1">管理你的个人信息</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          {/* Avatar and Basic Info */}
          <div className="flex items-center space-x-6 mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-2xl">
                {user.nickname.charAt(0)}
              </span>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-semibold text-gray-900">{user.nickname}</h2>
                {user.role === 'admin' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    管理员
                  </span>
                )}
              </div>
              <p className="text-gray-600 mt-1">{user.email}</p>
              <p className="text-sm text-gray-500 mt-2">
                加入于 {formatJoinDate(user.created_at)}
              </p>
            </div>

            {!isEditing && (
              <button
                onClick={startEditing}
                className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                title="编辑资料"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Profile Details */}
          {isEditing ? (
            // 编辑表单
            <div className="space-y-4">
              <div>
                <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-2">
                  昵称 *
                </label>
                <input
                  id="nickname"
                  type="text"
                  value={editForm.nickname}
                  onChange={(e) => setEditForm(prev => ({ ...prev, nickname: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入昵称"
                  maxLength={20}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">2-20字符</p>
              </div>

              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                  性别
                </label>
                <select
                  id="gender"
                  value={editForm.gender}
                  onChange={(e) => setEditForm(prev => ({ ...prev, gender: e.target.value as 'male' | 'female' | 'other' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="male">男</option>
                  <option value="female">女</option>
                  <option value="other">其他</option>
                </select>
              </div>

              <div>
                <label htmlFor="signature" className="block text-sm font-medium text-gray-700 mb-2">
                  个人签名
                </label>
                <textarea
                  id="signature"
                  value={editForm.signature}
                  onChange={(e) => setEditForm(prev => ({ ...prev, signature: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="写点什么介绍一下自己吧..."
                  rows={3}
                  maxLength={200}
                />
                <p className="text-xs text-gray-500 mt-1">最多200字符</p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 pt-4">
                <button
                  onClick={saveProfile}
                  disabled={isUpdating}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <CheckIcon className="h-4 w-4" />
                  <span>{isUpdating ? '保存中...' : '保存'}</span>
                </button>
                
                <button
                  onClick={cancelEditing}
                  disabled={isUpdating}
                  className="flex items-center space-x-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  <XMarkIcon className="h-4 w-4" />
                  <span>取消</span>
                </button>
              </div>
            </div>
          ) : (
            // 显示资料
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">性别</label>
                  <p className="text-gray-900">
                    {user.gender === 'male' ? '男' : user.gender === 'female' ? '女' : '其他'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">角色</label>
                  <p className="text-gray-900">
                    {user.role === 'admin' ? '管理员' : '普通用户'}
                  </p>
                </div>
              </div>

              {user.signature && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">个人签名</label>
                  <p className="text-gray-900">{user.signature}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => navigate('/my-posts')}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:border-blue-200 transition-colors text-left"
          >
            <h3 className="font-semibold text-gray-900 mb-2">我的帖子</h3>
            <p className="text-sm text-gray-600">查看和管理我发布的帖子</p>
          </button>
          
          <button
            onClick={() => navigate('/notifications')}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:border-blue-200 transition-colors text-left"
          >
            <h3 className="font-semibold text-gray-900 mb-2">通知中心</h3>
            <p className="text-sm text-gray-600">查看评论和回复消息</p>
          </button>
        </div>

        {/* Admin Panel */}
        {user.role === 'admin' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">管理员功能</h3>
            <button
              onClick={() => navigate('/admin')}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              进入管理后台
            </button>
          </div>
        )}

        {/* Logout */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">账户操作</h3>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
          >
            退出登录
          </button>
        </div>
      </div>
    </div>
  );
} 