import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { toPromise } from '@/lib/utils/supabase-promise'

/**
 * GET /api/products/[id]
 * Get product details by ID
 * Tracks view in product_views table
 */
const TRAFFIC_SOURCE_VALUES = ['search', 'marketplace', 'direct', 'profile', 'category', 'other'] as const

function normalizeSource(raw: string | null): string | null {
  if (!raw || typeof raw !== 'string') return 'direct'
  const lower = raw.trim().toLowerCase()
  if (TRAFFIC_SOURCE_VALUES.includes(lower as (typeof TRAFFIC_SOURCE_VALUES)[number])) return lower
  return 'other'
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const sourceParam = searchParams.get('source')
    const source = normalizeSource(sourceParam)

    // Get current user (if authenticated)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Fetch product with related data
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
        seller:users!products_seller_id_fkey(
          id,
          first_name,
          last_name,
          username,
          avatar_url,
          bio,
          is_verified_teacher,
          subscription_tier,
          is_pioneer,
          followers_count,
          response_time_hours,
          created_at
        ),
        grade:grades!products_grade_id_fkey(
          id,
          name,
          sort_order
        ),
        subject:subjects!products_subject_id_fkey(
          id,
          name,
          code
        ),
        strand:strands!products_strand_id_fkey(
          id,
          name,
          code
        )
      `)
      .eq('id', id)
      .single()

    if (error || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check access based on RLS
    // - Anyone can view published products
    // - Sellers can view their own products (any status)
    // - Admins can view any product
    if (product.status !== 'published') {
      if (!user) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }

      // Check if user is the seller or admin
      const { data: userData } = await supabase
        .from('users')
        .select('id, role')
        .eq('id', user.id)
        .single()

      const isOwner = user.id === product.seller_id
      const isAdmin = userData?.role === 'admin'

      if (!isOwner && !isAdmin) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }
    }

    // Track product view (asynchronously, don't block response)
    if (product.status === 'published') {
      toPromise(
        supabase
          .from('product_views')
          .insert({
            product_id: id,
            user_id: user?.id || null,
            source,
          })
      )
        .then(({ error: viewError }) => {
          if (viewError) {
            console.error('Failed to track product view:', viewError)
          }
        })
        .catch((err) => {
          console.error('Error tracking view:', err)
        })

      // Update views_count (optimistic update)
      toPromise(
        supabase
          .from('products')
          .update({
            views_count: (product.views_count || 0) + 1,
          })
          .eq('id', id)
      )
        .then(() => {})
        .catch((err) => {
          console.error('Error updating views count:', err)
        })
    }

    // Phase B: add subject_ids from product_subjects (multiselect)
    const { data: psRows } = await supabase
      .from('product_subjects')
      .select('subject_id')
      .eq('product_id', id)
      .order('sort_order', { ascending: true })
    const subject_ids = (psRows || []).map((r: { subject_id: string }) => r.subject_id)
    const productWithSubjects = { ...product, subject_ids: subject_ids.length > 0 ? subject_ids : [product.subject_id].filter(Boolean) }

    return NextResponse.json({ product: productWithSubjects })
  } catch (error) {
    console.error('Error in GET /api/products/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/products/[id]
 * Update product
 * If product is published, creates a version record
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch existing product
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('seller_id', user.id)
      .single()

    if (fetchError || !existingProduct) {
      return NextResponse.json(
        { error: 'Product not found or you do not have permission to edit it' },
        { status: 404 }
      )
    }

    // Parse request body
    const body = await request.json()

    // If product is published and files/content are being updated, create a version record
    const shouldCreateVersion =
      existingProduct.status === 'published' &&
      (body.file_urls || body.changelog)

    if (shouldCreateVersion) {
      // Require changelog for updates to published products
      if (!body.changelog || body.changelog.length < 20) {
        return NextResponse.json(
          { error: 'Changelog (min 20 characters) is required when updating published products' },
          { status: 400 }
        )
      }

      // Create version record
      const newVersion = existingProduct.current_version + 1
      const { error: versionError } = await supabase
        .from('product_updates')
        .insert({
          product_id: id,
          version_number: newVersion,
          changelog: body.changelog,
          file_urls: body.file_urls || existingProduct.file_urls,
          cover_image_url: body.cover_image_url || existingProduct.cover_image_url,
          previous_version: existingProduct.current_version,
          is_major_update: body.is_major_update || false,
          created_by: user.id,
        })

      if (versionError) {
        console.error('Error creating version:', versionError)
        return NextResponse.json(
          { error: 'Failed to create version record' },
          { status: 500 }
        )
      }

      // Update product with new version number and changelog
      body.current_version = newVersion
    }

    // Update product
    const updateData: any = {}

    // Phase B: subject_ids (multiselect) — replace product_subjects and set subject_id to first
    const subjectIds =
      body.subject_ids !== undefined
        ? (Array.isArray(body.subject_ids) ? body.subject_ids : [body.subject_ids]).filter((s: string) => s)
        : body.subject_id !== undefined
          ? [body.subject_id]
          : null
    if (subjectIds !== null && subjectIds.length > 0) {
      updateData.subject_id = subjectIds[0]
    } else if (body.subject_id !== undefined) {
      updateData.subject_id = body.subject_id
    }

    // Only update fields that are provided
    if (body.title) updateData.title = body.title
    if (body.description) updateData.description = body.description
    if (body.price !== undefined) updateData.price = body.price
    if (body.grade_id) updateData.grade_id = body.grade_id
    if (body.quarter !== undefined) updateData.quarter = body.quarter
    if (body.weeks) updateData.weeks = body.weeks
    if (body.product_type) updateData.product_type = body.product_type
    if (body.specific_type !== undefined) updateData.specific_type = body.specific_type
    if (body.theme !== undefined) updateData.theme = body.theme
    if (body.size !== undefined) updateData.size = body.size
    if (body.season !== undefined) updateData.season = body.season
    if (body.occasion !== undefined) updateData.occasion = body.occasion
    if (body.language) updateData.language = body.language
    if (body.curriculum !== undefined) updateData.curriculum = body.curriculum || null
    if (body.modalities !== undefined) updateData.modalities = Array.isArray(body.modalities) && body.modalities.length > 0 ? body.modalities : null
    if (body.teaching_framework !== undefined) updateData.teaching_framework = body.teaching_framework || null
    if (body.strand_id !== undefined) updateData.strand_id = body.strand_id ?? null
    if (body.grade_id !== undefined) updateData.grade_id = body.grade_id ?? null
    if (body.file_urls) updateData.file_urls = body.file_urls
    if (body.cover_image_url !== undefined) updateData.cover_image_url = body.cover_image_url
    if (body.preview_images !== undefined) updateData.preview_images = body.preview_images
    if (body.watermark_enabled !== undefined) updateData.watermark_enabled = body.watermark_enabled
    if (body.current_version !== undefined) updateData.current_version = body.current_version
    if (body.changelog !== undefined) updateData.changelog = body.changelog
    if (body.status !== undefined) updateData.status = body.status

    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .eq('seller_id', user.id)
      .select(`
        *,
        seller:users!products_seller_id_fkey(
          id,
          first_name,
          last_name,
          username,
          avatar_url
        ),
        grade:grades!products_grade_id_fkey(
          id,
          name
        ),
        subject:subjects!products_subject_id_fkey(
          id,
          name,
          code
        ),
        strand:strands!products_strand_id_fkey(
          id,
          name,
          code
        )
      `)
      .single()

    if (updateError) {
      console.error('Error updating product:', updateError)
      return NextResponse.json(
        { error: 'Failed to update product', details: updateError.message },
        { status: 500 }
      )
    }

    // Phase B: replace product_subjects when subject_ids provided
    if (subjectIds !== null && subjectIds.length > 0) {
      await supabase.from('product_subjects').delete().eq('product_id', id)
      await supabase.from('product_subjects').insert(
        subjectIds.map((sid: string, i: number) => ({
          product_id: id,
          subject_id: sid,
          sort_order: i,
        }))
      )
    }

    // Check for price drop notification (if price was lowered)
    if (body.price !== undefined && body.price < existingProduct.price) {
      try {
        const { createPriceDropNotification } = await import('@/lib/notifications/notification-triggers')
        // Get all users who have this product in their wishlist
        const { data: wishlistUsers } = await supabase
          .from('wishlist')
          .select('user_id')
          .eq('product_id', id)

        if (wishlistUsers && wishlistUsers.length > 0) {
          for (const wishlistItem of wishlistUsers) {
            await createPriceDropNotification(
              wishlistItem.user_id,
              id,
              existingProduct.title,
              parseFloat(existingProduct.price.toString()),
              parseFloat(body.price.toString())
            )
          }
        }
      } catch (notificationError) {
        console.error('Error creating price drop notifications:', notificationError)
      }
    }

    // Check if product was just published (status changed to published)
    if (body.status === 'published' && existingProduct.status !== 'published') {
      try {
        const { createNewProductNotification } = await import('@/lib/notifications/notification-triggers')
        const { data: sellerData } = await supabase
          .from('users')
          .select('first_name, last_name')
          .eq('id', user.id)
          .single()

        if (sellerData) {
          await createNewProductNotification(
            user.id,
            id,
            existingProduct.title,
            `${sellerData.first_name} ${sellerData.last_name || ''}`.trim()
          )
        }
      } catch (notificationError) {
        console.error('Error creating new product notifications:', notificationError)
      }
    }

    return NextResponse.json({
      product: updatedProduct,
      message: shouldCreateVersion
        ? `Product updated to version ${body.current_version}`
        : 'Product updated successfully',
    })
  } catch (error) {
    console.error('Error in PUT /api/products/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/products/[id]
 * Soft delete product (set status to 'deleted' and deleted_at timestamp)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('id, seller_id')
      .eq('id', id)
      .eq('seller_id', user.id)
      .single()

    if (fetchError || !product) {
      return NextResponse.json(
        { error: 'Product not found or you do not have permission to delete it' },
        { status: 404 }
      )
    }

    // Soft delete: set status to 'deleted' and deleted_at timestamp
    const { error: deleteError } = await supabase
      .from('products')
      .update({
        status: 'deleted',
        deleted_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('seller_id', user.id)

    if (deleteError) {
      console.error('Error deleting product:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete product' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Product deleted successfully (30-day grace period)' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in DELETE /api/products/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
