import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/utils/admin-auth'
import { getCategoriesData } from '@/lib/utils/admin-categories'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Eye } from 'lucide-react'
import Link from 'next/link'

export default async function CategoryManagementPage() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login?redirect=/admin/search/categories')
  }

  const adminUser = await getAdminUser(authUser.id)
  if (!adminUser) {
    redirect('/')
  }

  const { categories } = await getCategoriesData(supabase)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Category Management</h1>
          <p className="text-gray-600 mt-1">Manage category pages and SEO</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Category
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories?.length === 0 ? (
          <Card className="p-8 text-center col-span-3">
            <p className="text-gray-500 mb-4">No categories yet</p>
            <Button>Create First Category</Button>
          </Card>
        ) : (
          categories?.map((category: any) => (
            <Card key={category.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{category.name}</h3>
                  <p className="text-sm text-gray-500 mb-2">/{category.slug}</p>
                  {category.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {category.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>{category.productCount || 0} products</span>
                    {category.show_on_homepage && (
                      <Badge variant="outline" className="text-xs">
                        On Homepage
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
