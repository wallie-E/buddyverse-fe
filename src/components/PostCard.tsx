import { MapPinIcon, ChatBubbleLeftIcon, EyeSlashIcon, ClockIcon } from '@heroicons/react/24/outline';
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
      className="group hover:shadow-2xl transition-all duration-500 border-0 bg-white/80 backdrop-blur-sm rounded-3xl overflow-hidden shadow-lg cursor-pointer"
      onClick={handleClick}
    >
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div 
                className="h-12 w-12 rounded-full ring-2 ring-white shadow-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold cursor-pointer hover:opacity-80 transition-opacity"
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
                <span className="font-semibold text-slate-900">{post.author_name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                <ClockIcon className="h-3 w-3" />
                {formatDate(post.created_at)}
              </div>
            </div>
          </div>
          {post.subcategory_name && (
            <span className="inline-flex items-center gap-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 shadow-lg px-3 py-1 rounded-full text-sm">
              <span>{getSubCategoryIcon(post.subcategory_name)}</span>
              <span>{post.subcategory_name}</span>
            </span>
          )}
        </div>
      </div>
      <div className="px-6 pb-6">
        <p className="text-slate-800 mb-6 leading-relaxed text-base group-hover:text-slate-900 transition-colors">
          {post.content}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <MapPinIcon className="h-4 w-4" />
            <span className="font-medium">{post.location || '未设置位置'}</span>
          </div>
          <div className="flex items-center gap-1 text-slate-500">
            <ChatBubbleLeftIcon className="h-4 w-4" />
            <span className="font-medium">{post.comment_count} 条评论</span>
            {post.comment_visibility === 'private' && (
              <EyeSlashIcon className="h-3 w-3 text-gray-400 ml-1" title="评论仅作者可见" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 