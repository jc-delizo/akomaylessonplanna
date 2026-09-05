'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'
import { SearchSuggestions } from './search-suggestions'

interface SearchBarProps {
  initialQuery?: string
  placeholder?: string
  className?: string
  onSearch?: (query: string) => void
}

export function SearchBar({ 
  initialQuery = '', 
  placeholder = 'Search lesson plans...',
  className = '',
  onSearch
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery)
  const [isFocused, setIsFocused] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Handle click outside to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
        setIsFocused(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      // Track search
      fetch('/api/search/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() })
      }).catch(() => {})

      // Navigate to search results
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      setShowSuggestions(false)
      setIsFocused(false)
      if (onSearch) {
        onSearch(query.trim())
      }
    }
  }

  const handleClear = () => {
    setQuery('')
    inputRef.current?.focus()
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setShowSuggestions(e.target.value.length >= 2)
            }}
            onFocus={() => {
              setIsFocused(true)
              if (query.length >= 2) {
                setShowSuggestions(true)
              }
            }}
            onBlur={() => {
              // Delay to allow suggestion clicks
              setTimeout(() => {
                setIsFocused(false)
                setShowSuggestions(false)
              }, 200)
            }}
            placeholder={placeholder}
            aria-label={placeholder}
            className="h-11 rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-base shadow-sm transition focus-visible:border-orange-400 focus-visible:ring-2 focus-visible:ring-orange-100 md:text-sm"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {/* Search Suggestions */}
      {showSuggestions && isFocused && query.length >= 2 && (
        <SearchSuggestions
          query={query}
          onSelect={(selectedQuery) => {
            setQuery(selectedQuery)
            setShowSuggestions(false)
            setIsFocused(false)
            router.push(`/search?q=${encodeURIComponent(selectedQuery)}`)
          }}
          onClose={() => {
            setShowSuggestions(false)
            setIsFocused(false)
          }}
        />
      )}
    </div>
  )
}
