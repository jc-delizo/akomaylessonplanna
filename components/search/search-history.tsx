'use client'

import { useState, useEffect } from 'react'
import { Clock, X } from 'lucide-react'

interface SearchHistoryProps {
  onSelect: (query: string) => void
}

export function SearchHistory({ onSelect }: SearchHistoryProps) {
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Try to get from API (logged-in users)
    fetch('/api/search/recent')
      .then(res => res.json())
      .then(data => {
        if (data.searches && data.searches.length > 0) {
          setRecentSearches(data.searches.map((s: any) => s.query))
        } else {
          // Fallback to localStorage (anonymous users)
          const stored = localStorage.getItem('search_history')
          if (stored) {
            try {
              const history = JSON.parse(stored)
              setRecentSearches(Array.isArray(history) ? history.slice(0, 10) : [])
            } catch {
              setRecentSearches([])
            }
          }
        }
      })
      .catch(() => {
        // Fallback to localStorage
        const stored = localStorage.getItem('search_history')
        if (stored) {
          try {
            const history = JSON.parse(stored)
            setRecentSearches(Array.isArray(history) ? history.slice(0, 10) : [])
          } catch {
            setRecentSearches([])
          }
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const handleRemove = (query: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = recentSearches.filter(q => q !== query)
    setRecentSearches(updated)
    
    // Update localStorage
    localStorage.setItem('search_history', JSON.stringify(updated))
    
    // TODO: Also remove from database if logged in
  }

  if (loading) {
    return null
  }

  if (recentSearches.length === 0) {
    return null
  }

  return (
    <div className="p-2">
      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center justify-between">
        <span>Recent Searches</span>
      </div>
      {recentSearches.slice(0, 5).map((query, index) => (
        <button
          key={index}
          onClick={() => onSelect(query)}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 rounded-lg transition-colors group"
        >
          <Clock className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
          <span className="flex-1 text-sm text-gray-700 group-hover:text-purple-600">
            {query}
          </span>
          <button
            onClick={(e) => handleRemove(query, e)}
            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 rounded transition-all"
            aria-label="Remove from history"
          >
            <X className="w-3 h-3" />
          </button>
        </button>
      ))}
    </div>
  )
}
