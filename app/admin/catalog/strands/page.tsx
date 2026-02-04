'use client'

import { CatalogOptionTable } from '@/components/admin/catalog/catalog-option-table'

export default function StrandsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Strands</h1>
        <p className="text-muted-foreground mt-1">
          Manage SHS strands (Grade 11/12). Changes affect filters and product forms.
        </p>
      </div>
      <CatalogOptionTable
        title="Strands"
        apiPath="strands"
        fields={[
          { key: 'name', label: 'Name' },
          { key: 'code', label: 'Code' },
          { key: 'sort_order', label: 'Sort Order', type: 'number' },
        ]}
        valueKey="code"
        labelKey="name"
      />
    </div>
  )
}
