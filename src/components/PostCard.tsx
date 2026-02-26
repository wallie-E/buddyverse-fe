import { useState } from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';
import { UserRound, Copy, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { message, Modal } from 'antd';
import { authUtils } from '../api';
import { viewWechat } from '../api/wechatExchange';
import type { Post } from '../api/types';
import { getSubCategoryIcon } from '../utils/categoryIcons';
import { redirectToLoginIfNeeded } from '../utils/auth';

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const navigate = useNavigate();
  const [viewingWechat, setViewingWechat] = useState(false);
  const [wechatModalOpen, setWechatModalOpen] = useState(false);
  const [wechatIdInModal, setWechatIdInModal] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}天前`;
    } else if (hours > 0) {
      return `${hours}小时前`;
    } else if (minutes > 0) {
      return `${minutes}分钟前`;
    } else {
      return '刚刚';
    }
  };

  const handleClick = () => {
    navigate(`/post/${post.id}`);
  };

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentUser = authUtils.getCurrentUser();
    
    // 如果是当前用户，跳转到个人资料页面
    if (currentUser && currentUser.id?.toString() === post.user_id?.toString()) {
      navigate('/profile');
    } else {
      // 否则跳转到用户资料页面
      navigate(`/user/${post.user_id}`);
    }
  };

  const handleViewWechat = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (redirectToLoginIfNeeded(navigate)) return;
    if (post.user_id == null) {
      message.error('该用户账号异常，无法查看微信号');
      return;
    }
    setViewingWechat(true);
    try {
      const res = await viewWechat(Number(post.user_id));
      if (res.success && res.data?.wechatId) {
        setWechatIdInModal(res.data.wechatId);
        setWechatModalOpen(true);
        setCopied(false);
      } else {
        message.error('该用户账号异常，无法查看微信号');
      }
    } catch (err) {
      message.error('该用户账号异常，无法查看微信号');
    } finally {
      setViewingWechat(false);
    }
  };

  const handleCopyWechat = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!wechatIdInModal) return;
    try {
      await navigator.clipboard.writeText(wechatIdInModal);
      setCopied(true);
      message.success('微信号已复制');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      message.error('复制失败');
    }
  };

  return (
    <div 
      className="group shadow-[0_20px_40px_-12px_rgba(0,0,0,0.06)] border border-slate-100 bg-white rounded-[2rem] overflow-hidden"
    >
      <div className="p-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div 
                className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold text-lg cursor-pointer hover:bg-slate-200 transition-colors"
                onClick={handleAvatarClick}
              >
                {post?.author_name?.charAt(0)}
              </div>
              {/* 可以添加认证标识，暂时注释 */}
              {/* {post.user.verified && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )} */}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-900 font-sans">{post.author_name}</span>
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
              <div className="flex items-center gap-2 text-sm text-slate-400 mt-0.5 font-normal font-sans">
                {formatDate(post.created_at)}
              </div>
            </div>
          </div>
          {post.subcategory_name && (
            <span className="inline-flex items-center gap-1.5 bg-slate-50 text-slate-600 px-3 py-1 rounded-full text-xs font-medium tracking-wide ring-1 ring-slate-100 font-sans">
              <span>{getSubCategoryIcon(post.subcategory_name)}</span>
              <span>{post.subcategory_name}</span>
            </span>
          )}
        </div>
        <div className="mb-6">
          <p className="text-slate-800 text-[1.05rem] leading-loose font-normal line-clamp-6 font-sans break-words">
            {post.content}
          </p>
        </div>
        <div className="flex items-center justify-between pt-6 border-t border-slate-50">
          <div className="flex items-center gap-2 text-sm text-slate-500 font-sans">
            <MapPinIcon className="h-4 w-4" />
            <span className="font-medium max-w-52 sm:max-w-100 truncate">{post.location || '未设置位置'}</span>
          </div>
          <button
            type="button"
            onClick={handleViewWechat}
            disabled={viewingWechat}
            className="flex items-center gap-1.5 text-slate-500 text-sm font-sans px-2 py-1 rounded-full bg-slate-50 border border-slate-100 disabled:opacity-60 cursor-pointer"
          >
            {viewingWechat ? '查看中...' : '查看微信'}
          </button>
        </div>
      </div>

      {/* 微信号弹窗 */}
      <Modal
        title="微信号"
        open={wechatModalOpen}
        onCancel={() => setWechatModalOpen(false)}
        footer={null}
        centered
        destroyOnHidden
      >
        {wechatIdInModal && (
          <div className="flex items-center justify-between gap-4 py-2 px-4 mt-2 rounded-xl bg-green-50 border border-green-100">
            <span className="text-green-700 font-medium text-lg font-sans truncate">{wechatIdInModal}</span>
            <button
              type="button"
              onClick={handleCopyWechat}
              className="flex-shrink-0 p-2 hover:bg-green-100 rounded-lg transition-colors"
              title="复制微信号"
            >
              {copied ? (
                <Check className="h-5 w-5 text-green-600" />
              ) : (
                <Copy className="h-5 w-5 text-green-600" />
              )}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
} 