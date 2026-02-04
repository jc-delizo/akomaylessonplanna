'use client'

import { CatalogOptionTable } from '@/components/admin/catalog/catalog-option-table'

export default function TeachingFrameworksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Teaching Frameworks</h1>
        <p className="text-muted-foreground mt-1">
          Manage teaching frameworks (e.g. 4As, 5Es). Used in product forms for lesson plans.
        </p>
      </div>
      <CatalogOptionTable
        title="Teaching Frameworks"
        apiPath="teaching-frameworks"
        fields={[
          { key: 'value', label: 'Value' },
          { key: 'label', label: 'Label' },
          { key: 'sort_order', label: 'Sort Order', type: 'number' },
        ]}
      />
    </div>
  )
}
