export interface Deal {
  id: number
  sku: string
  title: string
  description?: string
  image_url?: string
  current_price: number
  original_price?: number
  discount_percent?: number
  price_ending?: string
  category_id?: number
  category_name?: string
  category_slug?: string
  online_available: boolean
  in_store_available: boolean
  availability_data?: any
  store_locations?: any
  is_featured: boolean
  source: 'api' | 'scraper'
  last_updated: string
  created_at: string
}

export interface Category {
  id: number
  name: string
  slug: string
  is_active: boolean
}

