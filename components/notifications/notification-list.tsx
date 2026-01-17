'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { NotificationCard } from './notification-card'
import { formatRelativeTime } from '@/lib/utils/date'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  action_url: string | null
  is_read: boolean
  created_at: string
}

export function NotificationList() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchNotifications()
  }, [filter, page])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/notifications?filter=${filter}&page=${page}&limit=20`
      )
      const data = await response.json()

      if (page === 1) {
        setNotifications(data.notifications || [])
      } else {
        setNotifications((prev) => [...prev, ...(data.notifications || [])])
      }

      setHasMore(
        data.pagination && page < data.pagination.totalPages
      )
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications/read-all', {
        method: 'PUT',
      })
      // Refresh notifications
      setPage(1)
      fetchNotifications()
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      try {
        await fetch(`/api/notifications/${notification.id}/read`, {
          method: 'PUT',
        })
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, is_read: true } : n
          )
        )
      } catch (error) {
        console.error('Error marking notification as read:', error)
      }
    }

    // Navigate to action URL if available
    if (notification.action_url) {
      router.push(notification.action_url)
    }
  }

  const handleDelete = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      })
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div>
      {/* Filter Tabs */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 border-b">
          <button
            onClick={() => {
              setFilter('all')
              setPage(1)
            }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              filter === 'all'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            All
          </button>
          <button
            onClick={() => {
              setFilter('unread')
              setPage(1)
            }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              filter === 'unread'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </button>
        </div>

        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            Mark all read
          </Button>
        )}
      </div>

      {/* Notifications List */}
      {loading && page === 1 ? (
        <div className="text-center py-12 text-gray-500">
          Loading notifications...
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-2">No notifications yet</p>
          <p className="text-gray-400 text-sm">
            {filter === 'unread'
              ? 'You have no unread notifications'
              : 'You will see notifications here when you receive them'}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
                  !notification.is_read ? 'bg-blue-50/50 border-blue-200' : 'bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <NotificationCard notification={notification} />
                    <div className="mt-2 text-xs text-gray-500">
                      {formatRelativeTime(notification.created_at)}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(notification.id)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    ×
                  </Button>
                </div>
                {notification.action_url && (
                  <div className="mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      View Details
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="text-center mt-6">
              <Button
                variant="outline"
                onClick={() => setPage((prev) => prev + 1)}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
