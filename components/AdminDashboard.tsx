'use client'

import { useState, useEffect } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('whop_token')
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  }
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('categories')
  const [categories, setCategories] = useState<any[]>([])
  const [settings, setSettings] = useState<any>({})
  const [logs, setLogs] = useState<any[]>([])

  useEffect(() => {
    if (activeTab === 'categories') {
      fetchCategories()
    } else if (activeTab === 'settings') {
      fetchSettings()
    } else if (activeTab === 'logs') {
      fetchLogs()
    }
  }, [activeTab])

  const fetchLogs = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/logs`, {
        headers: getAuthHeaders()
      })
      
      if (response.status === 401 || response.status === 403) {
        alert('Authentication failed. Please login again.')
        window.location.href = '/'
        return
      }
      
      const data = await response.json()
      setLogs(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching logs:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/categories`, {
        headers: getAuthHeaders()
      })
      
      if (response.status === 401 || response.status === 403) {
        alert('Authentication failed. Please login again.')
        window.location.href = '/'
        return
      }
      
      const data = await response.json()
      setCategories(data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/settings`, {
        headers: getAuthHeaders()
      })
      
      if (response.status === 401 || response.status === 403) {
        alert('Authentication failed. Please login again.')
        window.location.href = '/'
        return
      }
      
      const data = await response.json()
      setSettings(data)
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const handleCreateCategory = async (name: string, slug: string) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/categories`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name, slug }),
      })
      
      if (response.status === 401 || response.status === 403) {
        alert('Authentication failed. Please login again.')
        window.location.href = '/'
        return
      }
      
      const data = await response.json()
      setCategories([...categories, data])
    } catch (error) {
      console.error('Error creating category:', error)
    }
  }

  const handleRefresh = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/refresh`, {
        method: 'POST',
        headers: getAuthHeaders()
      })
      
      if (response.status === 401 || response.status === 403) {
        alert('Authentication failed. Please login again.')
        window.location.href = '/'
        return
      }
      
      const data = await response.json()
      alert(`Refresh job ${data.status || 'triggered'}!`)
    } catch (error) {
      console.error('Error triggering refresh:', error)
      alert('Failed to trigger refresh')
    }
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-tabs">
        <button
          className={activeTab === 'categories' ? 'active' : ''}
          onClick={() => setActiveTab('categories')}
        >
          Categories
        </button>
        <button
          className={activeTab === 'settings' ? 'active' : ''}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
        <button
          className={activeTab === 'logs' ? 'active' : ''}
          onClick={() => setActiveTab('logs')}
        >
          Logs
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'categories' && (
          <div className="categories-panel">
            <h2>Manage Categories</h2>
            <CategoryForm onSubmit={handleCreateCategory} />
            <div className="categories-list">
              {categories.map((cat) => (
                <div key={cat.id} className="category-item">
                  <span>{cat.name}</span>
                  <span className={cat.is_active ? 'active' : 'inactive'}>
                    {cat.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings-panel">
            <h2>Settings</h2>
            <div className="setting-item">
              <label>Data Refresh Interval (minutes)</label>
              <input type="number" defaultValue={30} />
            </div>
            <button className="btn-primary" onClick={handleRefresh}>
              Manual Refresh Now
            </button>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="logs-panel">
            <h2>System Logs</h2>
            <div className="logs-list">
              {logs.length === 0 ? (
                <p>No logs found</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="log-item">
                    <div className="log-header">
                      <span className={`log-type log-type-${log.type}`}>{log.type}</span>
                      <span className="log-time">
                        {new Date(log.created_at || log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="log-message">{log.message}</div>
                    {log.data && Object.keys(log.data).length > 0 && (
                      <details className="log-data">
                        <summary>► Details</summary>
                        <div className="log-details-content">
                          {log.data.error ? (
                            <div>
                              <strong>Error:</strong>
                              <pre>{typeof log.data.error === 'string' ? log.data.error : JSON.stringify(log.data.error, null, 2)}</pre>
                            </div>
                          ) : (
                            <pre>{JSON.stringify(log.data, null, 2)}</pre>
                          )}
                        </div>
                      </details>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .admin-dashboard {
          margin: 2rem 0;
        }
        .admin-tabs {
          display: flex;
          gap: 1rem;
          border-bottom: 2px solid #e5e7eb;
          margin-bottom: 2rem;
        }
        .admin-tabs button {
          padding: 0.75rem 1.5rem;
          background: none;
          border: none;
          cursor: pointer;
          font-weight: 500;
          color: #6b7280;
          border-bottom: 2px solid transparent;
          margin-bottom: -2px;
        }
        .admin-tabs button.active {
          color: #e31837;
          border-bottom-color: #e31837;
        }
        .admin-content {
          background: white;
          padding: 2rem;
          border-radius: 0.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .categories-panel h2,
        .settings-panel h2,
        .logs-panel h2 {
          margin-bottom: 1.5rem;
        }
        .category-item {
          display: flex;
          justify-content: space-between;
          padding: 0.75rem;
          border-bottom: 1px solid #e5e7eb;
        }
        .category-item .active {
          color: #166534;
        }
        .category-item .inactive {
          color: #dc2626;
        }
        .setting-item {
          margin-bottom: 1rem;
        }
        .setting-item label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }
        .setting-item input {
          padding: 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 0.25rem;
          width: 200px;
        }
        .logs-list {
          max-height: 600px;
          overflow-y: auto;
        }
        .log-item {
          padding: 1rem;
          margin-bottom: 1rem;
          background: #f9fafb;
          border-radius: 0.25rem;
          border-left: 4px solid #6b7280;
        }
        .log-item .log-type-error {
          border-left-color: #dc2626;
        }
        .log-item .log-type-success {
          border-left-color: #166534;
        }
        .log-item .log-type-warning {
          border-left-color: #d97706;
        }
        .log-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }
        .log-type {
          padding: 0.25rem 0.75rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }
        .log-type-error {
          background: #fee2e2;
          color: #991b1b;
        }
        .log-type-success {
          background: #d1fae5;
          color: #065f46;
        }
        .log-type-warning {
          background: #fef3c7;
          color: #92400e;
        }
        .log-time {
          font-size: 0.875rem;
          color: #6b7280;
        }
        .log-message {
          margin-bottom: 0.5rem;
          color: #374151;
        }
        .log-data {
          margin-top: 0.5rem;
        }
        .log-data summary {
          cursor: pointer;
          color: #6b7280;
          font-size: 0.875rem;
        }
        .log-data pre {
          margin-top: 0.5rem;
          padding: 0.75rem;
          background: #1f2937;
          color: #f9fafb;
          border-radius: 0.25rem;
          overflow-x: auto;
          font-size: 0.75rem;
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        .log-details-content {
          margin-top: 0.5rem;
        }
        .log-details-content strong {
          color: #f9fafb;
          display: block;
          margin-bottom: 0.5rem;
        }
        .btn-primary {
          background: #e31837;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 0.25rem;
          cursor: pointer;
          font-weight: 500;
          margin-top: 1rem;
        }
        .btn-primary:hover {
          background: #c0142f;
        }
      `}</style>
    </div>
  )
}

function CategoryForm({ onSubmit }: { onSubmit: (name: string, slug: string) => void }) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name && slug) {
      onSubmit(name, slug)
      setName('')
      setSlug('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="category-form">
      <input
        type="text"
        placeholder="Category Name"
        value={name}
        onChange={(e) => {
          setName(e.target.value)
          setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))
        }}
      />
      <input
        type="text"
        placeholder="Slug"
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
      />
      <button type="submit">Add Category</button>
      <style jsx>{`
        .category-form {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .category-form input {
          flex: 1;
          padding: 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 0.25rem;
        }
        .category-form button {
          padding: 0.5rem 1.5rem;
          background: #e31837;
          color: white;
          border: none;
          border-radius: 0.25rem;
          cursor: pointer;
        }
      `}</style>
    </form>
  )
}

