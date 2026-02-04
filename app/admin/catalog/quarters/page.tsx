'use client'

import { CatalogOptionTable } from '@/components/admin/catalog/catalog-option-table'

export default function QuartersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Quarters</h1>
        <p className="text-muted-foreground mt-1">
          Manage quarter options (typically 1-4). Used in filters and product forms.
        </p>
      </div>
      <CatalogOptionTable
        title="Quarters"
        apiPath="quarters"
        fields={[
          { key: 'value', label: 'Value' },
          { key: 'label', label: 'Label' },
          { key: 'sort_order', label: 'Sort Order', type: 'number' },
        ]}
      />
    </div>
  )
}
