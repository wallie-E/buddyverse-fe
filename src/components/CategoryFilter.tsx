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
    <div className="mb-8">
      <div className="bg-slate-100/50 rounded-[2rem] p-1.5">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide max-w-full">
          {/* 全部分类 */}
          <button
            onClick={() => onCategoryChange(null)}
            className={`flex flex-col items-center gap-2 py-4 px-4 sm:px-8 rounded-[1.5rem] transition-all duration-300 flex-shrink-0 min-w-[80px] ${
              !selectedCategoryId ? "bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]" : "hover:bg-white/40 text-slate-500 hover:text-slate-700"
            }`}
          >
            <span className="text-xl">🌟</span>
            <span className="text-sm font-medium font-sans whitespace-nowrap">全部</span>
          </button>

          {/* 分类列表 */}
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`flex flex-col items-center gap-2 py-4 px-4 sm:px-8 rounded-[1.5rem] transition-all duration-300 flex-shrink-0 min-w-[80px] ${
                selectedCategoryId === category.id ? "bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]" : "hover:bg-white/40 text-slate-500 hover:text-slate-700"
              }`}
            >
              <span className="text-xl">{getCategoryIcon(category.name)}</span>
              <span className="text-sm font-medium font-sans whitespace-nowrap">{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 细分类型下拉选择 */}
      {selectedCategoryId && subCategories.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center space-x-3">
            <span className="text-sm text-slate-400 font-medium pl-2 font-sans">细分类型</span>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsSubDropdownOpen(!isSubDropdownOpen)}
                className="flex items-center justify-between bg-white px-5 py-2.5 rounded-full hover:bg-slate-50 hover:shadow-sm transition-all min-w-[140px] ring-1 ring-slate-100 text-slate-600"
              >
                <span className="text-sm font-medium font-sans">
                  {selectedSubCategoryId 
                    ? subCategories.find(sub => sub.id === selectedSubCategoryId)?.name
                    : `全部${selectedCategory?.name || '搭子'}`
                  }
                </span>
                <ChevronDownIcon className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${isSubDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isSubDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white border-0 ring-1 ring-slate-100 rounded-[1.5rem] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] z-20 overflow-hidden p-1.5">
                  <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-100">
                    <button
                      onClick={() => {
                        onSubCategoryChange(null);
                        setIsSubDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 rounded-xl flex items-center justify-between transition-colors text-slate-600"
                    >
                      <span className="flex items-center gap-2">
                        <span>🌟</span>
                        <span>全部{selectedCategory?.name || '搭子'}</span>
                      </span>
                      {!selectedSubCategoryId && <CheckIcon className="h-4 w-4 text-slate-800" />}
                    </button>
                    {subCategories.map((subCategory) => (
                      <button
                        key={subCategory.id}
                        onClick={() => {
                          onSubCategoryChange(subCategory.id);
                          setIsSubDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 rounded-xl flex items-center justify-between transition-colors text-slate-600"
                      >
                        <span className="flex items-center gap-2">
                          <span>{getSubCategoryIcon(subCategory.name)}</span>
                          <span>{subCategory.name}</span>
                        </span>
                        {selectedSubCategoryId === subCategory.id && (
                          <CheckIcon className="h-4 w-4 text-slate-800" />
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