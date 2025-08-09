import type { MainCategory, SubCategory } from '../types';

// 主分类配置
export const MAIN_CATEGORIES: Record<MainCategory, { name: string; icon: string; color: string }> = {
  food: { name: '干饭搭子', icon: '🍽️', color: 'bg-orange-500' },
  study: { name: '学习搭子', icon: '📚', color: 'bg-green-500' },
  sports: { name: '运动搭子', icon: '⚽', color: 'bg-blue-500' },
  game: { name: '游戏搭子', icon: '🎮', color: 'bg-purple-500' },
  anime: { name: '二次元搭子', icon: '🎌', color: 'bg-pink-500' },
  travel: { name: '旅行搭子', icon: '✈️', color: 'bg-indigo-500' }
};

// 细分类型
export const SUB_CATEGORIES: SubCategory[] = [
  // 干饭搭子
  { id: 'food-hotpot', name: '火锅', icon: '🍲', mainCategory: 'food' },
  { id: 'food-bbq', name: '烧烤', icon: '🍖', mainCategory: 'food' },
  { id: 'food-stirfry', name: '炒菜', icon: '🍳', mainCategory: 'food' },
  { id: 'food-noodles', name: '面条', icon: '🍜', mainCategory: 'food' },
  { id: 'food-sushi', name: '日料', icon: '🍣', mainCategory: 'food' },
  { id: 'food-western', name: '西餐', icon: '🍝', mainCategory: 'food' },
  { id: 'food-dessert', name: '甜品', icon: '🍰', mainCategory: 'food' },
  { id: 'food-coffee', name: '咖啡', icon: '☕', mainCategory: 'food' },
  
  // 学习搭子
  { id: 'study-programming', name: '编程', icon: '💻', mainCategory: 'study' },
  { id: 'study-english', name: '英文', icon: '🔤', mainCategory: 'study' },
  { id: 'study-math', name: '数学', icon: '📐', mainCategory: 'study' },
  { id: 'study-physics', name: '物理', icon: '⚛️', mainCategory: 'study' },
  { id: 'study-finance', name: '金融', icon: '💰', mainCategory: 'study' },
  { id: 'study-business', name: '创业', icon: '🚀', mainCategory: 'study' },
  
  // 运动搭子
  { id: 'sports-badminton', name: '羽毛球', icon: '🏸', mainCategory: 'sports' },
  { id: 'sports-basketball', name: '篮球', icon: '🏀', mainCategory: 'sports' },
  { id: 'sports-pingpong', name: '乒乓球', icon: '🏓', mainCategory: 'sports' },
  { id: 'sports-running', name: '跑步', icon: '🏃', mainCategory: 'sports' },
  
  // 游戏搭子
  { id: 'game-honor', name: '王者荣耀', icon: '👑', mainCategory: 'game' },
  { id: 'game-pubg', name: '和平精英', icon: '🔫', mainCategory: 'game' },
  { id: 'game-lol', name: 'LOL', icon: '⚔️', mainCategory: 'game' }
];

// 获取主分类的细分类型
export const getSubCategoriesByMain = (mainCategory: MainCategory): SubCategory[] => {
  return SUB_CATEGORIES.filter(sub => sub.mainCategory === mainCategory);
};

// 时间格式化
export const formatTime = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) {
    return '刚刚';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}分钟前`;
  } else if (diffInHours < 24) {
    return `${diffInHours}小时前`;
  } else if (diffInDays < 7) {
    return `${diffInDays}天前`;
  } else {
    return date.toLocaleDateString('zh-CN');
  }
}; 