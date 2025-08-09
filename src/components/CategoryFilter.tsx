import { useState } from 'react';
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';
import type { Category } from '../api/types';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategoryId: number | null;
  selectedSubCategoryId: number | null;
  onCategoryChange: (categoryId: number | null) => void;
  onSubCategoryChange: (subCategoryId: number | null) => void;
}

export default function CategoryFilter({
  categories,
  selectedCategoryId,
  selectedSubCategoryId,
  onCategoryChange,
  onSubCategoryChange
}: CategoryFilterProps) {
  const [isSubDropdownOpen, setIsSubDropdownOpen] = useState(false);

  const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);
  const subCategories = selectedCategory?.subcategories || [];

  // 分类图标映射
  const getCategoryIcon = (categoryName: string) => {
    switch (categoryName) {
      case '干饭搭子':
        return '🍽️';
      case '运动搭子':
        return '⚽';
      case '学习搭子':
        return '📚';
      case '游戏搭子':
        return '🎮';
      case '二次元搭子':
        return '🎭';
      case '旅行搭子':
        return '✈️';
      default:
        return '⭐';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      {/* 主分类展示 */}
      <div className="p-4 border-b border-gray-100">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {/* 全部分类 */}
          <button
            onClick={() => onCategoryChange(null)}
            className={`flex flex-col items-center p-4 rounded-lg transition-all ${
              !selectedCategoryId
                ? 'bg-blue-50 border-2 border-blue-200 text-blue-600'
                : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="text-2xl mb-2">⭐</span>
            <span className="text-sm font-medium">全部</span>
          </button>

          {/* 分类列表 */}
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`flex flex-col items-center p-4 rounded-lg transition-all ${
                selectedCategoryId === category.id
                  ? 'bg-blue-50 border-2 border-blue-200 text-blue-600'
                  : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="text-2xl mb-2">{getCategoryIcon(category.name)}</span>
              <span className="text-sm font-medium">{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 细分类型下拉选择 */}
      {selectedCategoryId && subCategories.length > 0 && (
        <div className="p-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">细分类型：</span>
            <div className="relative">
              <button
                onClick={() => setIsSubDropdownOpen(!isSubDropdownOpen)}
                className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors min-w-[120px]"
              >
                                 <span className="text-sm font-medium">
                   {selectedSubCategoryId 
                     ? subCategories.find(sub => sub.id === selectedSubCategoryId)?.name
                     : `全部${selectedCategory?.name || '搭子'}`
                   }
                </span>
                <ChevronDownIcon className="h-4 w-4" />
              </button>

              {isSubDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        onSubCategoryChange(null);
                        setIsSubDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between"
                    >
                      <span>🌟 全部{selectedCategory?.name || '搭子'}</span>
                      {!selectedSubCategoryId && <CheckIcon className="h-4 w-4 text-blue-600" />}
                    </button>
                    {subCategories.map((subCategory) => (
                      <button
                        key={subCategory.id}
                        onClick={() => {
                          onSubCategoryChange(subCategory.id);
                          setIsSubDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between"
                      >
                        <span>
                          {subCategory.name === '火锅' ? '🍲' : 
                           subCategory.name === '烧烤' ? '🍢' :
                           subCategory.name === '炒菜' ? '🥘' :
                           subCategory.name === '面条' ? '🍜' :
                           subCategory.name === '羽毛球' ? '🏸' :
                           subCategory.name === '篮球' ? '🏀' :
                           subCategory.name === '乒乓球' ? '🏓' :
                           subCategory.name === '跑步' ? '🏃' :
                           subCategory.name === '编程' ? '💻' :
                           subCategory.name === '英文' ? '🔤' :
                           subCategory.name === '数学' ? '🔢' :
                           subCategory.name === '物理' ? '⚛️' :
                           subCategory.name === '金融' ? '💰' :
                           subCategory.name === '创业' ? '🚀' :
                           subCategory.name === '王者荣耀' ? '👑' :
                           subCategory.name === '和平精英' ? '🔫' :
                           subCategory.name === 'LOL' ? '⚔️' :
                           '📍'} {subCategory.name}
                        </span>
                        {selectedSubCategoryId === subCategory.id && (
                          <CheckIcon className="h-4 w-4 text-blue-600" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 