import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { API, authUtils } from '../api';
import type { LoginRequest, RegisterRequest } from '../api/types';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isRegisterPage = location.pathname === '/register';
  
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: ''
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    // 清除错误信息
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isRegisterPage) {
        // 注册逻辑
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
        
        const registerData: RegisterRequest = {
          email: formData.email,
          password: formData.password,
          nickname: nickname.trim()
        };

        const response = await API.auth.register(registerData);
        
        if (response.success) {
          // 注册成功，自动保存登录信息
          authUtils.saveAuth(response.data.token, response.data.user);
          
          // 跳转到首页
          navigate('/');
        }
      } else {
        // 登录逻辑
        const response = await API.auth.login(formData);
        
        if (response.success) {
          // 保存登录信息
          authUtils.saveAuth(response.data.token, response.data.user);
          
          // 跳转到首页
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

  return (
    <div className="min-h-screen bg-slate-50/50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo */}
        <div className="text-center">
          <h1 className="text-4xl font-medium text-slate-900 mb-3 tracking-tight font-sans">搭子社区</h1>
          <p className="text-slate-500 text-lg font-normal font-sans leading-relaxed">
            {isRegisterPage ? '加入我们，寻找志同道合的搭子' : '欢迎回来，继续你的搭子之旅'}
          </p>
        </div>

        {/* Form */}
        <div className="bg-white border border-slate-100 rounded-[2rem] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.04)] p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 错误提示 */}
            {error && (
              <div className="bg-red-50/80 backdrop-blur-sm border-0 ring-1 ring-red-100 text-red-600/90 px-6 py-4 rounded-[2rem]">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-sans">!</span>
                  </div>
                  <span className="font-medium font-sans">{error}</span>
                </div>
              </div>
            )}

            {/* 注册时的昵称字段 */}
            {isRegisterPage && (
              <div>
                <label htmlFor="nickname" className="block text-lg font-medium text-slate-900 mb-3 font-sans">
                  昵称
                </label>
                <input
                  id="nickname"
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full px-6 py-4 border-0 ring-1 ring-slate-100 bg-slate-50/50 rounded-full focus:ring-1 focus:ring-slate-300 focus:bg-white transition-all duration-300 text-lg font-sans"
                  placeholder="请输入你的昵称"
                  required
                  maxLength={8}
                />
                <p className="text-xs sm:text-sm text-slate-400 mt-1 sm:mt-2 text-end font-sans">最多8个字符</p>
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-lg font-medium text-slate-900 mb-3 font-sans">
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
                className="w-full px-6 py-4 border-0 ring-1 ring-slate-100 bg-slate-50/50 rounded-full focus:ring-1 focus:ring-slate-300 focus:bg-white transition-all duration-300 text-lg font-sans"
                placeholder="请输入你的邮箱"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-lg font-medium text-slate-900 mb-3 font-sans">
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
                  className="w-full px-6 py-4 pr-14 border-0 ring-1 ring-slate-100 bg-slate-50/50 rounded-full focus:ring-1 focus:ring-slate-300 focus:bg-white transition-all duration-300 text-lg font-sans"
                  placeholder={isRegisterPage ? '请设置密码（6-20位）' : '请输入密码'}
                  minLength={6}
                  maxLength={20}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 px-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-6 w-6" />
                  ) : (
                    <EyeIcon className="h-6 w-6" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password for Register */}
            {isRegisterPage && (
              <div>
                <label htmlFor="confirmPassword" className="block text-lg font-medium text-slate-900 mb-3 font-sans">
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
                    className="w-full px-6 py-4 pr-14 border-0 ring-1 ring-slate-100 bg-slate-50/50 rounded-full focus:ring-1 focus:ring-slate-300 focus:bg-white transition-all duration-300 text-lg font-sans"
                    placeholder="请再次输入密码"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 px-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-6 w-6" />
                    ) : (
                      <EyeIcon className="h-6 w-6" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 text-white py-4 px-6 rounded-full font-medium text-lg hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-sans"
            >
              {isLoading ? '处理中...' : (isRegisterPage ? '立即注册' : '立即登录')}
            </button>

            {/* Switch between login and register */}
            <div className="text-center pt-4">
              <span className="text-slate-500 text-base font-normal font-sans">
                {isRegisterPage ? '已有账号？' : '还没有账号？'}
              </span>
              <button
                type="button"
                onClick={() => navigate(isRegisterPage ? '/login' : '/register')}
                className="text-slate-600 hover:text-slate-800 font-medium text-base ml-2 transition-colors font-sans"
              >
                {isRegisterPage ? '去登录' : '去注册'}
              </button>
            </div>
          </form>
        </div>

        {/* Demo Account Info */}
      
      </div>
    </div>
  );
};

export default LoginPage; 