import api from './config';
import type { 
  ApiResponse, 
  Category,
  SubcategoriesResponse
} from './types';

// 获取所有分类
export const getCategories = async (): Promise<ApiResponse<Category[]>> => {
  return api.get('/api/categories');
};

// 获取指定分类的细分类型
export const getSubcategories = async (categoryId: number): Promise<ApiResponse<SubcategoriesResponse>> => {
  return api.get(`/api/categories/${categoryId}/subcategories`);
}; 