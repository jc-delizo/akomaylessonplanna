'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { NotificationDropdown } from './notification-dropdown'

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  // Poll for unread count every 30 seconds
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await fetch('/api/notifications/unread-count')
        const data = await response.json()
        setUnreadCount(data.count || 0)
      } catch (error) {
        console.error('Error fetching unread count:', error)
      }
    }

    // Fetch immediately
    fetchUnreadCount()

    // Then poll every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)

    return () => clearInterval(interval)
  }, [])

  // Refresh count when dropdown closes (notification might have been marked as read)
  const handleDropdownClose = () => {
    setIsOpen(false)
    // Refresh count after a short delay
    setTimeout(async () => {
      try {
        const response = await fetch('/api/notifications/unread-count')
        const data = await response.json()
        setUnreadCount(data.count || 0)
      } catch (error) {
        console.error('Error fetching unread count:', error)
      }
    }, 500)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center h-9 w-9 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Notifications"
        type="button"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
            {unreadCount >= 10 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {isOpen && (
        <NotificationDropdown
          onClose={handleDropdownClose}
          onNotificationRead={() => {
            // Decrement count optimistically
            setUnreadCount((prev) => Math.max(0, prev - 1))
          }}
        />
      )}
    </div>
  )
}
