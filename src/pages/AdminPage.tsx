import { useState, useEffect } from 'react';
import { ChevronLeftIcon, TrashIcon, ChartBarIcon, UsersIcon, FireIcon, EyeIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Modal, Card, Tag, Input, Space, message, Popconfirm, Spin } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { getStats, adminUsers, adminPosts } from '../api/admin';
import type { User, Post, AdminStats } from '../api/types';

const AdminPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDetailVisible, setUserDetailVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  
  // API相关状态
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [userPostsLoading, setUserPostsLoading] = useState(false);

  // 获取统计数据
  const fetchStats = async () => {
    try {
      const response = await getStats();
      setStats(response.data);
    } catch (error) {
      console.error('获取统计数据失败:', error);
      message.error('获取统计数据失败');
    }
  };

  // 获取用户列表
  const fetchUsers = async (page: number = 1, limit: number = 10, search?: string) => {
    setLoading(true);
    try {
      const params: { page: number; limit: number; search?: string } = { page, limit };
      if (search && search.trim()) {
        params.search = search.trim();
      }
      
      const response = await adminUsers.list(params);
      setUsers(response.data.list);
      setTotalUsers(response.data.pagination.total);
    } catch (error) {
      console.error('获取用户列表失败:', error);
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取用户帖子和用户信息
  const fetchUserPosts = async (userId: number) => {
    setUserPostsLoading(true);
    try {
      const response = await adminPosts.getUserPosts(userId, { page: 1, limit: 100 });
      // 更新用户信息（从API获取的最新信息）
      setSelectedUser(response.data.user);
      setUserPosts(response.data.posts.list);
    } catch (error) {
      console.error('获取用户帖子失败:', error);
      message.error('获取用户帖子失败');
    } finally {
      setUserPostsLoading(false);
    }
  };

  // 初始化数据
  useEffect(() => {
    fetchStats();
    fetchUsers(1, pageSize);
  }, [pageSize]);

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // 重置到第一页
    fetchUsers(1, pageSize, value);
  };

  // 处理搜索框清空
  const handleSearchClear = () => {
    setSearchQuery('');
    setCurrentPage(1);
    fetchUsers(1, pageSize);
  };

  // 删除用户
  const handleDeleteUser = async (userId: number, userNickname: string) => {
    try {
      await adminUsers.delete(userId);
      message.success(`用户 ${userNickname} 删除成功`);
      // 重新获取用户列表
      fetchUsers(currentPage, pageSize);
    } catch (error) {
      console.error('删除用户失败:', error);
      message.error('删除用户失败');
    }
  };

  // 查看用户详情
  const handleViewUser = async (user: User) => {
    setUserDetailVisible(true);
    await fetchUserPosts(user.id);
  };

  // 删除用户帖子
  const handleDeletePost = async (postId: number, postContent: string) => {
    try {
      console.log('删除帖子:', postId, '内容:', postContent);
      await adminPosts.delete(postId);
      message.success('帖子删除成功');
      // 重新获取用户帖子
      if (selectedUser) {
        await fetchUserPosts(selectedUser.id);
      }
    } catch (error) {
      console.error('删除帖子失败:', error);
      message.error('删除帖子失败');
    }
  };


  // 表格列定义
  const columns: ColumnsType<User> = [
    {
      title: '用户',
      dataIndex: 'nickname',
      key: 'nickname',
      render: (text, record) => (
        <div className="flex items-center space-x-3">
          {/* <Avatar src={getUserAvatar(record)} size={40} /> */}
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-medium">{text}</span>
              {record.role === 'admin' && (
                <Tag color="blue">管理员</Tag>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      render: (gender) => (
        <Tag color={gender === 'male' ? 'blue' : gender === 'female' ? 'pink' : 'purple'}>
          {gender === 'male' ? '男' : gender === 'female' ? '女' : '其他'}
        </Tag>
      ),
    },
    {
      title: '帖子数',
      dataIndex: 'post_count',
      key: 'post_count',
      render: (count) => (
        <Tag color="blue">{count}</Tag>
      ),
    },
    // {
    //   title: '评论数',
    //   dataIndex: 'commentCount',
    //   key: 'commentCount',
    //   render: (count) => (
    //     <Tag color="green">{count}</Tag>
    //   ),
    // },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => formatDate(date),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeIcon className="w-4 h-4" />}
            onClick={() => handleViewUser(record)}
          >
            查看详情
          </Button>
          <Popconfirm
            title="确认删除用户"
            description={
              <div>
                <p>您确定要删除用户 <strong>{record.nickname}</strong> 吗？</p>
                <p style={{ color: '#ff4d4f', marginTop: '8px' }}>
                  ⚠️ 此操作将永久删除该用户及其所有数据，无法恢复！
                </p>
              </div>
            }
            onConfirm={() => handleDeleteUser(record.id, record.nickname)}
            okText="确认删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
            placement="topRight"
          >
            <Button
              type="link"
              danger
              icon={<TrashIcon className="w-4 h-4" />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

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
              <p className="text-sm text-gray-500">用户管理</p>
            </div>
          </div>
          <div className="w-6"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {/* 总用户数 */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-blue-100 text-sm">总用户数</p>
                <p className="text-3xl font-bold">{stats?.users.total_users || 0}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <UsersIcon className="w-6 h-6" />
              </div>
            </div>
            <div className="flex items-center text-sm">
              <span className="text-blue-100">活跃用户: {stats?.users.active_users || 0}</span>
            </div>
          </div>

          {/* 总帖子数 */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-green-100 text-sm">总帖子数</p>
                <p className="text-3xl font-bold">{stats?.posts.total_posts || 0}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <ChartBarIcon className="w-6 h-6" />
              </div>
            </div>
            <div className="flex items-center text-sm">
              <span className="text-green-100">今日新增: {stats?.posts.today_posts || 0}</span>
            </div>
          </div>

          {/* 总评论数 */}
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-purple-100 text-sm">总评论数</p>
                <p className="text-3xl font-bold">{stats?.comments.total_comments || 0}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <FireIcon className="w-6 h-6" />
              </div>
            </div>
            <div className="flex items-center text-sm">
              <span className="text-purple-100">今日新增: {stats?.comments.today_comments || 0}</span>
            </div>
          </div>
        </div>

        {/* 用户管理表格 */}
        <Card title="用户管理" className="shadow-sm">
          <div className="mb-4">
            <Input.Search
              placeholder="搜索用户昵称或邮箱..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onSearch={handleSearch}
              onClear={handleSearchClear}
              allowClear
              style={{ width: 300 }}
              enterButton
            />
          </div>
          
          <Table
            columns={columns}
            dataSource={users}
            rowKey="id"
            loading={loading}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: totalUsers,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
              onChange: (page, size) => {
                setCurrentPage(page);
                setPageSize(size || 10);
                fetchUsers(page, size || 10, searchQuery);
              },
            }}
          />
        </Card>
      </div>

      {/* 用户详情模态框 */}
      <Modal
        title="用户详情"
        open={userDetailVisible}
        onCancel={() => setUserDetailVisible(false)}
        footer={null}
        width={800}
      >
        {selectedUser && (
          <div className="space-y-6">
            {/* 用户基本信息 */}
            <Card title="基本信息" size="small">
              <div className="flex items-start space-x-4">
                {/* <Avatar src={getUserAvatar(selectedUser)} size={80} /> */}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-medium">{selectedUser.nickname}</h3>
                    {selectedUser.role === 'admin' && (
                      <Tag color="blue">管理员</Tag>
                    )}
                  </div>
                  <p className="text-gray-600 mb-2">{selectedUser.email}</p>
                  <p className="text-gray-600 mb-2">
                    性别: {selectedUser.gender === 'male' ? '男' : selectedUser.gender === 'female' ? '女' : '其他'}
                  </p>
                  <p className="text-gray-600 mb-2">
                    注册时间: {selectedUser.created_at ? formatDate(selectedUser.created_at) : '未知'}
                  </p>
                  {selectedUser.signature && (
                    <p className="text-gray-600 italic">"{selectedUser.signature}"</p>
                  )}
                </div>
              </div>
            </Card>

            {/* 用户统计 */}
            <Card title="统计信息" size="small">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{userPosts.length}</div>
                  <div className="text-gray-600">发布帖子</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {userPosts.reduce((sum, post) => sum + post.comment_count, 0)}
                  </div>
                  <div className="text-gray-600">总评论数</div>
                </div>
              </div>
            </Card>

            {/* 用户发布的帖子 */}
            <Card title="发布的帖子" size="small">
              <Spin spinning={userPostsLoading}>
                <div className="space-y-3">
                  {userPosts.map((post) => (
                    <div key={post.id} className="border rounded-lg p-3 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="text-gray-900 mb-1">{post.content}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>📍 {post.location || '未设置位置'}</span>
                            <span>📅 {formatDate(post.created_at)}</span>
                            <span>💬 {post.comment_count} 评论</span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <Popconfirm
                            title="确认删除帖子"
                            description={
                              <div>
                                <p>您确定要删除这个帖子吗？</p>
                                <p style={{ color: '#ff4d4f', marginTop: '8px', fontSize: '12px' }}>
                                  ⚠️ 此操作将永久删除该帖子及其所有评论，无法恢复！
                                </p>
                                <div style={{ 
                                  marginTop: '8px', 
                                  padding: '8px', 
                                  backgroundColor: '#f5f5f5', 
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  color: '#666',
                                  maxWidth: '200px',
                                  wordBreak: 'break-word'
                                }}>
                                  "{post.content.length > 50 ? post.content.substring(0, 50) + '...' : post.content}"
                                </div>
                              </div>
                            }
                            onConfirm={() => handleDeletePost(post.id, post.content)}
                            okText="确认删除"
                            cancelText="取消"
                            okButtonProps={{ danger: true }}
                            placement="topRight"
                          >
                            <Button
                              type="text"
                              danger
                              size="small"
                              icon={<TrashIcon className="w-4 h-4" />}
                            >
                              删除
                            </Button>
                          </Popconfirm>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Tag color="blue">{post.category_name}</Tag>
                        <Tag color="green">{post.subcategory_name}</Tag>
                        {post.comment_visibility === 'private' && (
                          <Tag color="orange">私密评论</Tag>
                        )}
                      </div>
                    </div>
                  ))}
                  {userPosts.length === 0 && !userPostsLoading && (
                    <div className="text-center py-8 text-gray-500">
                      该用户还没有发布任何帖子
                    </div>
                  )}
                </div>
              </Spin>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminPage; 