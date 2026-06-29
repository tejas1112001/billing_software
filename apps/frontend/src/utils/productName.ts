import type { Product } from '@/types';

export function getProductDisplayName(product?: Partial<Product> | null): string {
  if (!product) return 'N/A';
  const brandName = product.brand?.name ? product.brand.name.trim() : '';
  const categoryName = product.category?.name ? product.category.name.trim() : '';
  const modelName = product.modelName ? product.modelName.trim() : '';

  const parts = [];
  if (brandName) parts.push(brandName);
  if (modelName) parts.push(modelName);
  if (categoryName) parts.push(categoryName);

  return parts.join(' ');
}
