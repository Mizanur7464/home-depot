'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const WHOP_CLIENT_ID = process.env.NEXT_PUBLIC_WHOP_CLIENT_ID || ''
const WHOP_REDIRECT_URI = process.env.NEXT_PUBLIC_WHOP_REDIRECT_URI || 'http://localhost:3001/api/auth/whop/callback'

export default function Header() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('whop_token')
    setIsAuthenticated(!!token)

    // Handle OAuth callback - check for token in URL
    const urlParams = new URLSearchParams(window.location.search)
    const tokenFromUrl = urlParams.get('token')
    
    if (tokenFromUrl) {
      localStorage.setItem('whop_token', tokenFromUrl)
      setIsAuthenticated(true)
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname)
      window.location.reload()
    }
  }, [])

  const handleLogin = () => {
    // Generate WHOP OAuth URL
    if (WHOP_CLIENT_ID) {
      const authUrl = `https://whop.com/oauth/authorize?client_id=${WHOP_CLIENT_ID}&redirect_uri=${encodeURIComponent(WHOP_REDIRECT_URI)}&response_type=code&scope=read_user`
      window.location.href = authUrl
    } else {
      // Development mode: Allow mock login
      if (window.location.hostname === 'localhost') {
        const mockToken = 'dev_mock_token_' + Date.now()
        localStorage.setItem('whop_token', mockToken)
        setIsAuthenticated(true)
        window.location.reload()
      } else {
        alert('WHOP Client ID not configured. Please set NEXT_PUBLIC_WHOP_CLIENT_ID in environment variables.')
      }
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('whop_token')
    setIsAuthenticated(false)
    window.location.reload()
  }

  return (
    <header className="header">
      <div className="container">
        <nav className="nav">
          <div className="logo">
            <Link href="/">HD Clearance</Link>
          </div>
          <button
            className="menu-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <div className={`nav-right ${isMenuOpen ? 'active' : ''}`}>
            {isAuthenticated ? (
              <>
                <Link href="/admin" className="nav-link">Admin</Link>
                <button onClick={handleLogout} className="btn-logout">
                  Logout
                </button>
              </>
            ) : (
              <button onClick={handleLogin} className="btn-login">
                Login with WHOP
              </button>
            )}
          </div>
        </nav>
      </div>
      <style jsx>{`
        .header {
          background: #fff;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 0;
        }
        .logo a {
          font-size: 1.5rem;
          font-weight: bold;
          color: #e31837;
        }
        .nav-right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .nav-link {
          color: #333;
          font-weight: 500;
          text-decoration: none;
        }
        .btn-login,
        .btn-logout {
          padding: 0.5rem 1.5rem;
          border-radius: 0.25rem;
          border: none;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s;
        }
        .btn-login {
          background: #e31837;
          color: white;
        }
        .btn-login:hover {
          background: #c0142f;
        }
        .btn-logout {
          background: #f3f4f6;
          color: #333;
        }
        .btn-logout:hover {
          background: #e5e7eb;
        }
        .menu-toggle {
          display: none;
          flex-direction: column;
          gap: 4px;
          background: none;
          border: none;
          cursor: pointer;
        }
        .menu-toggle span {
          width: 25px;
          height: 3px;
          background: #333;
          transition: all 0.3s;
        }
        @media (max-width: 768px) {
          .menu-toggle {
            display: flex;
          }
          .nav-right {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            flex-direction: column;
            padding: 1rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            transform: translateY(-100%);
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s;
          }
          .nav-right.active {
            transform: translateY(0);
            opacity: 1;
            visibility: visible;
          }
        }
      `}</style>
    </header>
  )
}
