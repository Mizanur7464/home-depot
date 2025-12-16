'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import DealGrid from '@/components/DealGrid'
import Filters from '@/components/Filters'
import { Deal } from '@/types/deal'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function Home() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    sku: '',
    price_ending: '',
    category_id: '',
    min_discount: '',
    max_discount: '',
    zip_code: '',
    online_only: false,
    in_store_only: false,
    featured_only: false,
  })

  useEffect(() => {
    fetchDeals()
  }, [filters])

  const fetchDeals = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') {
          params.append(key, value.toString())
        }
      })

      // Show only CLEARANCE products (price endings: .06, .04, .03, .02)
      // Don't add show_all - let the API filter for clearance items only
      params.append('limit', '30') // Show up to 30 clearance products
      
      const response = await fetch(`${API_URL}/api/deals?${params}`)
      const data = await response.json()
      setDeals(data.deals || [])
    } catch (error) {
      console.error('Error fetching deals:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main>
      <Header />
      <div className="container">
        <h1 className="page-title">Clearance Deals</h1>
        <Filters filters={filters} setFilters={setFilters} />
        <DealGrid deals={deals} loading={loading} />
      </div>
    </main>
  )
}
