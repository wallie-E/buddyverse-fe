import { useState, useEffect, useCallback } from 'react';
import { ChatBubbleLeftIcon, PaperAirplaneIcon, MapPinIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useNavigate, useParams } from 'react-router-dom';
import { message, Modal } from 'antd';
import { MessageCircleMore } from 'lucide-react';
import { getPostById } from '../api/posts';
import { getPostComments, createComment } from '../api/comments';
import { authUtils } from '../api';
import { getExchangeInfo, createExchangeRequest, confirmExchange, updateWechat } from '../api/wechatExchange';
import type { WechatExchangeInfo } from '../api/wechatExchange';
import { getSubCategoryIcon } from '../utils/categoryIcons';
import type { User } from '../types';
import type { Post as ApiPost } from '../api/types';

// 评论类型
interface CommentData {
  id: number;
  user_id: number;
  content: string;
  created_at: string;
  author_name: string;
}

const PostDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [messageApi, contextHolder] = message.useMessage();
  const [post, setPost] = useState<ApiPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<CommentData[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // 分页相关状态
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const COMMENTS_PER_PAGE = 20;

  // 交换微信弹窗相关状态
  const [exchangeModalVisible, setExchangeModalVisible] = useState(false);
  const [exchangeTargetUser, setExchangeTargetUser] = useState<{ id: number | string; name: string } | null>(null);
  const [exchangeInfo, setExchangeInfo] = useState<WechatExchangeInfo | null>(null);
  const [exchangeInfoLoading, setExchangeInfoLoading] = useState(false);
  const [exchangeSubmitting, setExchangeSubmitting] = useState(false);
  const [updatingWechat, setUpdatingWechat] = useState(false);

  // 获取当前用户（模拟）
  const getCurrentUser = (): User => {
    const userData = localStorage.getItem('user');
    if (userData) {
      return JSON.parse(userData);
    }
    // 如果没有用户数据，返回默认用户
    return {
      id: 'current-user',
      email: 'user@example.com',
      nickname: '当前用户',
      gender: 'other',
      role: 'user',
      registeredAt: new Date().toISOString(),
      postCount: 0,
      commentCount: 0,
    };
  };

  const currentUser = getCurrentUser();

  // 获取帖子详情
  useEffect(() => {
    const fetchPost = async () => {
      if (!id) {
        setError('帖子ID不存在');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await getPostById(id);
        if (response.success) {
          setPost(response.data);
        } else {
          setError(response.message || '获取帖子失败');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取帖子失败');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  // 获取评论列表（首次加载）
  useEffect(() => {
    const fetchComments = async () => {
      if (!id || !post) return;

      // 检查是否可以查看评论
      const isPostAuthor = currentUser.id?.toString() === post.user_id?.toString();
      const canViewComments = post.comment_visibility !== 'private' || isPostAuthor;

      if (!canViewComments) {
        setComments([]);
        setHasMoreComments(false);
        return;
      }

      try {
        setCommentsLoading(true);
        const response = await getPostComments(id, { page: 1, limit: COMMENTS_PER_PAGE });
        console.log('response', response);
        if (response.success) {
          // 直接使用返回的数据，不进行转换
          setComments(response.data.list as unknown as CommentData[]);

          // 检查是否还有更多评论
          const { pagination } = response.data;
          setHasMoreComments(pagination.page < pagination.pages);
          setCurrentPage(1);
        }
      } catch (err) {
        console.error('获取评论失败:', err);
      } finally {
        setCommentsLoading(false);
      }
    };

    fetchComments();
  }, [id, post, currentUser.id]);

  // 检查当前用户是否是帖子作者
  const isPostAuthor = post ? currentUser.id?.toString() === post.user_id?.toString() : false;

  // 检查是否可以查看评论 - 只有非私有评论或者是帖子作者才能查看
  const canViewComments = post ? (post.comment_visibility !== 'private' || isPostAuthor) : false;
  console.log(post, canViewComments, isPostAuthor);

  // 加载更多评论
  const loadMoreComments = useCallback(async () => {
    if (!id || !post || !hasMoreComments || loadingMore) return;

    const isPostAuthor = currentUser.id?.toString() === post.user_id?.toString();
    const canViewComments = post.comment_visibility !== 'private' || isPostAuthor;

    if (!canViewComments) return;

    try {
      setLoadingMore(true);
      const nextPage = currentPage + 1;
      const response = await getPostComments(id, { page: nextPage, limit: COMMENTS_PER_PAGE });

      if (response.success) {
        // 直接使用返回的数据，追加到现有列表
        setComments(prev => [...prev, ...(response.data.list as unknown as CommentData[])]);

        // 更新分页状态
        const { pagination } = response.data;
        setHasMoreComments(pagination.page < pagination.pages);
        setCurrentPage(nextPage);
      }
    } catch (err) {
      console.error('加载更多评论失败:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [id, post, currentUser.id, hasMoreComments, loadingMore, currentPage]);

  // 页面滚动检测
  useEffect(() => {
    const handleScroll = () => {
      if (!hasMoreComments || loadingMore) return;

      // 检查当前用户是否可以查看评论
      const currentCanViewComments = post ? (post.comment_visibility !== 'private' || (currentUser.id?.toString() === post.user_id?.toString())) : false;
      if (!currentCanViewComments) return;

      // 检查是否滚动到页面底部附近
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // 当滚动到底部附近时（距离底部100px以内）触发加载
      if (scrollTop + windowHeight >= documentHeight - 100) {
        loadMoreComments();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMoreComments, hasMoreComments, loadingMore, post, currentUser.id]);

  // 检查是否可以添加评论 - 所有人都可以添加评论
  const canAddComments = post ? true : false;

  // 处理时间显示
  const getTimeAgo = (date: string) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffHours = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60));

    if (diffHours < 1) return '刚刚';
    if (diffHours < 24) return `${diffHours}小时前`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}天前`;
    return postDate.toLocaleDateString('zh-CN');
  };

  // 发送评论
  const handleSendComment = async () => {
    if (!newComment.trim() || !canAddComments || !post || submitLoading) return;

    try {
      setSubmitLoading(true);
      const response = await createComment({
        post_id: post.id,
        content: newComment,
        // 移除回复相关参数，只支持顶级评论
      });

      if (response.success) {
        // 无论评论是否可见，都要更新评论数量
        setPost(prev => prev ? { ...prev, comment_count: prev.comment_count + 1 } : null);

        if (canViewComments) {
          // 如果可以查看评论，重新获取第一页评论列表（包含新评论）
          const commentsResponse = await getPostComments(post.id.toString(), { page: 1, limit: COMMENTS_PER_PAGE });
          if (commentsResponse.success) {
            // 直接使用返回的数据
            setComments(commentsResponse.data.list as unknown as CommentData[]);

            // 重置分页状态
            const { pagination } = commentsResponse.data;
            setHasMoreComments(pagination.page < pagination.pages);
            setCurrentPage(1);
          }
        }

        // 显示成功消息
        messageApi.success('评论发送成功');
      } else {
        messageApi.error(response.message || '发送评论失败');
      }

    } catch (err) {
      messageApi.error(err instanceof Error ? err.message : '发送评论失败');
    } finally {
      setNewComment('');
      setSubmitLoading(false);
    }
  };


  // 获取帖子作者头像
  const getPostAuthorAvatar = (authorName: string) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=random&color=fff`;
  };

  // 处理头像点击
  const handleAuthorAvatarClick = () => {
    if (!post) return;

    // 如果是当前用户，跳转到个人资料页面
    if (isPostAuthor) {
      navigate('/profile');
    } else {
      // 否则跳转到用户资料页面
      navigate(`/user/${post.user_id}`);
    }
  };

  // 处理评论者头像点击
  const handleCommenterAvatarClick = (commenterUserId: string) => {
    const currentUser = authUtils.getCurrentUser();

    // 如果是当前用户，跳转到个人资料页面
    if (currentUser && currentUser.id?.toString() === commenterUserId) {
      navigate('/profile');
    } else {
      // 否则跳转到用户资料页面
      navigate(`/user/${commenterUserId}`);
    }
  };

  // 检查是否可以发起交换请求（1小时内限制）
  const canInitiateExchange = (targetUserId: number): { allowed: boolean; remainingTime?: number } => {
    const currentUser = authUtils.getCurrentUser();
    if (!currentUser || !currentUser.id) {
      return { allowed: true }; // 如果没有用户信息，允许（实际应该不会发生）
    }

    const currentUserId = currentUser.id.toString();
    const storageKey = `wechat_exchange_${currentUserId}_${targetUserId}`;
    const lastRequestTime = localStorage.getItem(storageKey);

    if (!lastRequestTime) {
      return { allowed: true }; // 没有记录，允许
    }

    const lastTime = parseInt(lastRequestTime, 10);
    const now = Date.now();
    const oneHour = 60 * 60 * 1000; // 1小时的毫秒数
    const timeDiff = now - lastTime;

    if (timeDiff < oneHour) {
      const remainingMs = oneHour - timeDiff;
      const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
      return { allowed: false, remainingTime: remainingMinutes };
    }

    return { allowed: true }; // 超过1小时，允许
  };

  // 记录交换请求时间戳
  const recordExchangeRequest = (targetUserId: number) => {
    const currentUser = authUtils.getCurrentUser();
    if (!currentUser || !currentUser.id) {
      return;
    }

    const currentUserId = currentUser.id.toString();
    const storageKey = `wechat_exchange_${currentUserId}_${targetUserId}`;
    localStorage.setItem(storageKey, Date.now().toString());
  };

  // 获取交换信息
  const fetchExchangeInfo = async (targetUserId: number) => {
    try {
      setExchangeInfoLoading(true);
      const response = await getExchangeInfo(targetUserId);
      if (response.success) {
        setExchangeInfo(response.data);
      } else {
        // 如果没有交换记录，设置为空状态
        setExchangeInfo({
          exists: false,
          status: null,
          waitingFor: undefined
        });
      }
    } catch (err) {
      console.error('获取交换信息失败:', err);
      // 出错时也设置为空状态
      setExchangeInfo({
        exists: false,
        status: null,
        waitingFor: undefined
      });
    } finally {
      setExchangeInfoLoading(false);
    }
  };

  // 处理交换微信按钮点击（帖子作者）
  const handleExchangeWechatWithPostAuthor = async () => {
    if (!post || post.user_id === undefined) return;
    const targetUserId = typeof post.user_id === 'string' ? parseInt(post.user_id) : post.user_id;
    setExchangeTargetUser({
      id: targetUserId,
      name: post.author_name,
    });
    setExchangeModalVisible(true);
    // 打开弹窗时获取交换信息
    await fetchExchangeInfo(targetUserId);
  };

  // 处理交换微信按钮点击（评论者）
  const handleExchangeWechatWithCommenter = async (comment: CommentData) => {
    const targetUserId = typeof comment.user_id === 'string' ? parseInt(comment.user_id) : comment.user_id;
    setExchangeTargetUser({
      id: targetUserId,
      name: comment.author_name,
    });
    setExchangeModalVisible(true);
    // 打开弹窗时获取交换信息
    await fetchExchangeInfo(targetUserId);
  };

  // 确认交换微信
  const handleConfirmExchange = async () => {
    // 检查当前用户是否配置了微信号
    const user = authUtils.getCurrentUser();
    // 检查用户信息中是否有 wechat_id 字段，如果没有或为空，则需要先配置
    const hasWechat = user && user.wechat_id && user.wechat_id.trim() !== '';
    
    if (!hasWechat) {
      // 如果没有配置微信号，跳转到个人信息页
      messageApi.warning('请先配置微信号');
      setExchangeModalVisible(false);
      setExchangeTargetUser(null);
      setExchangeInfo(null);
      navigate('/profile');
      return;
    }

    if (!exchangeTargetUser) return;

    const targetUserId = typeof exchangeTargetUser.id === 'string' 
      ? parseInt(exchangeTargetUser.id) 
      : exchangeTargetUser.id;

    // 检查1小时内是否已经发起过请求
    const { allowed, remainingTime } = canInitiateExchange(targetUserId);
    if (!allowed) {
      messageApi.warning(`您在一个小时内已经向该用户发起过交换请求，请等待 ${remainingTime} 分钟后再试`);
      return;
    }

    try {
      setExchangeSubmitting(true);
      
      // 判断是更新请求还是新请求
      const isUpdate = exchangeInfo?.exists && exchangeInfo.status === 0 && exchangeInfo.waitingFor === 'other';
      
      const response = await createExchangeRequest({
        targetUserId,
        wechatId: user.wechat_id!,
        isUpdate: isUpdate || false
      });

      if (response.success) {
        // 记录请求时间戳
        recordExchangeRequest(targetUserId);
        messageApi.success(isUpdate ? '交换请求已重新发送' : '交换微信请求已发送');
        // 重新获取交换信息
        await fetchExchangeInfo(targetUserId);
      } else {
        messageApi.error(response.message || '发送交换请求失败');
      }
    } catch (err) {
      messageApi.error(err instanceof Error ? err.message : '发送交换请求失败');
    } finally {
      setExchangeSubmitting(false);
    }
  };

  // 确认接受交换
  const handleAcceptExchange = async () => {
    // 检查当前用户是否配置了微信号
    const user = authUtils.getCurrentUser();
    const hasWechat = user && user.wechat_id && user.wechat_id.trim() !== '';
    
    if (!hasWechat) {
      messageApi.warning('请先配置微信号');
      setExchangeModalVisible(false);
      setExchangeTargetUser(null);
      setExchangeInfo(null);
      navigate('/profile');
      return;
    }

    if (!exchangeInfo?.exchangeNo) {
      messageApi.error('交换信息无效');
      return;
    }

    try {
      setExchangeSubmitting(true);
      const response = await confirmExchange({
        exchangeNo: exchangeInfo.exchangeNo,
        wechatId: user.wechat_id!,
        action: 'accept'
      });

      if (response.success) {
        messageApi.success('交换成功');
        // 重新获取交换信息以展示对方微信号
        if (exchangeTargetUser?.id) {
          const targetUserId = typeof exchangeTargetUser.id === 'string' 
            ? parseInt(exchangeTargetUser.id) 
            : exchangeTargetUser.id;
          await fetchExchangeInfo(targetUserId);
        }
      } else {
        messageApi.error(response.message || '确认交换失败');
      }
    } catch (err) {
      messageApi.error(err instanceof Error ? err.message : '确认交换失败');
    } finally {
      setExchangeSubmitting(false);
    }
  };

  // 取消交换微信
  const handleCancelExchange = () => {
    setExchangeModalVisible(false);
    setExchangeTargetUser(null);
    setExchangeInfo(null);
  };

  // 跳转到个人信息页管理微信号
  const handleManageWechat = () => {
    setExchangeModalVisible(false);
    setExchangeTargetUser(null);
    setExchangeInfo(null);
    navigate('/profile');
  };

  // 更新微信
  const handleUpdateWechat = async () => {
    if (!exchangeTargetUser) return;

    const targetUserId = typeof exchangeTargetUser.id === 'string' 
      ? parseInt(exchangeTargetUser.id) 
      : exchangeTargetUser.id;

    // 检查1小时内是否已经发起过请求
    const { allowed, remainingTime } = canInitiateExchange(targetUserId);
    if (!allowed) {
      messageApi.warning(`您在一个小时内已经向该用户发起过交换请求，请等待 ${remainingTime} 分钟后再试`);
      return;
    }

    try {
      setUpdatingWechat(true);
      const response = await updateWechat({ targetUserId });

      if (response.success && response.data) {
        // 记录请求时间戳
        recordExchangeRequest(targetUserId);
        // 更新交换信息中的微信号
        setExchangeInfo(prev => prev ? {
          ...prev,
          otherWechat: response.data!.otherWechat
        } : null);
        messageApi.success('微信更新成功');
      } else {
        messageApi.error(response.message || '更新微信失败');
      }
    } catch (err) {
      messageApi.error(err instanceof Error ? err.message : '更新微信失败');
    } finally {
      setUpdatingWechat(false);
    }
  };

  // 渲染单个评论
  const renderComment = (comment: CommentData) => (
    <div key={comment.id} className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex space-x-4">
        <img
          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author_name)}&background=random&color=fff`}
          alt={comment.author_name}
          className="w-12 h-12 rounded-full flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity shadow-sm"
          onClick={() => handleCommenterAvatarClick(comment.user_id.toString())}
        />
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="font-semibold text-gray-900 text-lg">{comment.author_name}</span>
            {post && comment.user_id.toString() === post.user_id?.toString() && (
              <span className="w-5 h-5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
            )}
          </div>
          <p className="text-gray-900 text-base leading-relaxed mb-3">
            {comment.content}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{getTimeAgo(comment.created_at)}</span>
            </div>
            {currentUser.id?.toString() !== comment.user_id.toString() && (
              <button
                onClick={() => handleExchangeWechatWithCommenter(comment)}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-green-50 to-green-50 hover:from-green-100 hover:to-green-100 text-green-600 transition-colors ml-auto"
              >
                <MessageCircleMore className="h-4 w-4" />
                <span className="font-medium text-sm">交换微信</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );

  // 加载状态
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg font-medium">加载中...</p>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error || !post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-r from-red-200 to-pink-200 flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">😞</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-3">出错了</h3>
          <p className="text-red-600 mb-8 text-lg">{error || '帖子不存在'}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {contextHolder}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">

        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* 帖子内容 */}
          <div className="bg-white rounded-2xl shadow-sm">
            {/* 用户信息 */}
            <div className="flex items-center justify-between p-6 pb-4">
              <div className="flex items-center space-x-4">
                <img
                  src={getPostAuthorAvatar(post.author_name)}
                  alt={post.author_name}
                  className="w-14 h-14 rounded-full cursor-pointer hover:opacity-80 transition-opacity shadow-sm"
                  onClick={handleAuthorAvatarClick}
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-gray-900 text-lg">{post.author_name}</span>
                  </div>
                  <span className="text-sm text-gray-500">{getTimeAgo(post.created_at)}</span>
                </div>
              </div>
              <button className="min-w-20 inline-flex items-center gap-1 sm:gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 shadow-lg px-3 py-1 rounded-full text-sm mb-4">
                <span className="text-lg">{getSubCategoryIcon(post.subcategory_name)}</span>
                <span>{post.subcategory_name}</span>
              </button>
            </div>

            {/* 帖子内容 */}
            <div className="px-6 pb-4">
              <p className="text-gray-900 text-lg leading-relaxed">
                {post.content}
              </p>
            </div>

            {/* 位置信息 */}
            {post.location && (
              <div className="px-6 pb-4">
                <div className="flex items-center space-x-2 text-gray-600">
                  <MapPinIcon className="w-4 h-4" />
                  <span className="text-sm font-medium max-w-[90%] truncate">{post.location}</span>
                </div>
              </div>
            )}

            {/* 互动区域 */}
            <div className="border-t border-gray-100 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-gray-600">
                  <ChatBubbleLeftIcon className="w-5 h-5" />
                  <span className="text-sm font-medium">{post.comment_count} 条评论</span>
                  {post.comment_visibility === 'private' && (
                    <EyeSlashIcon className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                {!isPostAuthor && (
                  <button
                    onClick={handleExchangeWechatWithPostAuthor}
                    className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-green-50 to-green-50 hover:from-green-100 hover:to-green-100 text-green-600 transition-colors ml-auto"
                  >
                    <MessageCircleMore className="h-4 w-4" />
                    <span className="font-medium text-sm">交换微信</span>
                  </button>
                )}
              </div>
            </div>
          </div>


          {/* 评论区域 */}
          {canViewComments && (
            <div className="mt-8">
              <div className="text-start mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  评论 ({post?.comment_count || 0})
                </h3>
              </div>

              {/* 评论加载状态 */}
              {commentsLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">加载评论中...</p>
                </div>
              ) : (
                // 评论列表
                <div className="space-y-6">
                  {comments.map(comment => renderComment(comment))}

                  {/* 空状态 */}
                  {comments.length === 0 && !loadingMore && (
                    <div className="text-center py-8">
                      <div className="w-24 h-24 rounded-3xl bg-gradient-to-r from-slate-200 to-slate-300 flex items-center justify-center mx-auto mb-6">
                        <span className="text-4xl">💬</span>
                      </div>
                      <h3 className="text-2xl font-bold text-slate-800 mb-3">还没有评论</h3>
                      <p className="text-slate-600 mb-8 max-w-md mx-auto">
                        来发表第一条评论，开始讨论吧！
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 私有评论提示区域 - 当评论私有且用户不是作者时显示 */}
          {post.comment_visibility === 'private' && !isPostAuthor && canAddComments && (
            <div className="mt-6">
              <div className="text-center py-16">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-r from-blue-200 to-purple-200 flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">🔒</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-3">评论仅作者可见</h3>
                <p className="text-slate-600 mb-8 max-w-md mx-auto">
                  你的评论将直接发送给作者
                </p>
              </div>
            </div>
          )}

          {/* 评论输入框 */}
          {canAddComments && (
            <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 p-6">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center space-x-4">
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.nickname)}&background=random&color=fff`}
                    alt={currentUser.nickname}
                    className="w-10 h-10 rounded-full flex-shrink-0 shadow-sm"
                  />
                  <div className="flex-1 flex items-center space-x-3">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="写下你的评论，参与讨论..."
                      className="flex-1 bg-gray-100 rounded-2xl px-6 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm"
                      onKeyPress={(e) => e.key === 'Enter' && !submitLoading && handleSendComment()}
                      disabled={submitLoading}
                    />
                    <button
                      onClick={handleSendComment}
                      disabled={!newComment.trim() || submitLoading}
                      className="p-3 text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl hover:from-blue-700 hover:to-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      {submitLoading ? (
                        <div className="w-5 h-5 animate-spin border-b-2 border-white rounded-full"></div>
                      ) : (
                        <PaperAirplaneIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 加载更多评论的状态显示在页面底部 */}
          {canViewComments && loadingMore && (
            <div className="mt-6 mb-4">
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">加载更多评论...</p>
              </div>
            </div>
          )}

          {/* 没有更多评论的提示 */}
          {canViewComments && !hasMoreComments && comments.length > 0 && !loadingMore && (
            <div className="mt-6 mb-4">
              <div className="text-center py-6 text-gray-500–">
                <span className="text-sm font-medium">没有更多评论了</span>
              </div>
            </div>
          )}

          {/* 底部占位空间 */}
          <div className="h-20"></div>
        </div>
      </div>

      {/* 交换微信确认弹窗 */}
      <Modal
        open={exchangeModalVisible}
        onCancel={handleCancelExchange}
        centered
        width={400}
        footer={null}
        styles={{
          content: {
            borderRadius: '16px',
            padding: '24px',
          },
        }}
      >
        <div className="py-4">
          {exchangeInfoLoading ? (
            // 加载状态
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">加载中...</p>
            </div>
          ) : exchangeInfo?.exists && exchangeInfo.status === 1 ? (
            // 已经交换成功，显示对方的微信号
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                交换成功
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 mb-2">对方的微信号：</p>
                <p className="text-lg font-semibold text-gray-900">{exchangeInfo.otherWechat || '未设置'}</p>
              </div>
              <p className="text-gray-500 text-xs text-center mb-6">
                双方确认交换后，可以在通知里看到对方的微信号。
                <button
                  onClick={handleManageWechat}
                  className="text-blue-600 hover:text-blue-700 underline ml-1 transition-colors"
                >
                  您可前往管理微信号
                </button>
              </p>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={handleUpdateWechat}
                  disabled={updatingWechat}
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-all duration-300 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updatingWechat ? '更新中...' : '更新微信'}
                </button>
              </div>
            </div>
          ) : exchangeInfo?.exists && exchangeInfo.status === 0 && exchangeInfo.waitingFor === 'me' ? (
            // 等待我确认
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                确认交换微信
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed text-center mb-6">
                {exchangeTargetUser?.name} 请求与您交换微信。
                <br />
                确认后，双方将互相看到对方的微信号。
              </p>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={handleCancelExchange}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  取消
                </button>
                <button
                  onClick={handleAcceptExchange}
                  disabled={exchangeSubmitting}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-300 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {exchangeSubmitting ? '处理中...' : '确认交换'}
                </button>
              </div>
            </div>
          ) : exchangeInfo?.exists && exchangeInfo.status === 0 && exchangeInfo.waitingFor === 'other' ? (
            // 等待对方确认，可以重新发送
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                等待对方确认
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed text-center mb-6">
                您已向 {exchangeTargetUser?.name} 发送交换微信请求，等待对方确认。
                <br />
              </p>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={handleCancelExchange}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmExchange}
                  disabled={exchangeSubmitting}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-300 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {exchangeSubmitting ? '发送中...' : '重新发送'}
                </button>
              </div>
            </div>
          ) : (
            // 未交换过，显示初始状态
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                确定与{exchangeTargetUser?.name ? ` ${exchangeTargetUser.name} ` : '对方'}交换微信吗？
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed text-center mb-6">
                双方确认交换后，可以在通知里看到对方的微信号。
                <button
                  onClick={handleManageWechat}
                  className="text-blue-600 hover:text-blue-700 underline ml-1 transition-colors"
                >
                  您可前往管理微信号
                </button>
              </p>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={handleCancelExchange}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmExchange}
                  disabled={exchangeSubmitting}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-300 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {exchangeSubmitting ? '发送中...' : '确定'}
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

export default PostDetailPage; 