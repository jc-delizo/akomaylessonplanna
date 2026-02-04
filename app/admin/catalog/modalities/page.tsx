'use client'

import { CatalogOptionTable } from '@/components/admin/catalog/catalog-option-table'

export default function ModalitiesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Modalities</h1>
        <p className="text-muted-foreground mt-1">
          Manage teaching modalities (e.g. Face-to-face, Online). Used in filters and product forms.
        </p>
      </div>
      <CatalogOptionTable
        title="Modalities"
        apiPath="modalities"
        fields={[
          { key: 'value', label: 'Value' },
          { key: 'label', label: 'Label' },
          { key: 'sort_order', label: 'Sort Order', type: 'number' },
        ]}
      />
    </div>
  )
}
