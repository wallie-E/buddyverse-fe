import { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';
import type { Category } from '../api/types';
import { getSubCategoryIcon } from '../utils/categoryIcons';

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
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);
  const subCategories = selectedCategory?.subcategories || [];

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSubDropdownOpen(false);
      }
    };

    if (isSubDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSubDropdownOpen]);

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
    <div className="mb-6">
      <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-7 gap-1 bg-slate-100/80 backdrop-blur-sm rounded-2xl p-1">
        {/* 全部分类 */}
        <button
          onClick={() => onCategoryChange(null)}
          className={`flex flex-col items-center gap-2 py-3 px-4 rounded-xl transition-all ${
            !selectedCategoryId ? "bg-white shadow-sm" : "hover:bg-white/50"
          }`}
        >
          <span className="text-lg">🌟</span>
          <span className="text-sm font-medium">全部</span>
        </button>

        {/* 分类列表 */}
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={`flex flex-col items-center gap-2 py-3 px-4 rounded-xl transition-all ${
              selectedCategoryId === category.id ? "bg-white shadow-sm" : "hover:bg-white/50"
            }`}
          >
            <span className="text-lg">{getCategoryIcon(category.name)}</span>
            <span className="text-sm font-medium">{category.name}</span>
          </button>
        ))}
      </div>

      {/* 细分类型下拉选择 */}
      {selectedCategoryId && subCategories.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-slate-600 font-medium">细分类型：</span>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsSubDropdownOpen(!isSubDropdownOpen)}
                className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl hover:bg-white transition-all min-w-[140px] shadow-sm border border-slate-200/50"
              >
                <span className="text-sm font-medium text-slate-700">
                  {selectedSubCategoryId 
                    ? subCategories.find(sub => sub.id === selectedSubCategoryId)?.name
                    : `全部${selectedCategory?.name || '搭子'}`
                  }
                </span>
                <ChevronDownIcon className="h-4 w-4 text-slate-500" />
              </button>

              {isSubDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white/95 backdrop-blur-sm border border-slate-200/50 rounded-xl shadow-xl z-10">
                  <div className="py-2">
                    <button
                      onClick={() => {
                        onSubCategoryChange(null);
                        setIsSubDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 flex items-center justify-between transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <span>🌟</span>
                        <span>全部{selectedCategory?.name || '搭子'}</span>
                      </span>
                      {!selectedSubCategoryId && <CheckIcon className="h-4 w-4 text-blue-600" />}
                    </button>
                    {subCategories.map((subCategory) => (
                      <button
                        key={subCategory.id}
                        onClick={() => {
                          onSubCategoryChange(subCategory.id);
                          setIsSubDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 flex items-center justify-between transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <span>{getSubCategoryIcon(subCategory.name)}</span>
                          <span>{subCategory.name}</span>
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