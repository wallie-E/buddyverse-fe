import { useState, useEffect } from 'react';
import { ChevronLeftIcon, TrashIcon, ChartBarIcon, UsersIcon, EyeIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Modal, Input, Space, message, Popconfirm, Spin, ConfigProvider, theme, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { getStats, adminUsers, adminPosts } from '../api/admin';
import type { User, Post, AdminStats } from '../api/types';

const SURFACE = '#1c1b1e';
const SURFACE_LOW = '#131314';
const SURFACE_HIGH = '#201f21';
const PRIMARY = '#8ff5ff';
const SECONDARY = '#d575ff';
const TERTIARY = '#aaffdc';
const TEXT = '#e0e0e3';
const TEXT_SUB = '#8e8e93';

const darkTheme = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorBgContainer: SURFACE,
    colorBgElevated: SURFACE_HIGH,
    colorText: TEXT,
    colorTextSecondary: TEXT_SUB,
    colorBorder: 'rgba(255,255,255,0.08)',
    colorBorderSecondary: 'rgba(255,255,255,0.05)',
    colorPrimary: PRIMARY,
    colorPrimaryHover: '#a8f8ff',
    colorError: '#ff6478',
    fontFamily: 'Inter, system-ui, sans-serif',
    borderRadius: 12,
    colorSplit: 'rgba(255,255,255,0.06)',
    colorFillAlter: SURFACE_LOW,
  },
  components: {
    Table: {
      headerBg: SURFACE_LOW,
      rowHoverBg: 'rgba(143,245,255,0.04)',
      headerColor: TEXT_SUB,
      borderColor: 'rgba(255,255,255,0.06)',
      footerBg: SURFACE_LOW,
    },
    Input: {
      colorBgContainer: SURFACE_LOW,
      activeBorderColor: PRIMARY,
      hoverBorderColor: 'rgba(143,245,255,0.3)',
    },
    Button: {
      colorLink: PRIMARY,
      colorLinkHover: '#a8f8ff',
      colorLinkActive: '#a8f8ff',
      colorErrorText: '#ff6478',
    },
    Popconfirm: {
      colorBgElevated: SURFACE_HIGH,
    },
    Spin: {
      colorPrimary: PRIMARY,
    },
    Pagination: {
      colorBgContainer: SURFACE,
    },
  },
};

const StatCard = ({
  label,
  value,
  sub,
  subValue,
  accentColor,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  sub: string;
  subValue: number | string;
  accentColor: string;
  icon: React.ElementType;
}) => (
  <div
    style={{
      backgroundColor: SURFACE,
      borderRadius: '1.25rem',
      border: `1px solid ${accentColor}22`,
      boxShadow: `0 4px 32px rgba(0,0,0,0.3), 0 0 40px ${accentColor}08`,
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div>
        <p style={{ color: TEXT_SUB, fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.4rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          {label}
        </p>
        <p style={{ color: accentColor, fontSize: '2.25rem', fontWeight: 700, lineHeight: 1, fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '-0.02em' }}>
          {value}
        </p>
      </div>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: '0.75rem',
          backgroundColor: `${accentColor}14`,
          border: `1px solid ${accentColor}25`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon style={{ width: 20, height: 20, color: accentColor }} />
      </div>
    </div>
    <p style={{ color: TEXT_SUB, fontSize: '0.8rem' }}>
      <span style={{ color: `${accentColor}bb`, fontWeight: 600 }}>{subValue}</span>
      {'  '}{sub}
    </p>
  </div>
);

const AdminPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDetailVisible, setUserDetailVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [userPosts, setUserPosts] = useState<Post[]>([]);

  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [userPostsLoading, setUserPostsLoading] = useState(false);

  const fetchStats = async () => {
    try {
      const response = await getStats();
      setStats(response.data);
    } catch {
      message.error('获取统计数据失败');
    }
  };

  const fetchUsers = async (page = 1, limit = 10, search?: string) => {
    setLoading(true);
    try {
      const params: { page: number; limit: number; search?: string } = { page, limit };
      if (search?.trim()) params.search = search.trim();
      const response = await adminUsers.list(params);
      setUsers(response.data.list);
      setTotalUsers(response.data.pagination.total);
    } catch {
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async (userId: number) => {
    setUserPostsLoading(true);
    try {
      const response = await adminPosts.getUserPosts(userId, { page: 1, limit: 100 });
      setSelectedUser(response.data.user);
      setUserPosts(response.data.posts.list);
    } catch {
      message.error('获取用户帖子失败');
    } finally {
      setUserPostsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchUsers(1, pageSize);
  }, [pageSize]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('zh-CN');

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
    fetchUsers(1, pageSize, value);
  };

  const handleSearchClear = () => {
    setSearchQuery('');
    setCurrentPage(1);
    fetchUsers(1, pageSize);
  };

  const handleDeleteUser = async (userId: number, userNickname: string) => {
    try {
      await adminUsers.delete(userId);
      message.success(`用户 ${userNickname} 删除成功`);
      fetchUsers(currentPage, pageSize);
    } catch {
      message.error('删除用户失败');
    }
  };

  const handleViewUser = async (user: User) => {
    setUserDetailVisible(true);
    await fetchUserPosts(user.id);
  };

  const handleDeletePost = async (postId: number, postContent: string) => {
    try {
      console.log('删除帖子:', postId, '内容:', postContent);
      await adminPosts.delete(postId);
      message.success('帖子删除成功');
      if (selectedUser) await fetchUserPosts(selectedUser.id);
    } catch {
      message.error('删除帖子失败');
    }
  };

  const genderLabel = (gender: string) =>
    gender === 'male' ? '男' : gender === 'female' ? '女' : '其他';
  const genderColor = (gender: string) =>
    gender === 'male' ? '#60a5fa' : gender === 'female' ? '#f472b6' : TEXT_SUB;

  const columns: ColumnsType<User> = [
    {
      title: '用户',
      dataIndex: 'nickname',
      key: 'nickname',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: `linear-gradient(135deg, rgba(143,245,255,0.25), rgba(213,117,255,0.25))`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.9rem',
              color: PRIMARY,
              flexShrink: 0,
            }}
          >
            {text?.charAt(0)}
          </div>
          <div>
            <span style={{ color: TEXT, fontWeight: 600, fontSize: '0.875rem' }}>{text}</span>
            {record.role === 'admin' && (
              <span
                style={{
                  marginLeft: 6,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: SECONDARY,
                  backgroundColor: `${SECONDARY}18`,
                  border: `1px solid ${SECONDARY}30`,
                  borderRadius: '999px',
                  padding: '1px 7px',
                }}
              >
                管理员
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      render: (email) => (
        <span style={{ color: TEXT_SUB, fontSize: '0.85rem' }}>{email}</span>
      ),
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      render: (gender) => (
        <span
          style={{
            fontSize: '0.8rem',
            fontWeight: 600,
            color: genderColor(gender),
            backgroundColor: `${genderColor(gender)}18`,
            border: `1px solid ${genderColor(gender)}28`,
            borderRadius: '999px',
            padding: '2px 10px',
          }}
        >
          {genderLabel(gender)}
        </span>
      ),
    },
    {
      title: '帖子数',
      dataIndex: 'post_count',
      key: 'post_count',
      render: (count) => (
        <span
          style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            color: TERTIARY,
            backgroundColor: `${TERTIARY}14`,
            border: `1px solid ${TERTIARY}22`,
            borderRadius: '999px',
            padding: '2px 10px',
          }}
        >
          {count}
        </span>
      ),
    },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => (
        <span style={{ color: TEXT_SUB, fontSize: '0.85rem' }}>{formatDate(date)}</span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeIcon style={{ width: 14, height: 14 }} />}
            onClick={() => handleViewUser(record)}
            style={{ color: PRIMARY, padding: '0 4px', fontSize: '0.85rem' }}
          >
            详情
          </Button>
          <Popconfirm
            title="确认删除用户"
            description={
              <div style={{ color: TEXT_SUB, fontSize: '0.85rem', maxWidth: 240 }}>
                <p>确定永久删除用户 <strong style={{ color: TEXT }}>{record.nickname}</strong> 吗？</p>
                <p style={{ color: '#ff6478', marginTop: 6, fontSize: '0.8rem' }}>
                  此操作无法恢复，包括该用户所有数据。
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
              icon={<TrashIcon style={{ width: 14, height: 14 }} />}
              style={{ padding: '0 4px', fontSize: '0.85rem' }}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <ConfigProvider theme={darkTheme}>
      <div style={{ minHeight: '100vh', backgroundColor: '#0e0e0f' }}>

        {/* 顶部导航 */}
        <div
          style={{
            backgroundColor: 'rgba(14,14,15,0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            position: 'sticky',
            top: 0,
            zIndex: 50,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1.25rem' }}>
            <button
              onClick={() => navigate('/')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.4rem',
                borderRadius: '0.625rem',
                color: TEXT_SUB,
                display: 'flex',
                alignItems: 'center',
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = TEXT)}
              onMouseLeave={e => (e.currentTarget.style.color = TEXT_SUB)}
            >
              <ChevronLeftIcon style={{ width: 22, height: 22 }} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '0.75rem',
                  background: `linear-gradient(135deg, ${PRIMARY}30, ${SECONDARY}30)`,
                  border: `1px solid ${PRIMARY}25`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ChartBarIcon style={{ width: 20, height: 20, color: PRIMARY }} />
              </div>
              <div>
                <h1
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    color: TEXT,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    letterSpacing: '-0.02em',
                    margin: 0,
                    lineHeight: 1.2,
                  }}
                >
                  管理后台
                </h1>
                <p style={{ fontSize: '0.75rem', color: TEXT_SUB, margin: 0 }}>用户管理</p>
              </div>
            </div>

            <div style={{ width: 30 }} />
          </div>
        </div>

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.25rem' }}>

          {/* 统计卡片 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <StatCard
              label="总用户数"
              value={stats?.users.total_users ?? '—'}
              sub="活跃用户"
              subValue={stats?.users.active_users ?? 0}
              accentColor={PRIMARY}
              icon={UsersIcon}
            />
            <StatCard
              label="总帖子数"
              value={stats?.posts.total_posts ?? '—'}
              sub="今日新增"
              subValue={stats?.posts.today_posts ?? 0}
              accentColor={TERTIARY}
              icon={ChartBarIcon}
            />
          </div>

          {/* 用户管理表格 */}
          <div
            style={{
              backgroundColor: SURFACE,
              borderRadius: '1.25rem',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '0 4px 32px rgba(0,0,0,0.3)',
              overflow: 'hidden',
            }}
          >
            {/* 表格头部 */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <UsersIcon style={{ width: 18, height: 18, color: TEXT_SUB }} />
                <h2
                  style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: TEXT,
                    margin: 0,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    letterSpacing: '-0.01em',
                  }}
                >
                  用户列表
                </h2>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: PRIMARY,
                    backgroundColor: `${PRIMARY}14`,
                    border: `1px solid ${PRIMARY}22`,
                    borderRadius: '999px',
                    padding: '1px 8px',
                  }}
                >
                  {totalUsers}
                </span>
              </div>
              <Input.Search
                placeholder="搜索用户昵称或邮箱..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onSearch={handleSearch}
                onClear={handleSearchClear}
                allowClear
                style={{ width: 280 }}
                enterButton
              />
            </div>

            <div style={{ padding: '0 0.25rem' }}>
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
                  showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条 / 共 ${total} 条`,
                  onChange: (page, size) => {
                    setCurrentPage(page);
                    setPageSize(size || 10);
                    fetchUsers(page, size || 10, searchQuery);
                  },
                  style: { padding: '0.75rem 1rem' },
                }}
                style={{ backgroundColor: 'transparent' }}
              />
            </div>
          </div>
        </div>

        {/* 用户详情 Modal */}
        <Modal
          title={
            <span
              style={{
                color: TEXT,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 700,
                letterSpacing: '-0.01em',
              }}
            >
              用户详情
            </span>
          }
          open={userDetailVisible}
          onCancel={() => setUserDetailVisible(false)}
          footer={null}
          width={720}
          styles={{
            content: {
              backgroundColor: SURFACE,
              borderRadius: '1.25rem',
              border: '1px solid rgba(255,255,255,0.07)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
              padding: 0,
            },
            header: {
              backgroundColor: SURFACE,
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              padding: '1.25rem 1.5rem',
              borderRadius: '1.25rem 1.25rem 0 0',
              marginBottom: 0,
            },
            body: {
              padding: '1.5rem',
              maxHeight: '75vh',
              overflowY: 'auto',
            },
          }}
        >
          {selectedUser && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* 用户基本信息 */}
              <div
                style={{
                  backgroundColor: SURFACE_LOW,
                  borderRadius: '1rem',
                  padding: '1.25rem',
                }}
              >
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: TEXT_SUB, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                  基本信息
                </p>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, rgba(143,245,255,0.3), rgba(213,117,255,0.3))`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1.4rem',
                      color: PRIMARY,
                      flexShrink: 0,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                  >
                    {selectedUser.nickname?.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: TEXT, margin: 0, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {selectedUser.nickname}
                      </h3>
                      {selectedUser.role === 'admin' && (
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: SECONDARY, backgroundColor: `${SECONDARY}18`, border: `1px solid ${SECONDARY}30`, borderRadius: 999, padding: '1px 7px' }}>
                          管理员
                        </span>
                      )}
                    </div>
                    <p style={{ color: TEXT_SUB, fontSize: '0.875rem', margin: '0 0 4px' }}>{selectedUser.email}</p>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: TEXT_SUB, marginTop: 4 }}>
                      <span>
                        性别：<span style={{ color: genderColor(selectedUser.gender || ''), fontWeight: 600 }}>{genderLabel(selectedUser.gender || '')}</span>
                      </span>
                      <span>注册：{selectedUser.created_at ? formatDate(selectedUser.created_at) : '未知'}</span>
                    </div>
                    {selectedUser.signature && (
                      <p style={{ color: TEXT_SUB, fontStyle: 'italic', fontSize: '0.85rem', marginTop: 8 }}>
                        "{selectedUser.signature}"
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* 统计 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {[
                  { label: '发布帖子', value: userPosts.length, color: PRIMARY },
                  { label: '获得评论', value: userPosts.reduce((s, p) => s + p.comment_count, 0), color: TERTIARY },
                ].map(({ label, value, color }) => (
                  <div
                    key={label}
                    style={{
                      backgroundColor: SURFACE_LOW,
                      borderRadius: '0.875rem',
                      padding: '1rem',
                      textAlign: 'center',
                      border: `1px solid ${color}18`,
                    }}
                  >
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, color, fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1 }}>
                      {value}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: TEXT_SUB, marginTop: 4 }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* 帖子列表 */}
              <div
                style={{
                  backgroundColor: SURFACE_LOW,
                  borderRadius: '1rem',
                  padding: '1.25rem',
                }}
              >
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: TEXT_SUB, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                  发布的帖子
                </p>
                <Spin spinning={userPostsLoading}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {userPosts.map((post) => (
                      <div
                        key={post.id}
                        style={{
                          backgroundColor: SURFACE_HIGH,
                          borderRadius: '0.875rem',
                          padding: '1rem',
                          border: '1px solid rgba(255,255,255,0.05)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                          <div style={{ flex: 1 }}>
                            <p style={{ color: TEXT, fontSize: '0.875rem', margin: '0 0 8px', lineHeight: 1.6 }}>{post.content}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', fontSize: '0.78rem', color: TEXT_SUB, flexWrap: 'wrap' }}>
                              <span>📍 {post.location || '未设置位置'}</span>
                              <span>📅 {formatDate(post.created_at)}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                              {post.category_name && (
                                <Tag
                                  style={{
                                    fontSize: '0.72rem',
                                    color: PRIMARY,
                                    backgroundColor: `${PRIMARY}14`,
                                    border: `1px solid ${PRIMARY}22`,
                                    borderRadius: 999,
                                    padding: '0 8px',
                                  }}
                                >
                                  {post.category_name}
                                </Tag>
                              )}
                              {post.subcategory_name && (
                                <Tag
                                  style={{
                                    fontSize: '0.72rem',
                                    color: TERTIARY,
                                    backgroundColor: `${TERTIARY}14`,
                                    border: `1px solid ${TERTIARY}22`,
                                    borderRadius: 999,
                                    padding: '0 8px',
                                  }}
                                >
                                  {post.subcategory_name}
                                </Tag>
                              )}
                            </div>
                          </div>
                          <Popconfirm
                            title="确认删除帖子"
                            description={
                              <div style={{ color: TEXT_SUB, fontSize: '0.85rem', maxWidth: 220 }}>
                                <p>确定永久删除这条帖子吗？</p>
                                <p style={{ color: '#ff6478', marginTop: 4, fontSize: '0.78rem' }}>此操作无法恢复。</p>
                              </div>
                            }
                            onConfirm={() => handleDeletePost(post.id, post.content)}
                            okText="确认删除"
                            cancelText="取消"
                            okButtonProps={{ danger: true }}
                            placement="topRight"
                          >
                            <button
                              style={{
                                background: 'none',
                                border: '1px solid rgba(255,100,120,0.25)',
                                cursor: 'pointer',
                                padding: '5px 8px',
                                borderRadius: '0.5rem',
                                color: '#ff6478',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                flexShrink: 0,
                                transition: 'background 0.2s',
                              }}
                              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,100,120,0.1)')}
                              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                            >
                              <TrashIcon style={{ width: 13, height: 13 }} />
                              删除
                            </button>
                          </Popconfirm>
                        </div>
                      </div>
                    ))}
                    {userPosts.length === 0 && !userPostsLoading && (
                      <div style={{ textAlign: 'center', padding: '2rem 0', color: TEXT_SUB, fontSize: '0.875rem' }}>
                        该用户还没有发布任何帖子
                      </div>
                    )}
                  </div>
                </Spin>
              </div>

            </div>
          )}
        </Modal>

      </div>
    </ConfigProvider>
  );
};

export default AdminPage;
