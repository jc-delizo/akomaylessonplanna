import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-auth'

function getFileNameFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname
    const segment = path.split('/').filter(Boolean).pop() || ''
    const withoutTimestamp = segment.replace(/^\d+-/, '')
    return decodeURIComponent(withoutTimestamp || segment) || 'download'
  } catch {
    return 'download'
  }
}

/**
 * GET /api/admin/products/[id]/download-preview?index=0
 * Admin-only: get a signed URL for a pending product's file (for review).
 * Private bucket (product-files) requires signed URLs; this avoids "Bucket not found" / 404.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.success) return auth.response

    const { id: productId } = await params
    const index = Math.max(0, parseInt(request.nextUrl.searchParams.get('index') ?? '0', 10))

    const supabase = await createClient()
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('file_urls')
      .eq('id', productId)
      .single()

    if (productError || !product?.file_urls?.length) {
      return NextResponse.json({ error: 'Product or files not found' }, { status: 404 })
    }

    const fileUrl = product.file_urls[index]
    if (!fileUrl || typeof fileUrl !== 'string') {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Stored URL format: https://PROJECT.supabase.co/storage/v1/object/public/BUCKET/path/to/file
    let bucket: string
    let storagePath: string
    try {
      const pathname = new URL(fileUrl).pathname
      const parts = pathname.split('/').filter(Boolean)
      const publicIndex = parts.indexOf('public')
      if (publicIndex === -1 || parts.length < publicIndex + 3) {
        return NextResponse.json({ error: 'Invalid file URL format' }, { status: 400 })
      }
      bucket = parts[publicIndex + 1]
      storagePath = parts.slice(publicIndex + 2).join('/')
      if (!bucket || !storagePath) {
        return NextResponse.json({ error: 'Invalid file URL format' }, { status: 400 })
      }
    } catch {
      return NextResponse.json({ error: 'Invalid file URL' }, { status: 400 })
    }

    // Use admin client so we can create signed URLs for private buckets (product-files)
    const adminSupabase = createAdminClient()
    const { data: signed, error: urlError } = await adminSupabase.storage
      .from(bucket)
      .createSignedUrl(storagePath, 3600)

    if (urlError || !signed?.signedUrl) {
      console.error('Admin download-preview signed URL error:', urlError)
      return NextResponse.json(
        { error: 'Failed to generate download link' },
        { status: 500 }
      )
    }

    // Proxy the file so we can control the downloaded filename (strip timestamp prefix).
    const upstream = await fetch(signed.signedUrl)
    if (!upstream.ok || !upstream.body) {
      console.error('Admin download-preview fetch error:', upstream.status, upstream.statusText)
      return NextResponse.json({ error: 'Failed to fetch file' }, { status: 502 })
    }

    const filename = getFileNameFromUrl(fileUrl)
    const contentType = upstream.headers.get('content-type') || 'application/octet-stream'
    const contentLength = upstream.headers.get('content-length')

    const headers = new Headers()
    headers.set('Content-Type', contentType)
    headers.set(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`
    )
    if (contentLength) headers.set('Content-Length', contentLength)

    return new NextResponse(upstream.body, { status: 200, headers })
  } catch (e) {
    console.error('GET /api/admin/products/[id]/download-preview:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
