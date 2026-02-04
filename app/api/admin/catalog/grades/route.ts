import { createAdminClient } from '@/lib/supabase/admin'
import { requireSuperAdmin } from '@/lib/middleware/admin-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const authResult = await requireSuperAdmin(request)
  if (!authResult.success) return authResult.response
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('grades')
      .select('*')
      .order('sort_order', { ascending: true })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data || [])
  } catch (err) {
    console.error('Error in GET /api/admin/catalog/grades:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireSuperAdmin(request)
  if (!authResult.success) return authResult.response
  try {
    const body = await request.json()
    const { name, sort_order = 0 } = body
    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('grades')
      .insert({
        name: String(name).trim(),
        sort_order: Number(sort_order) ?? 0,
      })
      .select()
      .single()
    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'Grade name already exists' }, { status: 409 })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('Error in POST /api/admin/catalog/grades:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
