import { createAdminClient } from '@/lib/supabase/admin'
import { requireSuperAdmin } from '@/lib/middleware/admin-auth'
import { NextRequest, NextResponse } from 'next/server'

const TABLE = 'curricula'

export async function GET(request: NextRequest) {
  const authResult = await requireSuperAdmin(request)
  if (!authResult.success) return authResult.response
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('sort_order', { ascending: true })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data || [])
  } catch (err) {
    console.error(`Error in GET /api/admin/catalog/${TABLE}:`, err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireSuperAdmin(request)
  if (!authResult.success) return authResult.response
  try {
    const body = await request.json()
    const { value, label, sort_order = 0 } = body
    if (!value || !label) {
      return NextResponse.json({ error: 'value and label are required' }, { status: 400 })
    }
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        value: String(value).trim().toLowerCase().replace(/\s+/g, '_'),
        label: String(label).trim(),
        sort_order: Number(sort_order) || 0,
      })
      .select()
      .single()
    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'Value already exists' }, { status: 409 })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error(`Error in POST /api/admin/catalog/${TABLE}:`, err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
