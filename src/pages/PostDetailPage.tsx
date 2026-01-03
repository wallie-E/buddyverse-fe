import { useState, useEffect, useCallback } from 'react';
import { ChatBubbleLeftIcon, PaperAirplaneIcon, MapPinIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useNavigate, useParams } from 'react-router-dom';
import { message, Modal } from 'antd';
import { MessageCircleMore, UserRound } from 'lucide-react';
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
  author_gender?: 'male' | 'female' | 'other';
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
  const [commentsTotal, setCommentsTotal] = useState(0);
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
          setCommentsTotal(response.data.comment_count);
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
        } else {
          // 如果请求失败，设置 hasMoreComments 为 false 阻止后续加载
          setHasMoreComments(false);
          setComments([]);
        }
      } catch (err) {
        console.error('获取评论失败:', err);
        // 出错时设置 hasMoreComments 为 false 阻止后续加载
        setHasMoreComments(false);
        setComments([]);
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
      } else {
        // 如果请求失败，设置 hasMoreComments 为 false 阻止后续加载
        setHasMoreComments(false);
      }
    } catch (err) {
      console.error('加载更多评论失败:', err);
      // 出错时设置 hasMoreComments 为 false 阻止后续加载
      setHasMoreComments(false);
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

  // 检查是否可以添加评论 - 所有人都可以添加评论，但评论总数达到20时不能添加
  const canAddComments = post ? (commentsTotal < 20) : false;
  console.log('canAddComments', canAddComments, commentsTotal);

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
    if (!newComment.trim() || !post || submitLoading) return;

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
      // 如果没有配置微信号，提示用户
      messageApi.warning('请前往个人页面设置微信号');
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
        isUpdate: isUpdate || false,
        subcategoryName: post?.subcategory_name || '',
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
      messageApi.warning('请前往个人页面设置微信号');
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
    <div key={comment.id} className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.04)]">
      <div className="flex gap-4">
        <div 
          className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-medium text-lg flex-shrink-0 cursor-pointer hover:bg-slate-200 transition-colors"
          onClick={() => handleCommenterAvatarClick(comment.user_id.toString())}
        >
          {comment?.author_name?.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <span className="font-medium text-slate-900 text-base font-sans">{comment.author_name}</span>
            {comment.author_gender && (
              <UserRound 
                className={`h-4 w-4 ${
                  comment.author_gender === 'male' 
                    ? 'text-blue-500' 
                    : comment.author_gender === 'female' 
                    ? 'text-pink-500' 
                    : 'text-slate-400'
                }`}
                strokeWidth={2}
              />
            )}
            {post && comment.user_id.toString() === post.user_id?.toString() && (
              <span className="w-5 h-5 bg-slate-800 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
            )}
          </div>
          <p className="text-slate-600 text-base leading-loose mb-4 font-sans break-words" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
            {comment.content}
          </p>
          <div className="flex items-center justify-between pt-4 border-t border-slate-50">
            <span className="text-sm text-slate-400 font-normal font-sans">{getTimeAgo(comment.created_at)}</span>
            {currentUser.id?.toString() !== comment.user_id.toString() && (
              <button
                onClick={() => handleExchangeWechatWithCommenter(comment)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-600 hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:scale-[1.02] hover:border-slate-300 transition-all duration-300 font-medium text-sm font-sans"
              >
                <MessageCircleMore className="h-4 w-4" />
                <span>交换微信</span>
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
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-400 mx-auto mb-6"></div>
          <p className="text-slate-500 text-base font-medium font-sans">加载中...</p>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error || !post) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 rounded-[2rem] bg-slate-100 flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">😞</span>
          </div>
          <h3 className="text-2xl font-medium text-slate-800 mb-3 font-sans">出错了</h3>
          <p className="text-slate-500 mb-8 text-base leading-relaxed font-sans">{error || '帖子不存在'}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-white border border-slate-200 text-slate-700 px-8 py-3 rounded-full hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] hover:scale-[1.02] hover:border-slate-300 transition-all duration-300 font-medium font-sans"
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
      <div className="min-h-screen bg-slate-50/50">

        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* 帖子内容 */}
          <div className="bg-white border border-slate-100 rounded-[2rem] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.04)] overflow-hidden">
            {/* 用户信息 */}
            <div className="flex items-center justify-between p-8 pb-6">
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-medium text-lg cursor-pointer hover:bg-slate-200 transition-colors"
                  onClick={handleAuthorAvatarClick}
                >
                  {post?.author_name?.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900 text-base font-sans">{post.author_name}</span>
                    {post.author_gender && (
                      <UserRound 
                        className={`h-4 w-4 ${
                          post.author_gender === 'male' 
                            ? 'text-blue-500' 
                            : post.author_gender === 'female' 
                            ? 'text-pink-500' 
                            : 'text-slate-400'
                        }`}
                        strokeWidth={2}
                      />
                    )}
                  </div>
                  <span className="text-sm text-slate-400 font-normal font-sans">{getTimeAgo(post.created_at)}</span>
                </div>
              </div>
              {post.subcategory_name && (
                <span className="inline-flex items-center gap-1.5 bg-slate-50 text-slate-600 px-3 py-1 rounded-full text-xs font-medium tracking-wide ring-1 ring-slate-100 font-sans">
                  <span>{getSubCategoryIcon(post.subcategory_name)}</span>
                  <span>{post.subcategory_name}</span>
                </span>
              )}
            </div>

            {/* 帖子内容 */}
            <div className="px-8 pb-6">
              <p className="text-slate-700 text-[1.05rem] leading-loose font-normal font-sans">
                {post.content}
              </p>
            </div>

            {/* 位置信息 */}
            {post.location && (
              <div className="px-8 pb-6">
                <div className="flex items-center gap-2 text-slate-400">
                  <MapPinIcon className="w-4 h-4" />
                  <span className="text-sm font-medium max-w-[90%] truncate font-sans">{post.location}</span>
                </div>
              </div>
            )}

            {/* 互动区域 */}
            <div className="border-t border-slate-50 px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400 font-sans">
                  <ChatBubbleLeftIcon className="w-5 h-5" />
                  <span className="text-sm font-medium">{post.comment_count}</span>
                  {post.comment_visibility === 'private' && (
                    <EyeSlashIcon className="w-4 h-4 ml-1" />
                  )}
                </div>
                {!isPostAuthor && (
                  <button
                    onClick={handleExchangeWechatWithPostAuthor}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-600 hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:scale-[1.02] hover:border-slate-300 transition-all duration-300 font-medium text-sm font-sans"
                  >
                    <MessageCircleMore className="h-4 w-4" />
                    <span>交换微信</span>
                  </button>
                )}
              </div>
            </div>
          </div>


          {/* 评论区域 */}
          {canViewComments && (
            <div className="mt-10">
              <div className="text-start mb-8">
                <h3 className="text-lg font-medium text-slate-800 font-sans">
                  评论 ({post?.comment_count || 0})
                </h3>
              </div>

              {/* 评论加载状态 */}
              {commentsLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400 mx-auto mb-4"></div>
                  <p className="text-slate-500 font-sans">加载评论中...</p>
                </div>
              ) : (
                // 评论列表
                <div className="space-y-6">
                  {comments.map(comment => renderComment(comment))}

                  {/* 空状态 */}
                  {comments.length === 0 && !loadingMore && (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 rounded-[2rem] bg-slate-100 flex items-center justify-center mx-auto mb-6">
                        <span className="text-4xl">💬</span>
                      </div>
                      <h3 className="text-xl font-medium text-slate-800 mb-3 font-sans">还没有评论</h3>
                      <p className="text-slate-500 mb-8 max-w-md mx-auto leading-relaxed font-sans">
                        来发表第一条评论，开始讨论吧！
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 私有评论提示区域 - 当评论私有且用户不是作者时显示 */}
          {post.comment_visibility === 'private' && !isPostAuthor && (
            <div className="mt-10">
              <div className="text-center py-16">
                <div className="w-20 h-20 rounded-[2rem] bg-slate-100 flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">🔒</span>
                </div>
                <h3 className="text-xl font-medium text-slate-800 mb-3 font-sans">评论仅作者可见</h3>
                <p className="text-slate-500 mb-8 max-w-md mx-auto leading-relaxed font-sans">
                  你的评论将直接发送给作者
                </p>
              </div>
            </div>
          )}

          {/* 评论输入框 */}
          {canAddComments && (
            <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-100 p-6">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4">
                  <div className="flex-1 flex items-center gap-3">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="写下你的评论，参与讨论..."
                      className="flex-1 bg-white rounded-full px-6 py-3 text-base border-0 ring-1 ring-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] focus:ring-1 focus:ring-slate-100 focus:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] focus:outline-none transition-all duration-200 placeholder:text-slate-400 text-slate-600 caret-slate-600 font-sans"
                      onKeyPress={(e) => e.key === 'Enter' && !submitLoading && handleSendComment()}
                      disabled={submitLoading}
                    />
                    <button
                      onClick={handleSendComment}
                      disabled={!newComment.trim() || submitLoading}
                      className="p-3 text-white bg-slate-900 rounded-full hover:bg-slate-800 hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 disabled:bg-slate-300 disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all duration-300"
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

          {/* 评论达到上限提示 */}
          {!canAddComments && (
            <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-100 p-6 py-4">
              <div className="max-w-4xl mx-auto">
                <div className="text-center py-1">
                  <p className="text-slate-500 text-sm font-medium font-sans">帖子下最多只能有20条评论</p>
                </div>
              </div>
            </div>
          )}

          {/* 加载更多评论的状态显示在页面底部 */}
          {canViewComments && loadingMore && (
            <div className="mt-8 mb-4">
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-400 mx-auto mb-3"></div>
                <p className="text-slate-500 text-sm font-medium font-sans">加载更多评论...</p>
              </div>
            </div>
          )}

          {/* 没有更多评论的提示 */}
          {canViewComments && !hasMoreComments && comments.length > 0 && !loadingMore && (
            <div className="mt-8 mb-4">
              <div className="text-center py-6">
                <span className="text-sm font-medium text-slate-400 font-sans">没有更多评论了</span>
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
            borderRadius: '2rem',
            padding: '32px',
          },
        }}
      >
        <div className="py-2">
          {exchangeInfoLoading ? (
            // 加载状态
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400 mx-auto mb-4"></div>
              <p className="text-slate-500 font-sans">加载中...</p>
            </div>
          ) : exchangeInfo?.exists && exchangeInfo.status === 1 ? (
            // 已经交换成功，显示对方的微信号
            <div>
              <h3 className="text-xl font-medium text-slate-800 mb-6 text-center font-sans">
                交换成功
              </h3>
              <div className="bg-slate-50 rounded-2xl p-5 mb-6 ring-1 ring-slate-100">
                <p className="text-sm text-slate-500 mb-2 font-sans">对方的微信号：</p>
                <p className="text-lg font-medium text-slate-800 font-sans">{exchangeInfo.otherWechat || '未设置'}</p>
              </div>
              <p className="text-slate-400 text-xs text-center mb-6 leading-relaxed font-sans">
                双方确认交换后，可以在通知里看到对方的微信号。
                <button
                  onClick={handleManageWechat}
                  className="text-slate-600 hover:text-slate-800 underline ml-1 transition-colors font-sans"
                >
                  您可前往管理微信号
                </button>
              </p>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={handleUpdateWechat}
                  disabled={updatingWechat}
                  className="px-6 py-2.5 bg-slate-900 text-white rounded-full hover:bg-slate-800 hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-all duration-300 font-medium font-sans disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {updatingWechat ? '更新中...' : '更新微信'}
                </button>
              </div>
            </div>
          ) : exchangeInfo?.exists && exchangeInfo.status === 0 && exchangeInfo.waitingFor === 'me' ? (
            // 等待我确认
            <div>
              <h3 className="text-xl font-medium text-slate-800 mb-6 text-center font-sans">
                确认交换微信
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed text-center mb-8 font-sans">
                {exchangeTargetUser?.name} 请求与您交换微信。
                <br />
                确认后，双方将互相看到对方的微信号。
              </p>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={handleCancelExchange}
                  className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-full hover:bg-slate-50 hover:shadow-sm transition-all duration-300 font-medium font-sans"
                >
                  取消
                </button>
                <button
                  onClick={handleAcceptExchange}
                  disabled={exchangeSubmitting}
                  className="px-6 py-2.5 bg-slate-900 text-white rounded-full hover:bg-slate-800 hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-all duration-300 font-medium font-sans disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {exchangeSubmitting ? '处理中...' : '确认交换'}
                </button>
              </div>
            </div>
          ) : exchangeInfo?.exists && exchangeInfo.status === 0 && exchangeInfo.waitingFor === 'other' ? (
            // 等待对方确认，可以重新发送
            <div>
              <h3 className="text-xl font-medium text-slate-800 mb-6 text-center font-sans">
                等待对方确认
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed text-center mb-8 font-sans">
                您已向 {exchangeTargetUser?.name} 发送交换微信请求，等待对方确认。
              </p>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={handleCancelExchange}
                  className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-full hover:bg-slate-50 hover:shadow-sm transition-all duration-300 font-medium font-sans"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmExchange}
                  disabled={exchangeSubmitting}
                  className="px-6 py-2.5 bg-slate-900 text-white rounded-full hover:bg-slate-800 hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-all duration-300 font-medium font-sans disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {exchangeSubmitting ? '发送中...' : '重新发送'}
                </button>
              </div>
            </div>
          ) : (
            // 未交换过，显示初始状态
            <div>
              <h3 className="text-xl font-medium text-slate-800 mb-6 text-center font-sans">
                确定与{exchangeTargetUser?.name ? ` ${exchangeTargetUser.name} ` : '对方'}交换微信吗？
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed text-center mb-8 font-sans">
                双方确认交换后，可以在通知里看到对方的微信号。
                <button
                  onClick={handleManageWechat}
                  className="text-slate-600 hover:text-slate-800 underline ml-1 transition-colors font-sans"
                >
                  您可前往管理微信号
                </button>
              </p>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={handleCancelExchange}
                  className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-full hover:bg-slate-50 hover:shadow-sm transition-all duration-300 font-medium font-sans"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmExchange}
                  disabled={exchangeSubmitting}
                  className="px-6 py-2.5 bg-slate-900 text-white rounded-full hover:bg-slate-800 hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-all duration-300 font-medium font-sans disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
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