'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Plus, Pencil, Trash2, Loader2, ChevronDown, ChevronRight } from 'lucide-react'

interface ProductType {
  id: string
  slug: string
  label: string
  sort_order: number
  is_active: boolean
}

interface SpecificType {
  id: string
  product_type_id: string
  value: string
  label: string
  sort_order: number
  is_active: boolean
}

export default function ProductTypesPage() {
  const [productTypes, setProductTypes] = useState<ProductType[]>([])
  const [specificTypesByPt, setSpecificTypesByPt] = useState<Record<string, SpecificType[]>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [addSlug, setAddSlug] = useState('')
  const [addLabel, setAddLabel] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [addSpecificOpen, setAddSpecificOpen] = useState<string | null>(null)
  const [addSpecificValue, setAddSpecificValue] = useState('')
  const [addSpecificLabel, setAddSpecificLabel] = useState('')

  const fetchProductTypes = async () => {
    const res = await fetch('/api/admin/catalog/product-types')
    if (res.ok) {
      const data = await res.json()
      setProductTypes(data)
      for (const pt of data) {
        const stRes = await fetch(`/api/admin/catalog/product-types/${pt.id}/specific-types`)
        if (stRes.ok) {
          const stData = await stRes.json()
          setSpecificTypesByPt((prev) => ({ ...prev, [pt.id]: stData }))
        }
      }
    }
  }

  useEffect(() => {
    setLoading(true)
    fetchProductTypes().finally(() => setLoading(false))
  }, [])

  const handleAddProductType = async () => {
    if (!addSlug.trim() || !addLabel.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/catalog/product-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: addSlug.trim().toLowerCase().replace(/\s+/g, '_'),
          label: addLabel.trim(),
          sort_order: productTypes.length,
        }),
      })
      if (res.ok) {
        setAddOpen(false)
        setAddSlug('')
        setAddLabel('')
        fetchProductTypes()
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to add')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleAddSpecific = async (productTypeId: string) => {
    if (!addSpecificValue.trim() || !addSpecificLabel.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/catalog/product-types/${productTypeId}/specific-types`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          value: addSpecificValue.trim().toLowerCase().replace(/\s+/g, '_'),
          label: addSpecificLabel.trim(),
        }),
      })
      if (res.ok) {
        setAddSpecificOpen(null)
        setAddSpecificValue('')
        setAddSpecificLabel('')
        fetchProductTypes()
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to add')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteProductType = async (id: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/catalog/product-types/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setDeleteId(null)
        fetchProductTypes()
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to delete')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (pt: ProductType) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/catalog/product-types/${pt.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !pt.is_active }),
      })
      if (res.ok) fetchProductTypes()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Product Types</h1>
        <p className="text-muted-foreground mt-1">
          Manage product types. New types automatically get a category page at /categories/[slug].
        </p>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product Type
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="divide-y">
          {productTypes.map((pt) => (
            <div key={pt.id}>
              <div
                className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer"
                onClick={() => setExpandedId(expandedId === pt.id ? null : pt.id)}
              >
                <div className="flex items-center gap-2">
                  {expandedId === pt.id ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <span className="font-medium">{pt.label}</span>
                  <span className="text-muted-foreground text-sm">({pt.slug})</span>
                  {!pt.is_active && (
                    <span className="text-xs bg-muted px-2 py-0.5 rounded">Inactive</span>
                  )}
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleActive(pt)}
                    disabled={saving}
                  >
                    {pt.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setDeleteId(pt.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              {expandedId === pt.id && (
                <div className="bg-muted/30 p-4 pl-12">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium">Specific Types</h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setAddSpecificOpen(pt.id)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  <ul className="space-y-1 text-sm">
                    {(specificTypesByPt[pt.id] || []).map((st) => (
                      <li key={st.id} className="flex items-center justify-between py-1">
                        <span>
                          {st.label} <span className="text-muted-foreground">({st.value})</span>
                        </span>
                        {!st.is_active && (
                          <span className="text-xs text-muted-foreground">Inactive</span>
                        )}
                      </li>
                    ))}
                  </ul>
                  {addSpecificOpen === pt.id && (
                    <div className="mt-4 p-4 bg-background rounded border space-y-2 max-w-sm">
                      <Label>Value</Label>
                      <Input
                        value={addSpecificValue}
                        onChange={(e) => setAddSpecificValue(e.target.value)}
                        placeholder="e.g. periodical_exam"
                      />
                      <Label>Label</Label>
                      <Input
                        value={addSpecificLabel}
                        onChange={(e) => setAddSpecificLabel(e.target.value)}
                        placeholder="e.g. Periodical Exam"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAddSpecific(pt.id)}
                          disabled={saving}
                        >
                          Add
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setAddSpecificOpen(null)
                            setAddSpecificValue('')
                            setAddSpecificLabel('')
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {addOpen && (
        <Card className="p-6 max-w-md">
          <h3 className="font-medium mb-4">Add Product Type</h3>
          <div className="space-y-4">
            <div>
              <Label>Slug (URL-friendly, e.g. worksheets)</Label>
              <Input
                value={addSlug}
                onChange={(e) => setAddSlug(e.target.value)}
                placeholder="worksheets"
              />
            </div>
            <div>
              <Label>Label (Display name)</Label>
              <Input
                value={addLabel}
                onChange={(e) => setAddLabel(e.target.value)}
                placeholder="Worksheets"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleAddProductType} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Add
            </Button>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product type?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this product type. Products using it may break. Consider
              deactivating instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDeleteProductType(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
