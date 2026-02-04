'use client'

import { CatalogOptionTable } from '@/components/admin/catalog/catalog-option-table'

export default function GradesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Grades</h1>
        <p className="text-muted-foreground mt-1">
          Manage K-12 grade levels. Changes affect filters, product forms, and profile teaching tab.
        </p>
      </div>
      <CatalogOptionTable
        title="Grades"
        apiPath="grades"
        fields={[
          { key: 'name', label: 'Name' },
          { key: 'sort_order', label: 'Sort Order', type: 'number' },
        ]}
        valueKey="name"
        labelKey="name"
      />
    </div>
  )
}
