// 子分类图标映射工具函数
export const getSubCategoryIcon = (subCategoryName: string): string => {
  switch (subCategoryName) {
    // 干饭搭子
    case '火锅': return '🍲';
    case '烧烤': return '🍢';
    case '炒菜': return '🥘';
    case '面条': return '🍜';
    case '烤肉': return '🥩';
    case '西餐': return '🍽️';
    case '海鲜': return '🦐';
    case '日料': return '🍣';
    case '韩式': return '🍜';
    
    // 运动搭子
    case '羽毛球': return '🏸';
    case '篮球': return '🏀';
    case '乒乓球': return '🏓';
    case '跑步': return '🏃';
    case '游泳': return '🏊';
    case '健身': return '💪';
    case '骑行': return '🚴';
    
    // 学习搭子
    case '编程': return '💻';
    case '英文': return '🔤';
    case '数学': return '🔢';
    case '物理': return '⚛️';
    case '金融': return '💰';
    case '创业': return '🚀';
    
    // 游戏搭子
    case '王者荣耀': return '👑';
    case '和平精英': return '🔫';
    case 'LOL': return '⚔️';
    case '元神': return '⚡';
    case '金铲铲': return '🎲';
    
    // 旅行搭子
    case '国内游': return '🏞️';
    case '出国游': return '🌍';
    case '周末游': return '🎯';
    case '自驾游': return '🚗';
    case '徒步': return '🥾';
    case '摄影': return '📸';
    case '露营': return '⛺';
    
    default: return '📍';
  }
};
