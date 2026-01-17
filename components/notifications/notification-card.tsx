'use client'

import {
  DollarSign,
  Star,
  UserPlus,
  CheckCircle,
  XCircle,
  TrendingDown,
  Package,
  Megaphone,
} from 'lucide-react'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  action_url: string | null
  is_read: boolean
  created_at: string
}

interface NotificationCardProps {
  notification: Notification
}

const notificationIcons: Record<string, React.ReactNode> = {
  new_sale: <DollarSign className="h-5 w-5 text-green-600" />,
  new_review: <Star className="h-5 w-5 text-yellow-600" />,
  new_follower: <UserPlus className="h-5 w-5 text-blue-600" />,
  product_approved: <CheckCircle className="h-5 w-5 text-green-600" />,
  product_rejected: <XCircle className="h-5 w-5 text-red-600" />,
  price_drop: <TrendingDown className="h-5 w-5 text-purple-600" />,
  new_product: <Package className="h-5 w-5 text-indigo-600" />,
  system_announcement: <Megaphone className="h-5 w-5 text-orange-600" />,
}

export function NotificationCard({ notification }: NotificationCardProps) {
  const icon = notificationIcons[notification.type] || (
    <Package className="h-5 w-5 text-gray-600" />
  )

  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-sm text-gray-900">
            {notification.title}
          </h4>
          {!notification.is_read && (
            <div className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0 mt-1.5" />
          )}
        </div>
        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
          {notification.message}
        </p>
      </div>
    </div>
  )
}
