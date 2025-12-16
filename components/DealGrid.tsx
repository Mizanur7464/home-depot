'use client'

import { Deal } from '@/types/deal'
import DealCard from './DealCard'

interface DealGridProps {
  deals: Deal[]
  loading: boolean
}

export default function DealGrid({ deals, loading }: DealGridProps) {
  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading deals...</p>
        <style jsx>{`
          .loading {
            text-align: center;
            padding: 4rem 0;
          }
          .spinner {
            border: 4px solid #f3f4f6;
            border-top: 4px solid #e31837;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  if (deals.length === 0) {
    return (
      <div className="no-deals">
        <p>No deals found. Try adjusting your filters.</p>
        <style jsx>{`
          .no-deals {
            text-align: center;
            padding: 4rem 0;
            color: #6b7280;
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="deal-grid">
      {deals.map((deal) => (
        <DealCard key={deal.sku || deal.id || `deal-${Math.random()}`} deal={deal} />
      ))}
      <style jsx>{`
        .deal-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
          padding: 2rem 0;
        }
        @media (max-width: 768px) {
          .deal-grid {
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  )
}

