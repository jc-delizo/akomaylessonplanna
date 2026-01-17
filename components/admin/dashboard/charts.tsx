'use client'

import { Card } from '@/components/ui/card'
import { ChartContainer } from '@/registry/default/chart/chart'

interface ChartsProps {
  userGrowthData?: Array<{ date: string; users: number }>
  salesByCategoryData?: Array<{ category: string; sales: number }>
  orderVolumeData?: Array<{ date: string; orders: number }>
  sellerPerformanceData?: Array<{ seller: string; revenue: number }>
}

export function AdminCharts({
  userGrowthData = [],
  salesByCategoryData = [],
  orderVolumeData = [],
  sellerPerformanceData = [],
}: ChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
      {/* Chart 1: User Growth Over Time */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">User Growth Over Time</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <p>Line chart (User Growth)</p>
            <p className="text-sm mt-2">Full implementation with Recharts/Chart.js</p>
            {userGrowthData.length > 0 && (
              <p className="text-xs mt-1 text-gray-400">
                {userGrowthData.length} data points
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Chart 2: Sales by Category */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Sales by Category</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <p>Bar chart (Sales by Category)</p>
            <p className="text-sm mt-2">Full implementation with Recharts/Chart.js</p>
            {salesByCategoryData.length > 0 && (
              <p className="text-xs mt-1 text-gray-400">
                {salesByCategoryData.length} categories
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Chart 3: Order Volume */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Order Volume</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <p>Line chart (Order Volume)</p>
            <p className="text-sm mt-2">Full implementation with Recharts/Chart.js</p>
            {orderVolumeData.length > 0 && (
              <p className="text-xs mt-1 text-gray-400">
                {orderVolumeData.length} data points
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Chart 4: Seller Performance */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Seller Performance (Top 10)</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <p>Bar chart (Top 10 Sellers)</p>
            <p className="text-sm mt-2">Full implementation with Recharts/Chart.js</p>
            {sellerPerformanceData.length > 0 && (
              <p className="text-xs mt-1 text-gray-400">
                {sellerPerformanceData.length} sellers
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
