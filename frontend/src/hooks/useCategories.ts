import { useQuery } from '@tanstack/react-query';
import { categoriesApi } from '@/api/endpoints';
import type { Category } from '@/types';

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list().then((r) => r.data.data.categories),
  });
}
