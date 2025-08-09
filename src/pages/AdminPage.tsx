import { useState } from 'react';
import { ChevronLeftIcon, MagnifyingGlassIcon, TrashIcon, ChartBarIcon, UsersIcon, ChatBubbleLeftIcon, FireIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { mockUsers, mockPosts, mockComments } from '../data/mockData';
import type { User } from '../types';

const AdminPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'users' | 'posts' | 'comments'>('users');
  const [searchQuery, setSearchQuery] = useState('');

  // 计算统计数据
  const totalUsers = mockUsers.length;
  const totalPosts = mockPosts.length;
  const totalComments = mockComments.length;
  const todayActivity = 24; // 模拟今日活跃数据

  // 获取增长百分比（模拟数据）
  const getUserGrowth = () => '+12%';
  const getPostGrowth = () => '+8%';
  const getCommentGrowth = () => '+15%';
  const getActivityGrowth = () => '+5%';

  // 获取用户头像
  const getUserAvatar = (user: User) => {
    return user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nickname)}&background=random&color=fff`;
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  // 过滤搜索结果
  const filteredUsers = mockUsers.filter(user =>
    user.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeftIcon className="w-6 h-6 text-gray-600" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
              <ChartBarIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-medium text-gray-900">管理后台</h1>
              <p className="text-sm text-gray-500">平台内容与用户管理</p>
            </div>
          </div>
          <div className="w-6"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* 总用户数 */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-blue-100 text-sm">总用户数</p>
                <p className="text-3xl font-bold">{totalUsers}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <UsersIcon className="w-6 h-6" />
              </div>
            </div>
            <div className="flex items-center text-sm">
              <span className="text-blue-100">{getUserGrowth()} 本月</span>
            </div>
          </div>

          {/* 总帖子数 */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-green-100 text-sm">总帖子数</p>
                <p className="text-3xl font-bold">{totalPosts}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <ChatBubbleLeftIcon className="w-6 h-6" />
              </div>
            </div>
            <div className="flex items-center text-sm">
              <span className="text-green-100">{getPostGrowth()} 本月</span>
            </div>
          </div>

          {/* 总评论数 */}
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-purple-100 text-sm">总评论数</p>
                <p className="text-3xl font-bold">{totalComments}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <ChatBubbleLeftIcon className="w-6 h-6" />
              </div>
            </div>
            <div className="flex items-center text-sm">
              <span className="text-purple-100">{getCommentGrowth()} 本月</span>
            </div>
          </div>

          {/* 今日活跃 */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-orange-100 text-sm">今日活跃</p>
                <p className="text-3xl font-bold">{todayActivity}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <FireIcon className="w-6 h-6" />
              </div>
            </div>
            <div className="flex items-center text-sm">
              <span className="text-orange-100">{getActivityGrowth()} 昨日</span>
            </div>
          </div>
        </div>

        {/* 内容管理 */}
        <div className="bg-white rounded-2xl shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">内容管理</h2>
              <div className="relative">
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索用户、帖子或评论..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* 选项卡 */}
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab('users')}
                className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'users'
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                用户管理
              </button>
              <button
                onClick={() => setActiveTab('posts')}
                className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'posts'
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                帖子管理
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'comments'
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                评论管理
              </button>
            </div>
          </div>

          {/* 用户管理表格 */}
          {activeTab === 'users' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      用户
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      邮箱
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      帖子数
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      评论数
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      注册时间
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <img
                            src={getUserAvatar(user)}
                            alt={user.nickname}
                            className="w-10 h-10 rounded-full"
                          />
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-900">
                                {user.nickname}
                              </span>
                              {user.role === 'admin' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  管理员
                                </span>
                              )}
                              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {user.postCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {user.commentCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.registeredAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button className="text-red-600 hover:text-red-800 transition-colors">
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 帖子管理 */}
          {activeTab === 'posts' && (
            <div className="p-6">
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  帖子管理功能开发中
                </h3>
                <p className="text-gray-500">
                  敬请期待帖子审核、分类管理等功能
                </p>
              </div>
            </div>
          )}

          {/* 评论管理 */}
          {activeTab === 'comments' && (
            <div className="p-6">
              <div className="text-center py-12">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  评论管理功能开发中
                </h3>
                <p className="text-gray-500">
                  敬请期待评论审核、举报处理等功能
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage; 