import { createAdminClient } from '@/lib/supabase/admin'
import { requireSuperAdmin } from '@/lib/middleware/admin-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const authResult = await requireSuperAdmin(request)
  if (!authResult.success) return authResult.response
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data || [])
  } catch (err) {
    console.error('Error in GET /api/admin/catalog/subjects:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireSuperAdmin(request)
  if (!authResult.success) return authResult.response
  try {
    const body = await request.json()
    const { name, code, sort_order = 0 } = body
    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }
    const supabase = createAdminClient()
    const insertData: Record<string, unknown> = {
      name: String(name).trim(),
      sort_order: Number(sort_order) ?? 0,
    }
    if (code !== undefined) insertData.code = String(code).trim().toUpperCase()
    const { data, error } = await supabase
      .from('subjects')
      .insert(insertData)
      .select()
      .single()
    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'Subject name or code already exists' }, { status: 409 })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('Error in POST /api/admin/catalog/subjects:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
