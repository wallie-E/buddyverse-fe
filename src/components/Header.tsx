import { BellIcon, UserIcon, Cog6ToothIcon, PencilIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { getUnreadNotificationCount, getCurrentUser } from '../data/mockData';
import { redirectToLoginIfNeeded } from '../utils/auth';

export default function Header() {
  const navigate = useNavigate();
  const unreadCount = getUnreadNotificationCount();
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
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div 
            className="flex items-center cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">搭</span>
            </div>
            <div className="ml-3 hidden sm:block">
              <h1 className="text-xl font-bold text-gray-900">搭子社区</h1>
              <p className="text-sm text-gray-500">发现志同道合的伙伴</p>
            </div>
          </div>

          {/* Navigation - Mobile */}
          <div className="flex items-center space-x-4 sm:hidden">
            <button
              onClick={handleCreatePost}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <button 
              onClick={() => navigate('/notifications')}
              className="relative p-2"
            >
              <BellIcon className="h-6 w-6 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            <button 
              onClick={() => navigate('/profile')}
              className="p-2"
            >
              <UserIcon className="h-6 w-6 text-gray-600" />
            </button>
            {/* 移动端管理员入口 */}
            {isAdmin && (
              <button 
                onClick={() => navigate('/admin')}
                className="p-2"
              >
                <Cog6ToothIcon className="h-6 w-6 text-gray-600" />
              </button>
            )}
          </div>

          {/* Navigation - Desktop */}
          <div className="hidden sm:flex items-center space-x-6">
            <button
              onClick={handleCreatePost}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2"
            >
              <PencilIcon className="h-4 w-4" />
              <span>发布帖子</span>
            </button>
            
            <button 
              onClick={() => navigate('/notifications')}
              className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <BellIcon className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            <button 
              onClick={() => navigate('/profile')}
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <UserIcon className="h-6 w-6" />
            </button>

            {/* 只有管理员才显示管理后台入口 */}
            {isAdmin && (
              <button 
                onClick={() => navigate('/admin')}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
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