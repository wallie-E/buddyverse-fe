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

// Shared dark style tokens
const card = {
  backgroundColor: '#1c1b1e',
  borderRadius: '1.25rem',
  border: '1px solid rgba(255,255,255,0.05)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(143,245,255,0.04)',
} as const;

const inputBase = {
  backgroundColor: '#131314',
  color: '#e0e0e3',
  border: '1px solid rgba(255,255,255,0.06)',
  outline: 'none',
  transition: 'all 0.2s',
} as const;

const inputFocused = {
  backgroundColor: '#201f21',
  border: '1px solid rgba(143,245,255,0.2)',
} as const;

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
  const [isGenderDropdownOpen, setIsGenderDropdownOpen] = useState(false);
  const genderDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (genderDropdownRef.current && !genderDropdownRef.current.contains(event.target as Node)) {
        setIsGenderDropdownOpen(false);
      }
    };
    if (isGenderDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => { document.removeEventListener('mousedown', handleClickOutside); };
  }, [isGenderDropdownOpen]);

  useEffect(() => {
    if (!authUtils.isAuthenticated()) navigate('/login');
  }, [navigate]);

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

  useEffect(() => { fetchUserProfile(); }, []);

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

  const cancelEditing = () => { setIsEditing(false); setError(''); };

  const saveProfile = async () => {
    if (!editForm.nickname?.trim()) { setError('昵称不能为空'); return; }
    if ((editForm.nickname?.length ?? 0) < 2 || (editForm.nickname?.length ?? 0) > 8) {
      setError('昵称长度应在2-8字符之间');
      return;
    }
    try {
      setIsUpdating(true);
      setError('');
      const updateData: UpdateProfileRequest = {
        nickname: editForm.nickname?.trim(),
        gender: editForm.gender,
        signature: editForm.signature?.trim() || undefined,
        wechat_id: editForm.wechat_id?.trim() || undefined
      };
      const response = await API.users.updateProfile(updateData);
      if (response.success) {
        setUser(response.data);
        setIsEditing(false);
        authUtils.saveAuth(authUtils.getToken()!, response.data);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : '更新失败，请重试');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0e0e0f' }}>
        <div className="text-center">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"
            style={{ background: 'linear-gradient(135deg, rgba(143,245,255,0.1), rgba(213,117,255,0.1))' }}>
            <span className="text-4xl">😞</span>
          </div>
          <h3 className="text-xl font-bold mb-2" style={{ color: '#e0e0e3', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>未找到用户信息</h3>
          <p className="mb-6 text-sm" style={{ color: '#6e6e73' }}>请重新登录</p>
          <button onClick={() => navigate('/login')}
            className="px-6 py-2.5 rounded-full text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #8ff5ff, #5bc8d4)', color: '#0e0e0f' }}>
            重新登录
          </button>
        </div>
      </div>
    );
  }

  const inputStyle = (focused = false) => ({
    ...inputBase,
    ...(focused ? inputFocused : {}),
    width: '100%',
    padding: '0.75rem 1.25rem',
    borderRadius: '0.75rem',
    fontSize: '0.9375rem',
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0e0e0f' }}>
      <div className="max-w-4xl mx-auto px-4 py-12">

        {/* Page title */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '-0.02em' }}>
            个人资料
          </h1>
        </div>

        {/* Error */}
        {error && (
          <div className="px-5 py-4 rounded-2xl mb-6 flex items-center gap-3 text-sm"
            style={{ backgroundColor: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.15)', color: '#ff6b6b' }}>
            <span className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 text-white text-xs">!</span>
            <span>{error}</span>
          </div>
        )}

        {/* Profile Card */}
        <div className="p-7 mb-6" style={card}>
          {/* Avatar + name row */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 mb-7">
            <div className="w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-3xl"
              style={{ background: 'linear-gradient(135deg, rgba(143,245,255,0.3), rgba(213,117,255,0.3))', color: '#8ff5ff', border: '2px solid rgba(143,245,255,0.15)' }}>
              {user.nickname.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                <h2 className="text-xl font-bold" style={{ color: '#e0e0e3', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {user.nickname}
                </h2>
                {user.role === 'admin' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold self-center sm:self-auto"
                    style={{ backgroundColor: 'rgba(213,117,255,0.12)', color: '#d575ff', border: '1px solid rgba(213,117,255,0.2)' }}>
                    👑 管理员
                  </span>
                )}
              </div>
              <p className="text-sm" style={{ color: '#6e6e73' }}>{user.email}</p>
            </div>
            {!isEditing && (
              <button onClick={startEditing}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
                style={{ backgroundColor: '#131314', color: '#c4c4c8', border: '1px solid rgba(255,255,255,0.08)' }}>
                <PencilSquareIcon className="h-4 w-4" />
                编辑资料
              </button>
            )}
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
            {isEditing ? (
              <div className="space-y-5">
                {/* Nickname */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#8e8e93' }}>昵称 <span style={{ color: '#ff6b6b' }}>*</span></label>
                  <input type="text" value={editForm.nickname} maxLength={8}
                    onChange={e => setEditForm(p => ({ ...p, nickname: e.target.value }))}
                    placeholder="请输入昵称"
                    style={inputStyle()}
                    onFocus={e => Object.assign(e.currentTarget.style, inputFocused)}
                    onBlur={e => Object.assign(e.currentTarget.style, { backgroundColor: '#131314', border: '1px solid rgba(255,255,255,0.06)' })}
                  />
                  <div className="flex justify-between mt-1.5">
                    <span className="text-xs" style={{ color: '#6e6e73' }}>2-8字符</span>
                    <span className="text-xs" style={{ color: '#6e6e73' }}>{editForm.nickname?.length || 0}/8</span>
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#8e8e93' }}>性别</label>
                  <div className="relative" ref={genderDropdownRef}>
                    <button type="button" onClick={() => setIsGenderDropdownOpen(!isGenderDropdownOpen)}
                      className="w-full flex items-center justify-between px-5 py-3 rounded-xl transition-all text-sm"
                      style={{ backgroundColor: '#131314', color: '#c4c4c8', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <span>{editForm.gender === 'male' ? '男' : '女'}</span>
                      <ChevronDownIcon className="h-4 w-4 transition-transform duration-300"
                        style={{ color: '#6e6e73', transform: isGenderDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                    </button>
                    {isGenderDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden z-20 p-1.5"
                        style={{ backgroundColor: '#1c1b1e', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
                        {(['male', 'female'] as const).map(g => (
                          <button key={g} type="button"
                            onClick={() => { setEditForm(p => ({ ...p, gender: g })); setIsGenderDropdownOpen(false); }}
                            className="w-full text-left px-4 py-3 text-sm rounded-lg flex items-center justify-between transition-colors"
                            style={{ color: '#c4c4c8' }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                            <span>{g === 'male' ? '男' : '女'}</span>
                            {editForm.gender === g && <CheckIcon className="h-4 w-4" style={{ color: '#8ff5ff' }} />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Signature */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#8e8e93' }}>个性签名</label>
                  <textarea value={editForm.signature} rows={3} maxLength={200}
                    onChange={e => setEditForm(p => ({ ...p, signature: e.target.value }))}
                    placeholder="写点什么介绍一下自己吧..."
                    className="w-full resize-none"
                    style={{ ...inputStyle(), borderRadius: '0.75rem' }}
                    onFocus={e => Object.assign(e.currentTarget.style, inputFocused)}
                    onBlur={e => Object.assign(e.currentTarget.style, { backgroundColor: '#131314', border: '1px solid rgba(255,255,255,0.06)' })}
                  />
                  <div className="flex justify-between mt-1.5">
                    <span className="text-xs" style={{ color: '#6e6e73' }}>最多200字符</span>
                    <span className="text-xs" style={{ color: '#6e6e73' }}>{editForm.signature?.length || 0}/200</span>
                  </div>
                </div>

                {/* WeChat */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#8e8e93' }}>微信号</label>
                  <input type="text" value={editForm.wechat_id}
                    onChange={e => setEditForm(p => ({ ...p, wechat_id: e.target.value }))}
                    placeholder="请输入微信号"
                    style={inputStyle()}
                    onFocus={e => Object.assign(e.currentTarget.style, inputFocused)}
                    onBlur={e => Object.assign(e.currentTarget.style, { backgroundColor: '#131314', border: '1px solid rgba(255,255,255,0.06)' })}
                  />
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button onClick={saveProfile} disabled={isUpdating}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #8ff5ff, #5bc8d4)', color: '#0e0e0f' }}>
                    <CheckIcon className="h-4 w-4" />
                    {isUpdating ? '保存中...' : '保存'}
                  </button>
                  <button onClick={cancelEditing} disabled={isUpdating}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition-all active:scale-95 disabled:opacity-50"
                    style={{ backgroundColor: '#131314', color: '#c4c4c8', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <XMarkIcon className="h-4 w-4" />
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl" style={{ backgroundColor: '#131314', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <label className="block text-xs font-medium mb-2" style={{ color: '#6e6e73' }}>性别</label>
                  <p className="text-base font-semibold" style={{ color: '#e0e0e3' }}>
                    {user.gender === 'male' ? '👨 男' : '👩 女'}
                  </p>
                </div>
                <div className="p-5 rounded-xl" style={{ backgroundColor: '#131314', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <label className="block text-xs font-medium mb-2" style={{ color: '#6e6e73' }}>微信号</label>
                  <p className="text-base font-semibold truncate" style={{ color: user.wechat_id ? '#8ff5ff' : '#4e4e53' }}>
                    {user.wechat_id || '未设置'}
                  </p>
                </div>
                <div className="p-5 rounded-xl sm:col-span-2" style={{ backgroundColor: '#131314', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <label className="block text-xs font-medium mb-2" style={{ color: '#6e6e73' }}>个性签名</label>
                  <p className="text-sm leading-relaxed" style={{ color: user.signature ? '#c4c4c8' : '#4e4e53' }}>
                    {user.signature || '未设置'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* My Posts shortcut */}
        <button onClick={() => navigate('/my-posts')}
          className="w-full text-left p-6 mb-6 group transition-all duration-200"
          style={{
            ...card,
            display: 'block',
          }}
          onMouseEnter={e => Object.assign((e.currentTarget as HTMLElement).style, { border: '1px solid rgba(143,245,255,0.12)', boxShadow: '0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(143,245,255,0.06)' })}
          onMouseLeave={e => Object.assign((e.currentTarget as HTMLElement).style, { border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(143,245,255,0.04)' })}
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, rgba(143,245,255,0.12), rgba(213,117,255,0.12))', border: '1px solid rgba(143,245,255,0.1)' }}>
              📝
            </div>
            <div>
              <h3 className="font-bold text-base" style={{ color: '#e0e0e3', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>我的帖子</h3>
              <p className="text-xs mt-0.5" style={{ color: '#6e6e73' }}>查看和管理我发布的帖子</p>
            </div>
            <div className="ml-auto" style={{ color: '#4e4e53' }}>›</div>
          </div>
        </button>

        {/* Admin Panel */}
        {user.role === 'admin' && (
          <div className="p-6" style={card}>
            <div className="flex items-center gap-4 mb-5">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl"
                style={{ background: 'linear-gradient(135deg, rgba(213,117,255,0.15), rgba(143,245,255,0.1))', border: '1px solid rgba(213,117,255,0.15)' }}>
                👑
              </div>
              <h3 className="font-bold text-base" style={{ color: '#e0e0e3', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>管理员功能</h3>
            </div>
            <button onClick={() => navigate('/admin')}
              className="px-6 py-2.5 rounded-full text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #d575ff, #a855f7)', color: '#fff' }}>
              进入管理后台
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
