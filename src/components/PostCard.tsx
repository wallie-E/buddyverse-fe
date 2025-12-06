import { MapPinIcon, ChatBubbleLeftIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { authUtils } from '../api';
import type { Post } from '../api/types';
import { getSubCategoryIcon } from '../utils/categoryIcons';

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const navigate = useNavigate();

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

  return (
    <div 
      className="group hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 border border-slate-100 bg-white rounded-[2rem] overflow-hidden shadow-[0_8px_30px_-12px_rgba(0,0,0,0.04)] cursor-pointer"
      onClick={handleClick}
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
          <p className="text-slate-600 text-[1.05rem] leading-loose font-normal group-hover:text-slate-800 transition-colors line-clamp-3 font-sans">
            {post.content}
          </p>
        </div>
        <div className="flex items-center justify-between pt-6 border-t border-slate-50">
          <div className="flex items-center gap-2 text-sm text-slate-400 group-hover:text-slate-500 transition-colors font-sans">
            <MapPinIcon className="h-4 w-4" />
            <span className="font-medium max-w-48 sm:max-w-60 truncate">{post.location || '未设置位置'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-slate-500 transition-colors text-sm font-sans">
            <ChatBubbleLeftIcon className="h-4 w-4" />
            <span className="font-medium">{post.comment_count}</span>
            {post.comment_visibility === 'private' && (
              <EyeSlashIcon className="h-3 w-3 ml-1" title="评论仅作者可见" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 