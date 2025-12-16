'use client'

import { useState, useEffect } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface FiltersProps {
  filters: any
  setFilters: (filters: any) => void
}

export default function Filters({ filters, setFilters }: FiltersProps) {
  const [categories, setCategories] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/categories`)
      const data = await response.json()
      // Ensure data is an array
      if (Array.isArray(data)) {
        setCategories(data)
      } else {
        setCategories([])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      setCategories([]) // Set empty array on error
    }
  }

  const handleChange = (key: string, value: any) => {
    setFilters({ ...filters, [key]: value })
  }

  const clearFilters = () => {
    setFilters({
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
  }

  return (
    <div className="filters-section">
      <button className="filters-toggle" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? 'Hide' : 'Show'} Filters
      </button>
      {isOpen && (
        <div className="filters">
          <div className="filter-group">
            <label>Search SKU</label>
            <input
              type="text"
              placeholder="Enter SKU"
              value={filters.sku}
              onChange={(e) => handleChange('sku', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Price Ending</label>
            <select
              value={filters.price_ending}
              onChange={(e) => handleChange('price_ending', e.target.value)}
            >
              <option value="">All</option>
              <option value=".06">.06</option>
              <option value=".04">.04</option>
              <option value=".03">.03</option>
              <option value=".02">.02</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Category</label>
            <select
              value={filters.category_id}
              onChange={(e) => handleChange('category_id', e.target.value)}
            >
              <option value="">All Categories</option>
              {Array.isArray(categories) && categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Discount Range</label>
            <div className="range-inputs">
              <input
                type="number"
                placeholder="Min %"
                value={filters.min_discount}
                onChange={(e) => handleChange('min_discount', e.target.value)}
              />
              <span>to</span>
              <input
                type="number"
                placeholder="Max %"
                value={filters.max_discount}
                onChange={(e) => handleChange('max_discount', e.target.value)}
              />
            </div>
          </div>

          <div className="filter-group">
            <label>ZIP Code</label>
            <input
              type="text"
              placeholder="Enter ZIP"
              value={filters.zip_code}
              onChange={(e) => handleChange('zip_code', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>
              <input
                type="checkbox"
                checked={filters.online_only}
                onChange={(e) => handleChange('online_only', e.target.checked)}
              />
              Online Only
            </label>
          </div>

          <div className="filter-group">
            <label>
              <input
                type="checkbox"
                checked={filters.in_store_only}
                onChange={(e) => handleChange('in_store_only', e.target.checked)}
              />
              In-Store Only
            </label>
          </div>

          <div className="filter-group">
            <label>
              <input
                type="checkbox"
                checked={filters.featured_only}
                onChange={(e) => handleChange('featured_only', e.target.checked)}
              />
              Featured Only
            </label>
          </div>

          <button className="clear-filters" onClick={clearFilters}>
            Clear All
          </button>
        </div>
      )}
      <style jsx>{`
        .filters-section {
          margin: 2rem 0;
        }
        .filters-toggle {
          background: #e31837;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 0.25rem;
          cursor: pointer;
          font-weight: 500;
          margin-bottom: 1rem;
        }
        .filters {
          background: #f9fafb;
          padding: 1.5rem;
          border-radius: 0.5rem;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }
        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .filter-group label {
          font-weight: 500;
          font-size: 0.875rem;
          color: #374151;
        }
        .filter-group input[type="text"],
        .filter-group input[type="number"],
        .filter-group select {
          padding: 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 0.25rem;
          font-size: 0.875rem;
        }
        .range-inputs {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .range-inputs input {
          flex: 1;
        }
        .filter-group input[type="checkbox"] {
          margin-right: 0.5rem;
        }
        .clear-filters {
          grid-column: 1 / -1;
          background: #6b7280;
          color: white;
          border: none;
          padding: 0.75rem;
          border-radius: 0.25rem;
          cursor: pointer;
          font-weight: 500;
        }
        .clear-filters:hover {
          background: #4b5563;
        }
        @media (max-width: 768px) {
          .filters {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}

