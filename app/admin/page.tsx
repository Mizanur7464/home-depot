'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import AdminDashboard from '@/components/AdminDashboard'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  const checkAuth = async () => {
    const token = localStorage.getItem('whop_token')
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    
    // Development bypass - allow access without authentication on localhost
    if (isLocalhost && !token) {
      console.log('🔓 Development mode: Admin access allowed without authentication')
      setIsAuthenticated(true)
      setLoading(false)
      return
    }

    if (!token) {
      console.log('❌ No token found')
      // In development, still allow access
      if (isLocalhost) {
        console.log('🔓 Development mode: Allowing access without token')
        setIsAuthenticated(true)
        setLoading(false)
        return
      }
      console.log('❌ Redirecting to home')
      window.location.href = '/'
      return
    }

    // Verify token with backend
    try {
      const response = await fetch(`${API_URL}/api/auth/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })

      const data = await response.json()

      if (response.ok && data.active) {
        console.log('✅ Admin authentication verified')
        setIsAuthenticated(true)
      } else {
        console.error('❌ Authentication failed:', data)
        // In development, allow access even if verification fails
        if (isLocalhost) {
          console.warn('⚠️ Verification failed, but allowing access in development mode')
          setIsAuthenticated(true)
        } else {
          // Token invalid or membership inactive
          localStorage.removeItem('whop_token')
          alert('Authentication failed. Please login again.')
          window.location.href = '/'
        }
      }
    } catch (error) {
      console.error('❌ Error verifying token:', error)
      // Network error - allow access in development, block in production
      if (isLocalhost) {
        console.warn('⚠️ Verification failed (network error), but allowing access in development mode')
        setIsAuthenticated(true)
      } else {
        alert('Unable to verify authentication. Please try again.')
        window.location.href = '/'
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  if (loading) {
    return (
      <div>
        <Header />
        <div className="loading">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <main>
      <Header />
      <div className="container">
        <h1 className="page-title">Admin Dashboard</h1>
        <AdminDashboard />
      </div>
    </main>
  )
}

