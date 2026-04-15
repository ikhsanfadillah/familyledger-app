import type { Category } from '~/db/schema'

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_food', name: 'Makanan & Minuman', icon: '🍚', color: '#E67E22', type: 'expense', order: 1, deleted: false },
  { id: 'cat_transport', name: 'Transport', icon: '🚗', color: '#3498DB', type: 'expense', order: 2, deleted: false },
  { id: 'cat_shopping', name: 'Belanja', icon: '🛒', color: '#9B59B6', type: 'expense', order: 3, deleted: false },
  { id: 'cat_bills', name: 'Tagihan & Utilitas', icon: '💡', color: '#F1C40F', type: 'expense', order: 4, deleted: false },
  { id: 'cat_health', name: 'Kesehatan', icon: '💊', color: '#E74C3C', type: 'expense', order: 5, deleted: false },
  { id: 'cat_education', name: 'Pendidikan', icon: '📚', color: '#1ABC9C', type: 'expense', order: 6, deleted: false },
  { id: 'cat_entertainment', name: 'Hiburan', icon: '🎮', color: '#E91E63', type: 'expense', order: 7, deleted: false },
  { id: 'cat_salary', name: 'Gaji & Upah', icon: '💰', color: '#27AE60', type: 'income', order: 8, deleted: false },
  { id: 'cat_business', name: 'Bisnis', icon: '📈', color: '#2980B9', type: 'income', order: 9, deleted: false },
  { id: 'cat_others', name: 'Lainnya', icon: '📦', color: '#95A5A6', type: 'both', order: 10, deleted: false },
]
