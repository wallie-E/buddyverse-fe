import { MapPinIcon, ChatBubbleLeftIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { authUtils } from '../api';
import type { Post } from '../api/types';

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
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      {/* User Info */}
      <div className="flex items-center space-x-3 mb-3">
        <div 
          className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
          onClick={handleAvatarClick}
        >
          <span className="text-white font-medium">
            {post?.author_name?.charAt(0)}
          </span>
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="font-medium text-gray-900">{post.author_name}</h3>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {post.subcategory_name}
            </span>
          </div>
          <p className="text-sm text-gray-500">{formatDate(post.created_at)}</p>
        </div>
      </div>

      {/* Post Content */}
      <div className="mb-3">
        <p className="text-gray-900 leading-relaxed">{post.content}</p>
      </div>

      {/* Location */}
      {post.location && (
        <div className="flex items-center space-x-1 mb-3 text-sm text-gray-500">
          <MapPinIcon className="h-4 w-4" />
          <span>{post.location}</span>
        </div>
      )}

      {/* Category Badge */}
      <div className="mb-3">
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
          {post.category_name}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-4">
          <button 
            className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/post/${post.id}#comments`);
            }}
          >
            <ChatBubbleLeftIcon className="h-4 w-4" />
            <span className="text-sm">{post.comment_count}</span>
            {post.comment_visibility === 'private' && (
              <EyeSlashIcon className="h-3 w-3 text-gray-400" title="评论仅作者可见" />
            )}
          </button>
          
          <button 
            className="flex items-center space-x-1 text-gray-500 hover:text-green-600 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              // TODO: 实现分享功能
              console.log('分享帖子:', post.id);
            }}
          >
            {/* <ShareIcon className="h-4 w-4" />
            <span className="text-sm">分享</span> */}
          </button>
        </div>
        
        <button 
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          onClick={handleClick}
        >
          查看详情
        </button>
      </div>
    </div>
  );
} 