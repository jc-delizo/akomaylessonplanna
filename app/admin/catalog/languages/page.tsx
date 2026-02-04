'use client'

import { CatalogOptionTable } from '@/components/admin/catalog/catalog-option-table'

export default function LanguagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Languages</h1>
        <p className="text-muted-foreground mt-1">
          Manage languages of instruction. Used in filters and product forms.
        </p>
      </div>
      <CatalogOptionTable
        title="Languages"
        apiPath="languages"
        fields={[
          { key: 'value', label: 'Value' },
          { key: 'label', label: 'Label' },
          { key: 'sort_order', label: 'Sort Order', type: 'number' },
        ]}
      />
    </div>
  )
}
