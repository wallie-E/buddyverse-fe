import { BellIcon, UserIcon, Cog6ToothIcon, PencilIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../data/mockData';
import { redirectToLoginIfNeeded } from '../utils/auth';
import { useNotification } from '../hooks/useNotification';

export default function Header() {
  const navigate = useNavigate();
  const { unreadCount } = useNotification();
  const currentUser = getCurrentUser();

  // 检查是否是管理员
  const isAdmin = currentUser.role === 'admin';

  // 处理发布帖子点击事件
  const handleCreatePost = () => {
    // 检查用户是否已登录，如果未登录则跳转到登录页
    if (redirectToLoginIfNeeded(navigate)) {
      return;
    }
    // 用户已登录，跳转到发布帖子页面
    navigate('/create-post');
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
            <button
              onClick={handleCreatePost}
              className="bg-slate-900 text-white p-2.5 rounded-full shadow-lg shadow-slate-200 hover:bg-slate-800 hover:-translate-y-0.5 transition-all duration-300"
            >
              <PencilIcon className="h-5 w-5" />
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
            <button 
              onClick={() => navigate('/profile')}
              className="p-2.5 text-slate-500 hover:bg-slate-50 rounded-full transition-all duration-300"
            >
              <UserIcon className="h-6 w-6" />
            </button>
            {/* 移动端管理员入口 */}
            {isAdmin && (
              <button 
                onClick={() => navigate('/admin')}
                className="p-2.5 text-slate-500 hover:bg-slate-50 rounded-full transition-all duration-300"
              >
                <Cog6ToothIcon className="h-6 w-6" />
              </button>
            )}
          </div>

          {/* Navigation - Desktop */}
          <div className="hidden sm:flex items-center space-x-4">
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

            <button 
              onClick={() => navigate('/profile')}
              className="p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-full transition-all duration-300"
            >
              <UserIcon className="h-6 w-6" />
            </button>

            {/* 只有管理员才显示管理后台入口 */}
            {isAdmin && (
              <button 
                onClick={() => navigate('/admin')}
                className="p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-full transition-all duration-300"
              >
                <Cog6ToothIcon className="h-6 w-6" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 