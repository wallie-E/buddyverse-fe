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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-blue-600 mb-2">搭子社区</h1>
          <p className="text-gray-600">
            {isRegisterPage ? '加入我们，寻找志同道合的搭子' : '欢迎回来，继续你的搭子之旅'}
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 错误提示 */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* 注册时的昵称字段 */}
            {isRegisterPage && (
              <div>
                <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-2">
                  昵称
                </label>
                <input
                  id="nickname"
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="请输入你的昵称"
                  required
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="请输入你的邮箱"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder={isRegisterPage ? '请设置密码（6-20位）' : '请输入密码'}
                  minLength={6}
                  maxLength={20}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password for Register */}
            {isRegisterPage && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="请再次输入密码"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '处理中...' : (isRegisterPage ? '立即注册' : '立即登录')}
            </button>

            {/* Switch between login and register */}
            <div className="text-center">
              <span className="text-gray-600 text-sm">
                {isRegisterPage ? '已有账号？' : '还没有账号？'}
              </span>
              <button
                type="button"
                onClick={() => navigate(isRegisterPage ? '/login' : '/register')}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm ml-1"
              >
                {isRegisterPage ? '去登录' : '去注册'}
              </button>
            </div>
          </form>
        </div>

        {/* Demo Account Info */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-medium text-gray-700 mb-2">测试账户</h3>
          <div className="text-xs text-gray-600 space-y-1">
            <p>管理员: admin@example.com / password</p>
            <p>普通用户: 可以直接注册新账户</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 