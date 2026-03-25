import { useState } from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';
import { UserRound, MessageCircle, Copy, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { message, Modal, Popover } from 'antd';
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
  const [copiedLocation, setCopiedLocation] = useState(false);

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

  const handleCopyLocation = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!post.location) return;
    try {
      await navigator.clipboard.writeText(post.location);
      setCopiedLocation(true);
      setTimeout(() => setCopiedLocation(false), 2000);
    } catch {
      message.error('复制失败');
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
      className="group overflow-hidden transition-all duration-200"
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
          className="text-sm leading-relaxed mb-5 whitespace-pre-wrap break-words"
          style={{ color: '#c4c4c8' }}
        >
          {post.content}
        </p>

        {/* Footer */}
        <div
          className="flex items-center justify-between pt-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          <Popover
            trigger={post.location ? 'click' : []}
            placement="topLeft"
            arrow={false}
            overlayStyle={{ paddingBottom: 6 }}
            overlayInnerStyle={{
              backgroundColor: '#1c1b1e',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '0.875rem',
              padding: '0.875rem 1rem',
              boxShadow: '0 12px 40px rgba(0,0,0,0.55)',
            }}
            content={
              <div style={{ minWidth: 180, maxWidth: 260 }} onClick={e => e.stopPropagation()}>
                <div style={{ color: '#e0e0e3', fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.5, marginBottom: '0.75rem', wordBreak: 'break-all' }}>
                  {post.location}
                </div>
                <button
                  type="button"
                  onClick={handleCopyLocation}
                  style={{
                    width: '100%', padding: '0.5rem', borderRadius: '0.625rem', cursor: 'pointer',
                    background: copiedLocation
                      ? 'linear-gradient(135deg, rgba(7,193,96,0.15), rgba(7,193,96,0.07))'
                      : 'linear-gradient(135deg, rgba(143,245,255,0.1), rgba(143,245,255,0.04))',
                    border: `1px solid ${copiedLocation ? 'rgba(7,193,96,0.28)' : 'rgba(143,245,255,0.16)'}`,
                    color: copiedLocation ? '#4ade80' : '#8ff5ff',
                    fontWeight: 600, fontSize: '0.8125rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem',
                    transition: 'all 0.2s',
                  }}
                >
                  {copiedLocation ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedLocation ? '已复制' : '复制地址'}
                </button>
              </div>
            }
          >
            <div
              className="flex items-center gap-1.5 text-xs"
              style={{ color: '#6e6e73', cursor: post.location ? 'pointer' : 'default' }}
              onClick={e => e.stopPropagation()}
            >
              <MapPinIcon className="h-3.5 w-3.5 flex-shrink-0" />
              <span
                className="font-medium max-w-52 sm:max-w-80 truncate"
              >
                {post.location || '未设置位置'}
              </span>
            </div>
          </Popover>

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
        open={wechatModalOpen}
        onCancel={() => setWechatModalOpen(false)}
        footer={null}
        centered
        destroyOnHidden
        width={360}
        closable={false}
        styles={{
          content: {
            backgroundColor: '#1c1b1e',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '1.5rem',
            padding: 0,
            overflow: 'hidden',
            boxShadow: '0 24px 64px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04)',
          },
          body: { padding: 0 },
          mask: { backdropFilter: 'blur(6px)', backgroundColor: 'rgba(0,0,0,0.65)' },
        }}
      >
        <div style={{ padding: '1.75rem' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              <div style={{
                width: '2.75rem', height: '2.75rem', borderRadius: '0.875rem',
                background: 'linear-gradient(135deg, rgba(7,193,96,0.18), rgba(7,193,96,0.06))',
                border: '1px solid rgba(7,193,96,0.22)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <MessageCircle style={{ width: '1.25rem', height: '1.25rem', color: '#07C160' }} strokeWidth={2} />
              </div>
              <div>
                <div style={{ color: '#e0e0e3', fontWeight: 700, fontSize: '1rem', lineHeight: 1.3 }}>微信联系方式</div>
                <div style={{ color: '#6e6e73', fontSize: '0.75rem', marginTop: '0.125rem' }}>搜索以下微信号添加好友</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setWechatModalOpen(false)}
              style={{
                width: '2rem', height: '2rem', borderRadius: '0.5rem', flexShrink: 0,
                backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                color: '#6e6e73', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#a0a0a8'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#6e6e73'; }}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* WeChat ID */}
          {wechatIdInModal && (
            <>
              <div style={{
                backgroundColor: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '0.875rem',
                padding: '0.875rem 1.125rem',
                marginBottom: '0.875rem',
              }}>
                <div style={{ color: '#4e4e53', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.375rem' }}>
                  微信号
                </div>
                <div style={{ color: '#e0e0e3', fontWeight: 600, fontSize: '1.0625rem', letterSpacing: '0.03em', fontFamily: 'ui-monospace, "SF Mono", monospace' }}>
                  {wechatIdInModal}
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyWechat}
                style={{
                  width: '100%', padding: '0.8125rem', borderRadius: '0.875rem', cursor: 'pointer',
                  background: copied
                    ? 'linear-gradient(135deg, rgba(7,193,96,0.15), rgba(7,193,96,0.07))'
                    : 'linear-gradient(135deg, rgba(143,245,255,0.1), rgba(143,245,255,0.04))',
                  border: `1px solid ${copied ? 'rgba(7,193,96,0.28)' : 'rgba(143,245,255,0.16)'}`,
                  color: copied ? '#4ade80' : '#8ff5ff',
                  fontWeight: 600, fontSize: '0.9375rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? '已复制' : '复制微信号'}
              </button>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
