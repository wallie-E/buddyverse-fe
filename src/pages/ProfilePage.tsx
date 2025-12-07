import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
  ChevronDownIcon
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
    gender: 'male',
    signature: '',
    wechat_id: ''
  });

  // 性别下拉菜单状态
  const [isGenderDropdownOpen, setIsGenderDropdownOpen] = useState(false);
  const genderDropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (genderDropdownRef.current && !genderDropdownRef.current.contains(event.target as Node)) {
        setIsGenderDropdownOpen(false);
      }
    };

    if (isGenderDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isGenderDropdownOpen]);

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
          signature: response.data.signature || '',
          wechat_id: response.data.wechat_id || ''
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
        signature: user.signature || '',
        wechat_id: user.wechat_id || ''
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

    if (editForm.nickname.length < 2 || editForm.nickname.length > 8) {
      setError('昵称长度应在2-8字符之间');
      return;
    }

    try {
      setIsUpdating(true);
      setError('');

      const updateData: UpdateProfileRequest = {
        nickname: editForm.nickname.trim(),
        gender: editForm.gender,
        signature: editForm.signature?.trim() || undefined,
        wechat_id: editForm.wechat_id?.trim() || undefined
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-200 border-t-slate-600 mx-auto mb-6"></div>
          <p className="text-slate-600 text-lg font-medium font-sans">加载中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 rounded-[2rem] bg-slate-100 flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">😞</span>
          </div>
          <h3 className="text-2xl font-medium text-slate-800 mb-3 font-sans">未找到用户信息</h3>
          <p className="text-slate-500 mb-8 text-lg font-normal font-sans leading-relaxed">请重新登录</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-slate-900 text-white px-8 py-3 rounded-full hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] hover:scale-[1.02] transition-all duration-300 font-medium font-sans"
          >
            重新登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-medium text-slate-800 mb-2 tracking-tight font-sans">个人资料</h1>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50/80 backdrop-blur-sm border-0 ring-1 ring-red-100 text-red-600/90 px-6 py-4 rounded-[2rem] mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-sans">!</span>
              </div>
              <span className="font-medium text-base break-words font-sans">{error}</span>
            </div>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white border border-slate-100 rounded-[2rem] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.04)] p-8 mb-8">
          {/* Avatar and Basic Info */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-8 mb-8">
            {/* Avatar */}
            <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.08)] flex-shrink-0">
              <span className="text-white font-medium text-3xl font-sans">
                {user.nickname.charAt(0).toUpperCase()}
              </span>
            </div>

            {/* User Info */}
            <div className="flex-1 w-full sm:w-auto text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <h2 className="text-2xl font-medium text-slate-900 truncate font-sans" title={user.nickname}>
                  {user.nickname}
                </h2>
                {user.role === 'admin' && (
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-slate-50 text-slate-700 ring-1 ring-slate-100 self-center sm:self-auto font-sans">
                    👑 管理员
                  </span>
                )}
              </div>
              <p className="text-slate-500 mt-2 text-lg truncate font-normal font-sans leading-relaxed" title={user.email}>
                {user.email}
              </p>
            </div>

            {/* Edit Button */}
            {!isEditing && (
              <button
                onClick={startEditing}
                className="bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-full font-medium hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] hover:scale-[1.02] hover:border-slate-300 transition-all duration-300 flex items-center space-x-2 font-sans"
              >
                <PencilSquareIcon className="h-4 w-4" />
                <span>编辑资料</span>
              </button>
            )}
          </div>

          {/* Profile Details */}
          {isEditing ? (
            // 编辑表单
            <div className="space-y-6">
              <div>
                <label htmlFor="nickname" className="block text-lg font-medium text-slate-900 mb-3 font-sans">
                  昵称 *
                </label>
                <div className="relative">
                  <input
                    id="nickname"
                    type="text"
                    value={editForm.nickname}
                    onChange={(e) => setEditForm(prev => ({ ...prev, nickname: e.target.value }))}
                    className="w-full px-6 py-4 h-12 text-lg rounded-full border-0 ring-1 ring-slate-100 bg-white focus:ring-1 focus:ring-slate-100 focus:bg-white focus:outline-none transition-all duration-200 caret-slate-600 font-sans"
                    placeholder="请输入昵称"
                    maxLength={8}
                  />
                  <div className="text-right mt-2 text-sm text-slate-400 font-sans">
                    {editForm.nickname?.length || 0}/8
                  </div>
                </div>
                <p className="text-sm text-slate-500 mt-2 font-normal font-sans">2-8字符</p>
              </div>

              <div>
                <label htmlFor="gender" className="block text-lg font-medium text-slate-900 mb-3 font-sans">
                  性别
                </label>
                <div className="relative" ref={genderDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsGenderDropdownOpen(!isGenderDropdownOpen)}
                    className="w-full flex items-center justify-between px-6 py-4 h-12 rounded-full border-0 ring-1 ring-slate-100 bg-white focus:ring-1 focus:ring-slate-100 focus:bg-white focus:outline-none transition-all duration-200 text-lg text-slate-600 font-sans text-left"
                  >
                    <span>
                      {editForm.gender === 'male' ? '男' : '女'}
                    </span>
                    <ChevronDownIcon className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${isGenderDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isGenderDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border-0 ring-1 ring-slate-100 rounded-[1.5rem] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] z-20 overflow-hidden">
                      <div className="p-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditForm(prev => ({ ...prev, gender: 'male' }));
                            setIsGenderDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 rounded-xl flex items-center justify-between transition-colors text-slate-600 font-sans"
                        >
                          <span>男</span>
                          {editForm.gender === 'male' && (
                            <CheckIcon className="h-4 w-4 text-slate-800" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditForm(prev => ({ ...prev, gender: 'female' }));
                            setIsGenderDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 rounded-xl flex items-center justify-between transition-colors text-slate-600 font-sans"
                        >
                          <span>女</span>
                          {editForm.gender === 'female' && (
                            <CheckIcon className="h-4 w-4 text-slate-800" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="signature" className="block text-lg font-medium text-slate-900 mb-3 font-sans">
                  个人签名
                </label>
                <div className="relative">
                  <textarea
                    id="signature"
                    value={editForm.signature}
                    onChange={(e) => setEditForm(prev => ({ ...prev, signature: e.target.value }))}
                    className="w-full px-6 py-4 text-lg rounded-2xl border-0 ring-1 ring-slate-100 bg-white focus:ring-1 focus:ring-slate-100 focus:bg-white focus:outline-none transition-all duration-200 caret-slate-600 font-sans resize-none"
                    placeholder="写点什么介绍一下自己吧..."
                    rows={3}
                    maxLength={200}
                  />
                  <div className="text-right mt-2 text-sm text-slate-400 font-sans">
                    {editForm.signature?.length || 0}/200
                  </div>
                </div>
                <p className="text-sm text-slate-500 mt-2 font-normal font-sans">最多200字符</p>
              </div>

              <div>
                <label htmlFor="wechat_id" className="block text-lg font-medium text-slate-900 mb-3 font-sans">
                  微信号
                </label>
                <input
                  id="wechat_id"
                  type="text"
                  value={editForm.wechat_id}
                  onChange={(e) => setEditForm(prev => ({ ...prev, wechat_id: e.target.value }))}
                  className="w-full px-6 py-4 h-12 text-lg rounded-full border-0 ring-1 ring-slate-100 bg-white focus:ring-1 focus:ring-slate-100 focus:bg-white focus:outline-none transition-all duration-200 caret-slate-600 font-sans"
                  placeholder="请输入微信号"
                />
                <p className="text-sm text-slate-500 mt-2 font-normal font-sans leading-relaxed">
                  微信号只有在你和别人交换时，才会告知对方
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 pt-6">
                <button
                  onClick={saveProfile}
                  disabled={isUpdating}
                  className="flex items-center justify-center space-x-2 bg-slate-900 text-white px-8 py-3 rounded-full hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 font-medium font-sans"
                >
                  <CheckIcon className="h-5 w-5" />
                  <span className="text-base">{isUpdating ? '保存中...' : '保存'}</span>
                </button>

                <button
                  onClick={cancelEditing}
                  disabled={isUpdating}
                  className="flex items-center justify-center space-x-2 bg-white border border-slate-200 text-slate-700 px-8 py-3 rounded-full hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] hover:scale-[1.02] hover:border-slate-300 transition-all duration-300 disabled:opacity-50 font-medium font-sans"
                >
                  <XMarkIcon className="h-5 w-5" />
                  <span className="text-base">取消</span>
                </button>
              </div>
            </div>
          ) : (
            // 显示资料
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-white rounded-[2rem] p-6 border border-slate-100">
                  <label className="block text-sm font-medium text-slate-600 mb-3 font-sans">性别</label>
                  <p className="text-xl font-medium text-slate-900 font-sans leading-relaxed">
                    {user.gender === 'male' ? '👨 男' : '👩 女'}
                  </p>
                </div>

                <div className="bg-white rounded-[2rem] p-6 border border-slate-100">
                  <label className="block text-sm font-medium text-slate-600 mb-3 font-sans">个性签名</label>
                  <p className="text-xl font-medium text-slate-900 font-sans leading-relaxed">
                    {user.signature || '未设置'}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] p-6 border border-slate-100">
                <label className="block text-sm font-medium text-slate-600 mb-3 font-sans">微信号</label>
                <p className="text-xl font-medium text-slate-900 mb-2 font-sans leading-relaxed">
                  {user.wechat_id || '未设置'}
                </p>
                <p className="text-sm text-slate-500 font-normal font-sans leading-relaxed">
                  微信号只有在你和别人交换时，才会告知对方
                </p>
              </div>

              {user.signature && (
                <div className="bg-white rounded-[2rem] p-6 border border-slate-100">
                  <label className="block text-sm font-medium text-slate-600 mb-3 font-sans">个性签名</label>
                  <p className="text-lg text-slate-900 leading-loose break-words font-normal font-sans">{user.signature}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <button
            onClick={() => navigate('/my-posts')}
            className="bg-white border border-slate-100 p-8 rounded-[2rem] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 text-left group"
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">📝</span>
              </div>
              <h3 className="text-xl font-medium text-slate-900 group-hover:text-slate-700 transition-colors truncate font-sans">我的帖子</h3>
            </div>
            <p className="text-base text-slate-500 font-normal font-sans leading-relaxed">查看和管理我发布的帖子</p>
          </button>

          <button
            onClick={() => navigate('/notifications')}
            className="bg-white border border-slate-100 p-8 rounded-[2rem] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 text-left group"
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🔔</span>
              </div>
              <h3 className="text-xl font-medium text-slate-900 group-hover:text-slate-700 transition-colors truncate font-sans">消息中心</h3>
            </div>
            <p className="text-base text-slate-500 font-normal font-sans leading-relaxed">查看评论和回复消息</p>
          </button>
        </div>

        {/* Admin Panel */}
        {user.role === 'admin' && (
          <div className="bg-white border border-slate-100 rounded-[2rem] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.04)] p-8 mb-8">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">👑</span>
              </div>
              <h3 className="text-2xl font-medium text-slate-900 font-sans">管理员功能</h3>
            </div>
            <button
              onClick={() => navigate('/admin')}
              className="w-full sm:w-auto bg-slate-900 text-white px-8 py-4 rounded-full hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] hover:scale-[1.02] transition-all duration-300 font-medium font-sans text-base"
            >
              进入管理后台
            </button>
          </div>
        )}

        {/* Logout */}
        <div className="bg-white border border-slate-100 rounded-[2rem] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.04)] p-8">
          <div className="flex items-center space-x-4 mb-6">
            <h3 className="text-2xl font-medium text-slate-900 font-sans">账户操作</h3>
          </div>
          <button
            onClick={handleLogout}
            className="w-full sm:w-auto bg-white border border-red-200 text-red-600 px-8 py-4 rounded-full hover:shadow-[0_8px_20px_rgba(220,38,38,0.12)] hover:scale-[1.02] hover:border-red-300 transition-all duration-300 font-medium font-sans text-base"
          >
            退出登录
          </button>
        </div>
      </div>
    </div>
  );
} 