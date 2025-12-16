// Type definitions for the application

export interface Deal {
  id: number;
  sku: string;
  title: string;
  description?: string;
  image_url?: string;
  current_price: number;
  original_price?: number;
  discount_percent?: number;
  price_ending?: string;
  category_id?: number;
  online_available: boolean;
  in_store_available: boolean;
  availability_data?: any;
  store_locations?: any;
  is_featured: boolean;
  source: 'api' | 'scraper';
  last_updated: Date;
  created_at: Date;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: Date;
}

export interface User {
  id: number;
  whop_user_id: string;
  email?: string;
  membership_active: boolean;
  last_checked_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface DealFilters {
  sku?: string;
  price_ending?: string; // .06, .04, .03, .02
  category_id?: string; // MongoDB ObjectId as string
  min_discount?: number;
  max_discount?: number;
  zip_code?: string;
  online_only?: boolean;
  in_store_only?: boolean;
  featured_only?: boolean;
  page?: number;
  limit?: number;
}

export interface WHOPUser {
  id: string;
  email: string;
  membership_active: boolean;
}

