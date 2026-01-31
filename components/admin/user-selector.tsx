'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search } from 'lucide-react'
import { getFullName } from '@/lib/utils/profile'

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  username: string | null
}

interface UserSelectorProps {
  onSelect: (user: User) => void
  placeholder?: string
}

export function UserSelector({ onSelect, placeholder = 'Search users by name or email...' }: UserSelectorProps) {
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const fetchUsers = useCallback(async () => {
    if (!debouncedSearch.trim()) {
      setUsers([])
      return
    }
    setLoading(true)
    try {
      const res = await fetch(
        `/api/admin/users?search=${encodeURIComponent(debouncedSearch)}&limit=10`
      )
      const data = await res.json()
      if (res.ok && data.users) {
        setUsers(data.users)
      } else {
        setUsers([])
      }
    } catch {
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  return (
    <div className="space-y-2">
      <Label>Select User</Label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={placeholder}
          className="pl-10"
        />
      </div>
      {debouncedSearch && (
        <div className="border rounded-md max-h-48 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-sm text-muted-foreground">Searching...</div>
          ) : users.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">No users found</div>
          ) : (
            <ul className="divide-y">
              {users.map((user) => (
                <li key={user.id}>
                  <button
                    type="button"
                    className="w-full px-4 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => {
                      onSelect(user)
                      setSearch('')
                      setUsers([])
                    }}
                  >
                    <span className="font-medium">{getFullName(user)}</span>
                    <span className="text-muted-foreground ml-2">({user.email})</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
