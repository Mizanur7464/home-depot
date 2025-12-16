'use client'

import { Deal } from '@/types/deal'
import Image from 'next/image'

interface DealCardProps {
  deal: Deal
}

export default function DealCard({ deal }: DealCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price)
  }

  return (
    <div className={`deal-card ${deal.is_featured ? 'featured' : ''}`}>
      {deal.is_featured && (
        <div className="featured-badge">Featured</div>
      )}
      {deal.image_url ? (
        <div className="deal-image">
          <img src={deal.image_url} alt={deal.title} />
        </div>
      ) : (
        <div className="deal-image-placeholder">No Image</div>
      )}
      <div className="deal-content">
        <h3 className="deal-title">{deal.title}</h3>
        {deal.description && (
          <p className="deal-description">{deal.description.substring(0, 100)}...</p>
        )}
        <div className="deal-price">
          <span className="current-price">{formatPrice(deal.current_price)}</span>
          {deal.original_price && (
            <>
              <span className="original-price">{formatPrice(deal.original_price)}</span>
              {deal.discount_percent && (
                <span className="discount">-{deal.discount_percent}%</span>
              )}
            </>
          )}
        </div>
        <div className="deal-meta">
          <span className="sku">SKU: {deal.sku}</span>
          {deal.price_ending && (
            <span className="price-ending">Ends in {deal.price_ending}</span>
          )}
        </div>
        <div className="deal-availability">
          {deal.online_available && (
            <span className="badge online">Online</span>
          )}
          {deal.in_store_available && (
            <span className="badge instore">In-Store</span>
          )}
        </div>
      </div>
      <style jsx>{`
        .deal-card {
          background: white;
          border-radius: 0.5rem;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s, box-shadow 0.3s;
          position: relative;
        }
        .deal-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
        }
        .deal-card.featured {
          border: 2px solid #e31837;
        }
        .featured-badge {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          background: #e31837;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-weight: 600;
          z-index: 10;
        }
        .deal-image {
          width: 100%;
          height: 200px;
          background: #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .deal-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .deal-image-placeholder {
          width: 100%;
          height: 200px;
          background: #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #9ca3af;
        }
        .deal-content {
          padding: 1rem;
        }
        .deal-title {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #1f2937;
          line-height: 1.4;
        }
        .deal-description {
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 0.75rem;
        }
        .deal-price {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          flex-wrap: wrap;
        }
        .current-price {
          font-size: 1.25rem;
          font-weight: 700;
          color: #e31837;
        }
        .original-price {
          font-size: 0.875rem;
          color: #9ca3af;
          text-decoration: line-through;
        }
        .discount {
          background: #dc2626;
          color: white;
          padding: 0.125rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .deal-meta {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          color: #6b7280;
          margin-bottom: 0.5rem;
        }
        .deal-availability {
          display: flex;
          gap: 0.5rem;
        }
        .badge {
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-weight: 500;
        }
        .badge.online {
          background: #dbeafe;
          color: #1e40af;
        }
        .badge.instore {
          background: #dcfce7;
          color: #166534;
        }
      `}</style>
    </div>
  )
}

