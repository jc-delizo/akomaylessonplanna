'use client'

import { CatalogOptionTable } from '@/components/admin/catalog/catalog-option-table'

export default function CurriculaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Curricula</h1>
        <p className="text-muted-foreground mt-1">
          Manage curriculum options (e.g. MATATAG, K to 12). Used in filters and product forms.
        </p>
      </div>
      <CatalogOptionTable
        title="Curricula"
        apiPath="curricula"
        fields={[
          { key: 'value', label: 'Value' },
          { key: 'label', label: 'Label' },
          { key: 'sort_order', label: 'Sort Order', type: 'number' },
        ]}
      />
    </div>
  )
}
