import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ itemId: string }>
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { itemId } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the wishlist item belongs to the user
    const { data: wishlistItem, error: fetchError } = await supabase
      .from('wishlist')
      .select('user_id')
      .eq('id', itemId)
      .single()

    if (fetchError || !wishlistItem) {
      return NextResponse.json({ error: 'Wishlist item not found' }, { status: 404 })
    }

    if (wishlistItem.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete the wishlist item
    const { error } = await supabase
      .from('wishlist')
      .delete()
      .eq('id', itemId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error removing wishlist item:', error)
      return NextResponse.json({ error: 'Failed to remove item' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Item removed successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/wishlist/[itemId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
