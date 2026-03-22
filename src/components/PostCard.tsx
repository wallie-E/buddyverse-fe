import { useState } from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';
import { UserRound, MessageCircle, Copy, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { message, Modal } from 'antd';
import { authUtils } from '../api';
import { viewWechat } from '../api/wechatExchange';
import type { Post } from '../api/types';
import { redirectToLoginIfNeeded } from '../utils/auth';

interface PostCardProps {
  post: Post;
}

// Deterministic color palette for tag badges
const TAG_PALETTE = [
  { bg: 'rgba(143,245,255,0.12)', color: '#8ff5ff' },   // cyan
  { bg: 'rgba(213,117,255,0.12)', color: '#d575ff' },   // purple
  { bg: 'rgba(170,255,220,0.12)', color: '#aaffdc' },   // teal
  { bg: 'rgba(255,143,171,0.12)', color: '#ff8fab' },   // pink
  { bg: 'rgba(255,179,71,0.12)',  color: '#ffb347' },   // amber
  { bg: 'rgba(135,206,235,0.12)', color: '#87ceeb' },   // sky
];

const hashColor = (name: string, offset = 0) => {
  let h = offset;
  for (let i = 0; i < name.length; i++) h += name.charCodeAt(i);
  return TAG_PALETTE[h % TAG_PALETTE.length];
};

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
    if (days > 0) return `${days}天前`;
    if (hours > 0) return `${hours}小时前`;
    if (minutes > 0) return `${minutes}分钟前`;
    return '刚刚';
  };

  const handleClick = () => {
    navigate(`/post/${post.id}`);
  };

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentUser = authUtils.getCurrentUser();
    if (currentUser && currentUser.id?.toString() === post.user_id?.toString()) {
      navigate('/profile');
    } else {
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
    } catch {
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
    } catch {
      message.error('复制失败');
    }
  };

  const categoryColor = hashColor(post.category_name || '', 0);
  const subCategoryColor = hashColor(post.subcategory_name || '', 3);

  return (
    <div
      className="group overflow-hidden cursor-pointer transition-all duration-200"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      style={{
        backgroundColor: '#1c1b1e',
        borderRadius: '1.25rem',
        border: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(143,245,255,0.04)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.border = '1px solid rgba(143,245,255,0.12)';
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px rgba(143,245,255,0.06), inset 0 1px 0 rgba(143,245,255,0.06)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.border = '1px solid rgba(255,255,255,0.05)';
        e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(143,245,255,0.04)';
      }}
    >
      <div className="p-6 sm:p-7">
        {/* Header row: avatar + name + tags */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div
              className="h-11 w-11 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0 cursor-pointer transition-opacity hover:opacity-80"
              style={{
                background: `linear-gradient(135deg, ${categoryColor.bg.replace('0.12', '0.4')}, ${subCategoryColor.bg.replace('0.12', '0.4')})`,
                color: categoryColor.color,
                border: `1px solid ${categoryColor.bg}`,
              }}
              onClick={handleAvatarClick}
            >
              {post?.author_name?.charAt(0)}
            </div>

            {/* Name + meta */}
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm" style={{ color: '#e0e0e3' }}>
                  {post.author_name}
                </span>
                {post.author_gender && (
                  <UserRound
                    className="h-3.5 w-3.5"
                    style={{
                      color: post.author_gender === 'male'
                        ? '#60a5fa'
                        : post.author_gender === 'female'
                        ? '#f472b6'
                        : '#6e6e73',
                    }}
                    strokeWidth={2}
                  />
                )}
              </div>
              <div className="text-xs mt-0.5" style={{ color: '#6e6e73' }}>
                {formatDate(post.created_at)}
              </div>
            </div>
          </div>

          {/* Tag badges */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {post.category_name && (
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full tracking-wide uppercase"
                style={{ backgroundColor: categoryColor.bg, color: categoryColor.color }}
              >
                {post.category_name.replace('搭子', '')}
              </span>
            )}
            {post.subcategory_name && (
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full tracking-wide"
                style={{ backgroundColor: subCategoryColor.bg, color: subCategoryColor.color }}
              >
                {post.subcategory_name}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <p
          className="text-sm leading-relaxed line-clamp-5 mb-5"
          style={{ color: '#c4c4c8' }}
        >
          {post.content}
        </p>

        {/* Footer */}
        <div
          className="flex items-center justify-between pt-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="flex items-center gap-1.5 text-xs" style={{ color: '#6e6e73' }}>
            <MapPinIcon className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="font-medium max-w-40 sm:max-w-80 truncate">
              {post.location || '未设置位置'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleViewWechat}
            disabled={viewingWechat}
            className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all duration-200 disabled:opacity-50 active:scale-95"
            style={{
              backgroundColor: 'rgba(143,245,255,0.08)',
              color: '#8ff5ff',
              border: '1px solid rgba(143,245,255,0.15)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'rgba(143,245,255,0.14)';
              e.currentTarget.style.border = '1px solid rgba(143,245,255,0.25)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'rgba(143,245,255,0.08)';
              e.currentTarget.style.border = '1px solid rgba(143,245,255,0.15)';
            }}
          >
            <MessageCircle className="h-3.5 w-3.5" strokeWidth={2} />
            {viewingWechat ? '查看中...' : '查看微信'}
          </button>
        </div>
      </div>

      {/* WeChat modal */}
      <Modal
        title="微信号"
        open={wechatModalOpen}
        onCancel={() => setWechatModalOpen(false)}
        footer={null}
        centered
        destroyOnHidden
      >
        {wechatIdInModal && (
          <div
            className="flex items-center justify-between gap-4 py-3 px-4 mt-2 rounded-xl"
            style={{
              backgroundColor: 'rgba(143,245,255,0.06)',
              border: '1px solid rgba(143,245,255,0.12)',
            }}
          >
            <span className="font-semibold text-base truncate" style={{ color: '#8ff5ff' }}>
              {wechatIdInModal}
            </span>
            <button
              type="button"
              onClick={handleCopyWechat}
              className="flex-shrink-0 p-2 rounded-lg transition-colors"
              style={{ color: '#8ff5ff' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(143,245,255,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              title="复制微信号"
            >
              {copied ? (
                <Check className="h-5 w-5" />
              ) : (
                <Copy className="h-5 w-5" />
              )}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
