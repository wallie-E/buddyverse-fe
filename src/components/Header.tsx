import { useState, useRef, useEffect } from 'react';
import { BellIcon, Bars2Icon, Cog6ToothIcon, PencilIcon, ChevronLeftIcon, ChevronRightIcon} from '@heroicons/react/24/outline';
import { PlusCircleIcon } from '@heroicons/react/24/solid';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../data/mockData';
import { redirectToLoginIfNeeded } from '../utils/auth';
import { useNotification } from '../hooks/useNotification';
import { authUtils } from '../api';
import { useGenderFilter } from '../contexts/GenderFilterContext';

export default function Header() {
  const navigate = useNavigate();
  const { unreadCount } = useNotification();
  const { selectedGender, setSelectedGender } = useGenderFilter();
  const currentUser = getCurrentUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showGenderFilter, setShowGenderFilter] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // 检查用户是否已登录
  const isAuthenticated = authUtils.isAuthenticated();

  // 检查是否是管理员
  const isAdmin = currentUser?.role === 'admin';

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const clickedOutsideMenu = menuRef.current && !menuRef.current.contains(event.target as Node);
      const clickedOutsideMobileMenu = mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node);

      if (clickedOutsideMenu && clickedOutsideMobileMenu) {
        setIsMenuOpen(false);
        setShowGenderFilter(false);
      }
    };

    if (isMenuOpen || showGenderFilter) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen, showGenderFilter]);

  // 处理发布帖子点击事件
  const handleCreatePost = () => {
    // 检查用户是否已登录，如果未登录则跳转到登录页
    if (redirectToLoginIfNeeded(navigate)) {
      return;
    }
    // 用户已登录，跳转到发布帖子页面
    navigate('/create-post');
  };

  // 处理菜单项点击
  const handleProfileClick = () => {
    setIsMenuOpen(false);
    navigate('/profile');
  };

  const handleFilterClick = () => {
    setShowGenderFilter(true);
  };

  const handleGenderSelect = (gender: 'male' | 'female' | null) => {
    setSelectedGender(gender);
    setShowGenderFilter(false);
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    if (confirm('确定要退出登录吗？')) {
      authUtils.logout();
      setIsMenuOpen(false);
      navigate('/login');
    }
  };

  const handleBackToMenu = () => {
    setShowGenderFilter(false);
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div
            className="flex items-center cursor-pointer gap-3 group"
            onClick={() => navigate('/')}
          >
            <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300">
              <span className="text-white font-medium text-lg font-sans">搭</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-medium text-slate-800 tracking-tight group-hover:text-slate-900 transition-colors font-sans">轻搭</h1>
              <p className="text-xs text-slate-500 font-normal tracking-wide font-sans">发现志同道合的伙伴</p>
            </div>
          </div>

          {/* Navigation - Mobile */}
          <div className="flex items-center space-x-3 sm:hidden">
            {isAuthenticated ? (
              <>
                <button
                  onClick={handleCreatePost}
                >
                 <PlusCircleIcon className="h-8 w-8 " />
                </button>
                <button
                  onClick={() => navigate('/notifications')}
                  className="relative p-2.5 text-slate-500 hover:bg-slate-50 rounded-full transition-all duration-300"
                >
                  <BellIcon className="h-6 w-6" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-2 bg-red-500 ring-2 ring-white text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
                <div className="relative" ref={mobileMenuRef}>
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="p-2.5 hover:bg-slate-50 rounded-full transition-all duration-300"
                  >
                    <Bars2Icon className={`h-6 w-6 transition-colors ${isMenuOpen || showGenderFilter ? 'text-slate-800' : 'text-slate-400'}`} />
                  </button>

                  {/* 下拉菜单 */}
                  {(isMenuOpen || showGenderFilter) && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-[0_8px_30px_-12px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden z-50">
                      {!showGenderFilter ? (
                        <>
                          <button
                            onClick={handleProfileClick}
                            className="w-full px-4 py-3 text-left text-slate-700 hover:bg-slate-50 transition-colors font-sans text-sm font-medium"
                          >
                            个人资料
                          </button>
                          <button
                            onClick={handleFilterClick}
                            className="w-full px-4 py-3 flex items-center justify-between text-slate-700 hover:bg-slate-50 transition-colors font-sans text-sm font-medium"
                          >
                            <span>筛选</span>
                            <ChevronRightIcon className="h-4 w-4 text-slate-400" />
                          </button>
                          <div className="h-px bg-slate-100"></div>
                          <button
                            onClick={handleLogout}
                            className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 transition-colors font-sans text-sm font-medium"
                          >
                            退出
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={handleBackToMenu}
                            className="w-full px-4 py-3 flex items-center gap-2 text-slate-700 hover:bg-slate-50 transition-colors font-sans text-sm font-medium"
                          >
                            <ChevronLeftIcon className="h-4 w-4" />
                            返回
                          </button>
                          <div className="h-px bg-slate-100"></div>
                          <div className="px-4 py-3">
                            <div className="text-xs text-slate-500 mb-2 font-sans">性别筛选</div>
                            <div className="space-y-1">
                              <button
                                onClick={() => handleGenderSelect(null)}
                                className={`w-full px-3 py-2 text-left rounded-lg transition-colors font-sans text-sm ${selectedGender === null
                                  ? 'bg-slate-100 text-slate-900 font-medium'
                                  : 'text-slate-700 hover:bg-slate-50'
                                  }`}
                              >
                                全部
                              </button>
                              <button
                                onClick={() => handleGenderSelect('male')}
                                className={`w-full px-3 py-2 text-left rounded-lg transition-colors font-sans text-sm ${selectedGender === 'male'
                                  ? 'bg-slate-100 text-slate-900 font-medium'
                                  : 'text-slate-700 hover:bg-slate-50'
                                  }`}
                              >
                                男
                              </button>
                              <button
                                onClick={() => handleGenderSelect('female')}
                                className={`w-full px-3 py-2 text-left rounded-lg transition-colors font-sans text-sm ${selectedGender === 'female'
                                  ? 'bg-slate-100 text-slate-900 font-medium'
                                  : 'text-slate-700 hover:bg-slate-50'
                                  }`}
                              >
                                女
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
                {/* 移动端管理员入口 */}
                {isAdmin && (
                  <button
                    onClick={() => navigate('/admin')}
                    className="p-2.5 text-slate-500 hover:bg-slate-50 rounded-full transition-all duration-300"
                  >
                    <Cog6ToothIcon className="h-6 w-6" />
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="bg-slate-900 text-white px-4 py-2 rounded-full font-medium shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 hover:bg-slate-800 transition-all duration-300"
              >
                登录
              </button>
            )}
          </div>

          {/* Navigation - Desktop */}
          <div className="hidden sm:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <button
                  onClick={handleCreatePost}
                  className="bg-slate-900 text-white px-6 py-2.5 rounded-full font-medium shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 hover:bg-slate-800 transition-all duration-300 flex items-center space-x-2 group"
                >
                  <PencilIcon className="h-4 w-4 group-hover:-rotate-12 transition-transform duration-300" />
                  <span>发布帖子</span>
                </button>

                <div className="h-6 w-px bg-slate-200 mx-2"></div>

                <button
                  onClick={() => navigate('/notifications')}
                  className="relative p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-full transition-all duration-300"
                >
                  <BellIcon className="h-6 w-6" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-2 bg-red-500 ring-2 ring-white text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="p-2.5 hover:text-slate-800 hover:bg-slate-50 rounded-full transition-all duration-300"
                  >
                    <Bars2Icon className={`h-6 w-6 transition-colors ${isMenuOpen || showGenderFilter ? 'text-slate-800' : 'text-slate-400'}`} />
                  </button>

                  {/* 下拉菜单 */}
                  {(isMenuOpen || showGenderFilter) && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-[0_8px_30px_-12px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden z-50">
                      {!showGenderFilter ? (
                        <>
                          <button
                            onClick={handleProfileClick}
                            className="w-full px-4 py-3 text-left text-slate-700 hover:bg-slate-50 transition-colors font-sans text-sm font-medium"
                          >
                            个人资料
                          </button>
                          <button
                            onClick={handleFilterClick}
                            className="w-full px-4 py-3 flex items-center justify-between text-slate-700 hover:bg-slate-50 transition-colors font-sans text-sm font-medium"
                          >
                            <span>筛选</span>
                            <ChevronRightIcon className="h-4 w-4 text-slate-400" />
                          </button>
                          <div className="h-px bg-slate-100"></div>
                          <button
                            onClick={handleLogout}
                            className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 transition-colors font-sans text-sm font-medium"
                          >
                            退出
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={handleBackToMenu}
                            className="w-full px-4 py-3 flex items-center gap-2 text-slate-700 hover:bg-slate-50 transition-colors font-sans text-sm font-medium"
                          >
                            <ChevronLeftIcon className="h-4 w-4" />
                            返回
                          </button>
                          <div className="h-px bg-slate-100"></div>
                          <div className="px-4 py-3">
                            <div className="text-xs text-slate-500 mb-2 font-sans">性别筛选</div>
                            <div className="space-y-1">
                              <button
                                onClick={() => handleGenderSelect(null)}
                                className={`w-full px-3 py-2 text-left rounded-lg transition-colors font-sans text-sm ${selectedGender === null
                                  ? 'bg-slate-100 text-slate-900 font-medium'
                                  : 'text-slate-700 hover:bg-slate-50'
                                  }`}
                              >
                                全部
                              </button>
                              <button
                                onClick={() => handleGenderSelect('male')}
                                className={`w-full px-3 py-2 text-left rounded-lg transition-colors font-sans text-sm ${selectedGender === 'male'
                                  ? 'bg-slate-100 text-slate-900 font-medium'
                                  : 'text-slate-700 hover:bg-slate-50'
                                  }`}
                              >
                                男
                              </button>
                              <button
                                onClick={() => handleGenderSelect('female')}
                                className={`w-full px-3 py-2 text-left rounded-lg transition-colors font-sans text-sm ${selectedGender === 'female'
                                  ? 'bg-slate-100 text-slate-900 font-medium'
                                  : 'text-slate-700 hover:bg-slate-50'
                                  }`}
                              >
                                女
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* 只有管理员才显示管理后台入口 */}
                {isAdmin && (
                  <button
                    onClick={() => navigate('/admin')}
                    className="p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-full transition-all duration-300"
                  >
                    <Cog6ToothIcon className="h-6 w-6" />
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="bg-slate-900 text-white px-6 py-2.5 rounded-full font-medium shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 hover:bg-slate-800 transition-all duration-300"
              >
                登录
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 