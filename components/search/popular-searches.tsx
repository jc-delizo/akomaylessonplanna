'use client'

import { useState, useEffect } from 'react'
import { TrendingUp } from 'lucide-react'

interface PopularSearchesProps {
  onSelect: (query: string) => void
}

export function PopularSearches({ onSelect }: PopularSearchesProps) {
  const [popularSearches, setPopularSearches] = useState<Array<{ query: string; count: number }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/search/popular')
      .then(res => res.json())
      .then(data => {
        setPopularSearches(data.searches?.slice(0, 5) || [])
      })
      .catch(err => {
        console.error('Error fetching popular searches:', err)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return null
  }

  if (popularSearches.length === 0) {
    return null
  }

  return (
    <div className="p-2">
      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
        <TrendingUp className="w-3 h-3" />
        <span>Popular This Week</span>
      </div>
      {popularSearches.map((item, index) => (
        <button
          key={index}
          onClick={() => onSelect(item.query)}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 rounded-lg transition-colors group"
        >
          <TrendingUp className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
          <span className="flex-1 text-sm text-gray-700 group-hover:text-purple-600">
            {item.query}
          </span>
          <span className="text-xs text-gray-400">{item.count}</span>
        </button>
      ))}
    </div>
  )
}
