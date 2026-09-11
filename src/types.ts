export type ThemeId = 'modern' | 'luxury' | 'moroccan' | 'minimal';
export type LanguageCode = 'fr' | 'ar' | 'en';

export type ProductBadge = 'Populaire' | 'Nouveau' | 'Épicé' | 'Chef' | '';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'owner';
  created_at?: string;
}

export interface Restaurant {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description: string;
  address?: string;
  phone?: string;
  currency: string;
  logo_url?: string;
  cover_url?: string;
  theme: ThemeId;
  primary_color: string;
  languages: LanguageCode[];
  default_language: LanguageCode;
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  restaurant_id: string;
  name_fr: string;
  name_ar?: string;
  name_en?: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id: string;
  name_fr: string;
  name_ar?: string;
  name_en?: string;
  description_fr?: string;
  description_ar?: string;
  description_en?: string;
  price: number;
  image_url?: string;
  is_available: boolean;
  badge?: ProductBadge | string;
  ingredients?: string;
  allergens?: string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface PublicMenuData {
  restaurant: Restaurant;
  categories: Category[];
  items: MenuItem[];
}

export interface AuthState {
  token: string | null;
  user: User | null;
}
