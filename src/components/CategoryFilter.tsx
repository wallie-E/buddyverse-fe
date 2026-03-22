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

const getCategoryIcon = (categoryName: string) => {
  switch (categoryName) {
    case '干饭搭子': return '🍽️';
    case '运动搭子': return '⚽';
    case '学习搭子': return '📚';
    case '游戏搭子': return '🎮';
    case '二次元搭子': return '🎭';
    case '旅行搭子': return '✈️';
    default: return '⭐';
  }
};

// Short label for horizontal chips
const getCategoryLabel = (categoryName: string) => {
  switch (categoryName) {
    case '干饭搭子': return '干饭';
    case '运动搭子': return '运动';
    case '学习搭子': return '学习';
    case '游戏搭子': return '游戏';
    case '二次元搭子': return '二次元';
    case '旅行搭子': return '旅行';
    default: return categoryName.replace('搭子', '');
  }
};

export default function CategoryFilter({
  categories,
  selectedCategoryId,
  selectedSubCategoryId,
  onCategoryChange,
  onSubCategoryChange,
}: CategoryFilterProps) {
  const [isSubDropdownOpen, setIsSubDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);
  const subCategories = selectedCategory?.subcategories || [];

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

  return (
    <div className="mb-8">
      {/* Horizontal pill chips */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {/* 全部 */}
        <button
          onClick={() => onCategoryChange(null)}
          className="flex items-center gap-2 px-4 py-2 rounded-full flex-shrink-0 transition-all duration-200 text-sm font-medium"
          style={
            !selectedCategoryId
              ? {
                  backgroundColor: '#201f21',
                  color: '#8ff5ff',
                  border: '1px solid rgba(143,245,255,0.25)',
                  boxShadow: '0 0 12px rgba(143,245,255,0.08)',
                }
              : {
                  backgroundColor: '#131314',
                  color: '#8e8e93',
                  border: '1px solid rgba(255,255,255,0.06)',
                }
          }
        >
          <span className="text-base leading-none">🌟</span>
          <span>全部</span>
        </button>

        {/* Category chips */}
        {categories.map((category) => {
          const isSelected = selectedCategoryId === category.id;
          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-full flex-shrink-0 transition-all duration-200 text-sm font-medium"
              style={
                isSelected
                  ? {
                      backgroundColor: '#201f21',
                      color: '#8ff5ff',
                      border: '1px solid rgba(143,245,255,0.25)',
                      boxShadow: '0 0 12px rgba(143,245,255,0.08)',
                    }
                  : {
                      backgroundColor: '#131314',
                      color: '#8e8e93',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }
              }
            >
              <span className="text-base leading-none">{getCategoryIcon(category.name)}</span>
              <span>{getCategoryLabel(category.name)}</span>
            </button>
          );
        })}
      </div>

      {/* Subcategory dropdown */}
      {selectedCategoryId && subCategories.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-medium" style={{ color: '#6e6e73' }}>细分类型</span>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsSubDropdownOpen(!isSubDropdownOpen)}
                className="flex items-center justify-between px-4 py-2 rounded-full transition-all duration-200 min-w-[140px] text-sm font-medium"
                style={{
                  backgroundColor: '#131314',
                  color: '#c4c4c8',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <span>
                  {selectedSubCategoryId
                    ? subCategories.find(sub => sub.id === selectedSubCategoryId)?.name
                    : `全部${selectedCategory?.name || '搭子'}`}
                </span>
                <ChevronDownIcon
                  className={`h-4 w-4 ml-2 transition-transform duration-300 flex-shrink-0`}
                  style={{ color: '#6e6e73', transform: isSubDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </button>

              {isSubDropdownOpen && (
                <div
                  className="absolute top-full left-0 mt-2 w-52 rounded-2xl overflow-hidden z-20 p-1.5"
                  style={{
                    backgroundColor: '#1c1b1e',
                    border: '1px solid rgba(255,255,255,0.06)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                  }}
                >
                  <div className="max-h-64 overflow-y-auto scrollbar-thin">
                    <button
                      onClick={() => { onSubCategoryChange(null); setIsSubDropdownOpen(false); }}
                      className="w-full text-left px-4 py-3 text-sm rounded-xl flex items-center justify-between transition-colors"
                      style={{ color: '#c4c4c8' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <span className="flex items-center gap-2">
                        <span>🌟</span>
                        <span>全部{selectedCategory?.name || '搭子'}</span>
                      </span>
                      {!selectedSubCategoryId && <CheckIcon className="h-4 w-4" style={{ color: '#8ff5ff' }} />}
                    </button>
                    {subCategories.map((subCategory) => (
                      <button
                        key={subCategory.id}
                        onClick={() => { onSubCategoryChange(subCategory.id); setIsSubDropdownOpen(false); }}
                        className="w-full text-left px-4 py-3 text-sm rounded-xl flex items-center justify-between transition-colors"
                        style={{ color: '#c4c4c8' }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <span className="flex items-center gap-2">
                          <span>{getSubCategoryIcon(subCategory.name)}</span>
                          <span>{subCategory.name}</span>
                        </span>
                        {selectedSubCategoryId === subCategory.id && (
                          <CheckIcon className="h-4 w-4" style={{ color: '#8ff5ff' }} />
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
