'use client'

import { useState, useEffect } from 'react'
import { Search, TrendingUp, Package, User, Hash, X } from 'lucide-react'
import { SearchHistory } from './search-history'
import { PopularSearches } from './popular-searches'

interface Suggestion {
  type: 'product' | 'subject' | 'seller' | 'popular'
  text: string
  url?: string
}

interface SearchSuggestionsProps {
  query: string
  onSelect: (query: string) => void
  onClose?: () => void
}

export function SearchSuggestions({ query, onSelect, onClose }: SearchSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(false)
  // Mobile: Bottom sheet, Desktop: Dropdown - MOVED TO TOP to fix hook order violation
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([])
      return
    }

    let cancelled = false
    setLoading(true)

    // Debounce API call
    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`)
        if (!cancelled && response.ok) {
          const data = await response.json()
          setSuggestions(data.suggestions || [])
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error fetching suggestions:', err)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }, 300)

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [query])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const getIcon = (type: string) => {
    switch (type) {
      case 'product':
        return <Package className="w-4 h-4" />
      case 'subject':
        return <Hash className="w-4 h-4" />
      case 'seller':
        return <User className="w-4 h-4" />
      case 'popular':
        return <TrendingUp className="w-4 h-4" />
      default:
        return <Search className="w-4 h-4" />
    }
  }

  if (loading && suggestions.length === 0) {
    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
        <div className="p-4 text-center text-gray-500">Loading suggestions...</div>
      </div>
    )
  }

  if (suggestions.length === 0 && query.length >= 2) {
    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
        <SearchHistory onSelect={onSelect} />
        <PopularSearches onSelect={onSelect} />
      </div>
    )
  }

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 md:hidden">
        <div 
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />
        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-lg shadow-lg max-h-[50vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between z-10">
            <h3 className="font-semibold">Search Suggestions</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-2">
            {suggestions.length > 0 && (
              <div className="p-2">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Suggestions
                </div>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      onSelect(suggestion.text)
                      onClose?.()
                    }}
                    className="w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors group min-h-[56px]"
                  >
                    <div className="text-gray-400 group-hover:text-purple-600 transition-colors">
                      {getIcon(suggestion.type)}
                    </div>
                    <span className="flex-1 text-sm text-gray-700 group-hover:text-purple-600">
                      {suggestion.text}
                    </span>
                  </button>
                ))}
              </div>
            )}
            <div className="border-t border-gray-200">
              <SearchHistory onSelect={(q) => {
                onSelect(q)
                onClose?.()
              }} />
            </div>
            <div className="border-t border-gray-200">
              <PopularSearches onSelect={(q) => {
                onSelect(q)
                onClose?.()
              }} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
      {/* Autocomplete Suggestions */}
      {suggestions.length > 0 && (
        <div className="p-2">
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Suggestions
          </div>
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => onSelect(suggestion.text)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 rounded-lg transition-colors group"
            >
              <div className="text-gray-400 group-hover:text-purple-600 transition-colors">
                {getIcon(suggestion.type)}
              </div>
              <span className="flex-1 text-sm text-gray-700 group-hover:text-purple-600">
                {suggestion.text}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Recent Searches */}
      <div className="border-t border-gray-200">
        <SearchHistory onSelect={onSelect} />
      </div>

      {/* Popular Searches */}
      <div className="border-t border-gray-200">
        <PopularSearches onSelect={onSelect} />
      </div>
    </div>
  )
}
