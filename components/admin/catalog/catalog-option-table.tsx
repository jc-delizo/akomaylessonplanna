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
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'

interface OptionRow {
  id: string
  value?: string
  slug?: string
  name?: string
  label: string
  sort_order: number
  is_active: boolean
}

interface CatalogOptionTableProps {
  title: string
  apiPath: string
  fields: { key: string; label: string; type?: 'text' | 'number' }[]
  valueKey?: string
  labelKey?: string
}

export function CatalogOptionTable({
  title,
  apiPath,
  fields,
  valueKey = 'value',
  labelKey = 'label',
}: CatalogOptionTableProps) {
  const [items, setItems] = useState<OptionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Record<string, string | number | boolean>>({})
  const [addOpen, setAddOpen] = useState(false)
  const [addValues, setAddValues] = useState<Record<string, string | number>>({})
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fetchItems = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/catalog/${apiPath}`)
      if (res.ok) {
        const data = await res.json()
        setItems(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [apiPath])

  const handleAdd = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/catalog/${apiPath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addValues),
      })
      if (res.ok) {
        setAddOpen(false)
        setAddValues({})
        fetchItems()
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to add')
      }
    } catch (err) {
      console.error(err)
      alert('Failed to add')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (id: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/catalog/${apiPath}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editValues),
      })
      if (res.ok) {
        setEditingId(null)
        setEditValues({})
        fetchItems()
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to update')
      }
    } catch (err) {
      console.error(err)
      alert('Failed to update')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/catalog/${apiPath}/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setDeleteId(null)
        fetchItems()
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to delete')
      }
    } catch (err) {
      console.error(err)
      alert('Failed to delete')
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (row: OptionRow) => {
    setEditingId(row.id)
    const vals: Record<string, string | number | boolean> = {}
    fields.forEach((f) => {
      const v = (row as unknown as Record<string, unknown>)[f.key]
      if (v !== undefined) vals[f.key] = v as string | number | boolean
    })
    vals.is_active = row.is_active
    setEditValues(vals)
  }

  const displayLabel = (row: OptionRow) => {
    const r = row as unknown as Record<string, unknown>
    return (r[labelKey] ?? row.value ?? row.name ?? row.label ?? '') as string
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading...
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                {fields.map((f) => (
                  <th key={f.key} className="text-left p-3 font-medium">
                    {f.label}
                  </th>
                ))}
                <th className="text-left p-3 font-medium">Active</th>
                <th className="text-right p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id} className="border-b">
                  {editingId === row.id ? (
                    <>
                      {fields.map((f) => (
                        <td key={f.key} className="p-2">
                          <Input
                            type={f.type || 'text'}
                            value={String(editValues[f.key] ?? '')}
                            onChange={(e) =>
                              setEditValues((prev) => ({
                                ...prev,
                                [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value,
                              }))
                            }
                            className="h-8 text-sm"
                          />
                        </td>
                      ))}
                      <td className="p-2">
                        <input
                          type="checkbox"
                          checked={Boolean(editValues.is_active)}
                          onChange={(e) =>
                            setEditValues((prev) => ({ ...prev, is_active: e.target.checked }))
                          }
                        />
                      </td>
                      <td className="p-2 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUpdate(row.id)}
                          disabled={saving}
                        >
                          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(null)
                            setEditValues({})
                          }}
                        >
                          Cancel
                        </Button>
                      </td>
                    </>
                  ) : (
                    <>
                      {fields.map((f) => (
                        <td key={f.key} className="p-3">
                          {String((row as unknown as Record<string, unknown>)[f.key] ?? '')}
                        </td>
                      ))}
                      <td className="p-3">
                        {row.is_active ? (
                          <span className="text-green-600">Yes</span>
                        ) : (
                          <span className="text-muted-foreground">No</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEdit(row)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteId(row.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {addOpen && (
        <Card className="p-4">
          <h3 className="font-medium mb-4">Add new</h3>
          <div className="grid gap-4 max-w-md">
            {fields.map((f) => (
              <div key={f.key}>
                <Label>{f.label}</Label>
                <Input
                  type={f.type || 'text'}
                  value={String(addValues[f.key] ?? '')}
                  onChange={(e) =>
                    setAddValues((prev) => ({
                      ...prev,
                      [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value,
                    }))
                  }
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleAdd} disabled={saving}>
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
            <AlertDialogTitle>Delete item?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this item. Existing products using it may show the raw value.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
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
