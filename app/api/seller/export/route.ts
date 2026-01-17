import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is a seller
    const { data: userData } = await supabase
      .from('users')
      .select('role, can_sell, subscription_tier')
      .eq('id', user.id)
      .single()

    if (!userData || userData.role !== 'seller' || !userData.can_sell) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { export_type, format, date_from, date_to } = body

    if (!['orders', 'products', 'earnings', 'analytics_report'].includes(export_type)) {
      return NextResponse.json({ error: 'Invalid export_type' }, { status: 400 })
    }

    if (!['csv', 'xlsx', 'pdf'].includes(format)) {
      return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
    }

    // Check if Pro/Pioneer for Excel/PDF
    const isProOrPioneer =
      userData.subscription_tier === 'pro' || userData.subscription_tier === 'pioneer'
    if ((format === 'xlsx' || format === 'pdf') && !isProOrPioneer) {
      return NextResponse.json(
        { error: 'Excel and PDF exports require Pro/Pioneer subscription' },
        { status: 403 }
      )
    }

    // Create export job
    const { data: exportJob, error } = await supabase
      .from('export_jobs')
      .insert({
        user_id: user.id,
        export_type,
        format,
        date_from: date_from || null,
        date_to: date_to || null,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating export job:', error)
      return NextResponse.json({ error: 'Failed to create export job' }, { status: 500 })
    }

    // Process export asynchronously (in production, use a queue system)
    // For now, process immediately
    processExportJob(exportJob.id, user.id, export_type, format, date_from, date_to, supabase)

    return NextResponse.json({ job_id: exportJob.id, status: 'processing' })
  } catch (error) {
    console.error('Error in POST /api/seller/export:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function processExportJob(
  jobId: string,
  userId: string,
  exportType: string,
  format: string,
  dateFrom: string | null,
  dateTo: string | null,
  supabase: any
) {
  try {
    // Update status to processing
    await supabase
      .from('export_jobs')
      .update({ status: 'processing' })
      .eq('id', jobId)

    let fileContent: string
    let fileName: string

    if (exportType === 'orders') {
      // Get orders
      let query = supabase
        .from('order_items')
        .select(
          `
          id,
          order_id,
          product_title,
          price_at_purchase,
          commission_amount,
          net_earnings,
          download_count,
          created_at,
          order:orders!order_items_order_id_fkey(
            payment_method,
            payment_status,
            buyer:users!orders_buyer_id_fkey(name, location_region)
          )
        `
        )
        .eq('seller_id', userId)

      if (dateFrom) {
        query = query.gte('created_at', dateFrom)
      }
      if (dateTo) {
        const toDate = new Date(dateTo)
        toDate.setHours(23, 59, 59, 999)
        query = query.lte('created_at', toDate.toISOString())
      }

      const { data: orders } = await query

      if (format === 'csv') {
        const headers = [
          'Order ID',
          'Date',
          'Product',
          'Buyer',
          'Location',
          'Price',
          'Commission',
          'Net Earnings',
          'Payment Method',
          'Status',
          'Downloads',
        ]

        const rows = (orders || []).map((order: any) => [
          order.order_id.slice(0, 8).toUpperCase(),
          new Date(order.created_at).toLocaleDateString(),
          order.product_title,
          order.order?.buyer?.name
            ? formatBuyerName(order.order.buyer.name)
            : 'Anonymous',
          order.order?.buyer?.location_region || 'N/A',
          `₱${order.price_at_purchase.toFixed(2)}`,
          `₱${order.commission_amount.toFixed(2)}`,
          `₱${order.net_earnings.toFixed(2)}`,
          order.order?.payment_method?.toUpperCase() || 'N/A',
          order.order?.payment_status?.toUpperCase() || 'N/A',
          order.download_count.toString(),
        ])

        fileContent = [headers, ...rows]
          .map((row) => row.map((cell) => `"${cell}"`).join(','))
          .join('\n')
        fileName = `orders-${new Date().toISOString().split('T')[0]}.csv`
      } else {
        // Excel/PDF - placeholder
        fileContent = 'Excel/PDF export requires additional libraries'
        fileName = `orders-${new Date().toISOString().split('T')[0]}.${format}`
      }
    } else if (exportType === 'products') {
      // Get products
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', userId)

      if (format === 'csv') {
        const headers = [
          'Title',
          'Price',
          'Status',
          'Views',
          'Sales',
          'Revenue',
          'Rating',
          'Reviews',
          'Conversion Rate',
          'Created Date',
        ]

        const rows = (products || []).map((product: any) => [
          product.title,
          `₱${product.price.toFixed(2)}`,
          product.status,
          (product.views_count || 0).toString(),
          (product.sales_count || 0).toString(),
          `₱${((product.price || 0) * (product.sales_count || 0) * 0.8).toFixed(2)}`,
          product.avg_rating ? product.avg_rating.toFixed(1) : 'N/A',
          (product.reviews_count || 0).toString(),
          product.conversion_rate ? `${product.conversion_rate.toFixed(2)}%` : '0%',
          new Date(product.created_at).toLocaleDateString(),
        ])

        fileContent = [headers, ...rows]
          .map((row) => row.map((cell) => `"${cell}"`).join(','))
          .join('\n')
        fileName = `products-${new Date().toISOString().split('T')[0]}.csv`
      } else {
        fileContent = 'Excel/PDF export requires additional libraries'
        fileName = `products-${new Date().toISOString().split('T')[0]}.${format}`
      }
    } else if (exportType === 'earnings') {
      // Get earnings data
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('net_earnings, created_at, order:orders!order_items_order_id_fkey(payment_status)')
        .eq('seller_id', userId)

      if (format === 'csv') {
        const headers = ['Date Range', 'Total Revenue', 'Commission Deducted', 'Net Earnings']

        const totalRevenue = (orderItems || [])
          .filter((item: any) => item.order?.payment_status === 'completed')
          .reduce((sum: number, item: any) => sum + parseFloat(item.net_earnings.toString()), 0)

        const commission = totalRevenue * 0.2 // 20% commission
        const netEarnings = totalRevenue

        const rows = [
          [
            dateFrom && dateTo
              ? `${dateFrom} to ${dateTo}`
              : dateFrom
              ? `From ${dateFrom}`
              : 'All Time',
            `₱${(totalRevenue + commission).toFixed(2)}`,
            `₱${commission.toFixed(2)}`,
            `₱${netEarnings.toFixed(2)}`,
          ],
        ]

        fileContent = [headers, ...rows]
          .map((row) => row.map((cell) => `"${cell}"`).join(','))
          .join('\n')
        fileName = `earnings-${new Date().toISOString().split('T')[0]}.csv`
      } else {
        fileContent = 'Excel/PDF export requires additional libraries'
        fileName = `earnings-${new Date().toISOString().split('T')[0]}.${format}`
      }
    } else {
      // analytics_report - placeholder
      fileContent = 'Analytics report export requires additional implementation'
      fileName = `analytics-${new Date().toISOString().split('T')[0]}.${format}`
    }

    // Save to Supabase Storage
    const filePath = `exports/${userId}/${jobId}/${fileName}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('exports')
      .upload(filePath, fileContent, {
        contentType: format === 'csv' ? 'text/csv' : format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })

    if (uploadError) {
      // If exports bucket doesn't exist, create it or use a different approach
      // For now, store file_url as a data URL or handle differently
      const fileUrl = `data:text/csv;base64,${Buffer.from(fileContent).toString('base64')}`

      await supabase
        .from('export_jobs')
        .update({
          status: 'completed',
          file_url: fileUrl,
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId)
    } else {
      // Get public URL
      const { data: urlData } = supabase.storage.from('exports').getPublicUrl(filePath)

      await supabase
        .from('export_jobs')
        .update({
          status: 'completed',
          file_url: urlData.publicUrl,
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId)
    }
  } catch (error) {
    console.error('Error processing export job:', error)
    await supabase
      .from('export_jobs')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId)
  }
}

function formatBuyerName(name: string): string {
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return `Teacher ${parts[0]} ${parts[parts.length - 1].charAt(0)}.`
  }
  return `Teacher ${name.charAt(0)}.`
}
