import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { API, authUtils } from '../api';
import type { LoginRequest, RegisterRequest } from '../api/types';

const inputBase: React.CSSProperties = {
  backgroundColor: '#131314',
  color: '#e0e0e3',
  border: '1px solid rgba(255,255,255,0.06)',
  outline: 'none',
  transition: 'all 0.2s',
  width: '100%',
  padding: '0.875rem 1.25rem',
  borderRadius: '0.75rem',
  fontSize: '1rem',
};

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isRegisterPage = location.pathname === '/register';

  const [formData, setFormData] = useState<LoginRequest>({ email: '', password: '' });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      if (isRegisterPage) {
        if (formData.password !== confirmPassword) {
          setError('密码和确认密码不一致');
          setIsLoading(false);
          return;
        }
        if (!nickname.trim()) {
          setError('请输入昵称');
          setIsLoading(false);
          return;
        }
        if (!gender || (gender !== 'male' && gender !== 'female')) {
          setError('请选择性别');
          setIsLoading(false);
          return;
        }
        const registerData: RegisterRequest = {
          email: formData.email,
          password: formData.password,
          nickname: nickname.trim(),
          gender,
        };
        const response = await API.auth.register(registerData);
        if (response.success) {
          authUtils.saveAuth(response.data.token, response.data.user);
          navigate('/');
        }
      } else {
        const response = await API.auth.login(formData);
        if (response.success) {
          authUtils.saveAuth(response.data.token, response.data.user);
          navigate('/');
        }
      }
    } catch (error) {
      console.error(isRegisterPage ? '注册失败:' : '登录失败:', error);
      setError(error instanceof Error ? error.message : (isRegisterPage ? '注册失败，请重试' : '登录失败，请检查邮箱和密码'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    Object.assign(e.currentTarget.style, { backgroundColor: '#201f21', border: '1px solid rgba(143,245,255,0.2)' });
  };
  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    Object.assign(e.currentTarget.style, { backgroundColor: '#131314', border: '1px solid rgba(255,255,255,0.06)' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#0e0e0f' }}>
      {/* Ambient glow behind card */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(ellipse, #8ff5ff 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      <div className="relative max-w-md w-full space-y-7">

        {/* Logo */}
        <div className="text-center">
         
          <h1 className="text-3xl font-bold text-white mb-2"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '-0.02em' }}>
            轻搭
          </h1>
          <p className="text-sm" style={{ color: '#6e6e73' }}>
            {isRegisterPage ? '加入我们，寻找志同道合的搭子' : '欢迎回来，继续你的搭子之旅'}
          </p>
        </div>

        {/* Form card */}
        <div className="p-7" style={{
          backgroundColor: '#1c1b1e',
          borderRadius: '1.25rem',
          border: '1px solid rgba(255,255,255,0.05)',
          boxShadow: '0 4px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(143,245,255,0.04)',
        }}>
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Error */}
            {error && (
              <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm"
                style={{ backgroundColor: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.15)', color: '#ff6b6b' }}>
                <span className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">!</span>
                <span>{error}</span>
              </div>
            )}

            {/* Nickname (register only) */}
            {isRegisterPage && (
              <div>
                <label htmlFor="nickname" className="block text-sm font-semibold mb-2" style={{ color: '#8e8e93' }}>
                  昵称
                </label>
                <input
                  id="nickname"
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="请输入你的昵称"
                  required
                  maxLength={8}
                  style={inputBase}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                />
                <p className="text-xs mt-1.5 text-right" style={{ color: '#4e4e53' }}>最多8个字符</p>
              </div>
            )}

            {/* Gender (register only) */}
            {isRegisterPage && (
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#8e8e93' }}>性别</label>
                <div className="flex gap-3">
                  {(['male', 'female'] as const).map(g => (
                    <label key={g} className="flex-1 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        value={g}
                        checked={gender === g}
                        onChange={(e) => setGender(e.target.value as 'male' | 'female')}
                        className="sr-only"
                      />
                      <div className="w-full py-3 rounded-xl text-center text-sm font-semibold transition-all duration-200"
                        style={gender === g
                          ? { background: 'linear-gradient(135deg, #8ff5ff, #5bc8d4)', color: '#0e0e0f' }
                          : { backgroundColor: '#131314', color: '#8e8e93', border: '1px solid rgba(255,255,255,0.06)' }
                        }>
                        {g === 'male' ? '👨 男' : '👩 女'}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold mb-2" style={{ color: '#8e8e93' }}>
                邮箱地址
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="请输入你的邮箱"
                style={inputBase}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold mb-2" style={{ color: '#8e8e93' }}>
                密码
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isRegisterPage ? 'new-password' : 'current-password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={isRegisterPage ? '请设置密码（6-20位）' : '请输入密码'}
                  minLength={6}
                  maxLength={20}
                  style={{ ...inputBase, paddingRight: '3rem' }}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 px-4 flex items-center transition-colors"
                  style={{ color: '#4e4e53' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#8e8e93')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#4e4e53')}
                >
                  {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password (register only) */}
            {isRegisterPage && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold mb-2" style={{ color: '#8e8e93' }}>
                  确认密码
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="请再次输入密码"
                    style={{ ...inputBase, paddingRight: '3rem' }}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 px-4 flex items-center transition-colors"
                    style={{ color: '#4e4e53' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#8e8e93')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#4e4e53')}
                  >
                    {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              style={{
                background: 'linear-gradient(135deg, #8ff5ff, #5bc8d4)',
                color: '#0e0e0f',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              {isLoading ? '处理中...' : (isRegisterPage ? '立即注册' : '立即登录')}
            </button>

            {/* Switch */}
            <div className="text-center pt-1">
              <span className="text-sm" style={{ color: '#6e6e73' }}>
                {isRegisterPage ? '已有账号？' : '还没有账号？'}
              </span>
              <button
                type="button"
                onClick={() => navigate(isRegisterPage ? '/login' : '/register')}
                className="text-sm font-semibold ml-1.5 transition-colors"
                style={{ color: '#8ff5ff' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#aaffdc')}
                onMouseLeave={e => (e.currentTarget.style.color = '#8ff5ff')}
              >
                {isRegisterPage ? '去登录' : '去注册'}
              </button>
            </div>
          </form>
        </div>

        {/* Placeholder color fix */}
        <style>{`input::placeholder { color: #4e4e53 !important; }`}</style>
      </div>
    </div>
  );
};

export default LoginPage;
